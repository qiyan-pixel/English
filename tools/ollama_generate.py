"""Use a local Ollama model to draft extra kid-friendly example sentences,
filtered by the same courseware-scope check as everything else on the site.

Runs on the machine where Ollama is running (stdlib only, no installs).

  1. Draft candidates (written to tools/generated/, never straight into data/):
       python3 tools/ollama_generate.py generate --lesson 1 --limit 20
  2. Open the generated file, delete any sentence you don't like, fix any
     Chinese that reads oddly.
  3. Merge the reviewed file into the site data and re-check:
       python3 tools/ollama_generate.py merge tools/generated/<file>.json
       python3 tools/check_data.py

Options: --model (default qwen3.5:9b-mlx), --per-word (default 2),
--into sentences|translations on merge (default sentences).
OLLAMA_HOST overrides the server address (default http://localhost:11434).
"""
import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
from scope_check import check_word, extract_english_words, load_corpus_words

DATA = HERE.parent / "data"
OUT_DIR = HERE / "generated"
HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434").rstrip("/")
if not HOST.startswith("http"):
    HOST = "http://" + HOST

SCHEMA = {
    "type": "object",
    "properties": {
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {"en": {"type": "string"}, "zh": {"type": "string"}},
                "required": ["en", "zh"],
            },
        }
    },
    "required": ["items"],
}

# Key order matches the existing files so diffs stay readable.
KEY_ORDER = {"sentences": ["id", "lesson", "en", "zh"], "translations": ["id", "lesson", "zh", "en"]}
ID_PREFIX = {"sentences": "s", "translations": "t"}


def load(name):
    return json.loads((DATA / f"{name}.json").read_text(encoding="utf-8"))


def write_data(name, items):
    order = KEY_ORDER[name]
    out = []
    for i, it in enumerate(items):
        if i and it["lesson"] != items[i - 1]["lesson"]:
            out.append("")  # the data files keep a blank line between lessons
        comma = "," if i < len(items) - 1 else ""
        out.append("  " + json.dumps({k: it[k] for k in order}, ensure_ascii=False, separators=(",", ":")) + comma)
    (DATA / f"{name}.json").write_text("[\n" + "\n".join(out) + "\n]\n", encoding="utf-8")


def word_forms(vocab_en):
    """'eat / ate' -> ['eat', 'ate']; '@ (at)' -> ['at']; 'go to work' -> ['go to work']."""
    text = re.sub(r"[()@!]", " ", vocab_en.lower())
    return [p.strip() for p in text.split("/") if p.strip()]


def mentions(sentence, vocab_en):
    s = " " + re.sub(r"[^a-z' ]", " ", sentence.lower()) + " "
    for form in word_forms(vocab_en):
        form = re.sub(r"[^a-z' ]", " ", form).strip()
        if " " in form:
            if f" {form} " in s:
                return True
        elif any(t == form or form in {t[:-1], t[:-2], t[:-3]} for t in s.split()):
            return True
    return False


def chat(model, prompt):
    body = {
        "model": model,
        "stream": False,
        "think": False,
        "format": SCHEMA,
        "options": {"temperature": 0.7},
        "messages": [{"role": "user", "content": prompt}],
    }
    for attempt in range(2):
        req = urllib.request.Request(f"{HOST}/api/chat", data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                return json.loads(json.loads(r.read())["message"]["content"])["items"]
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors="replace")
            # Non-thinking models may reject the think flag; retry once without it.
            if attempt == 0 and "think" in msg.lower():
                body.pop("think")
                continue
            raise RuntimeError(f"Ollama HTTP {e.code}: {msg}") from None
    return []


def generate(args):
    vocab, lessons = load("vocabulary"), {l["id"]: l for l in load("lessons")}
    existing = load("sentences") + load("translations")
    existing_en = {re.sub(r"\W+", " ", x["en"].lower()).strip() for x in existing}
    corpus = load_corpus_words()

    words = [v for v in vocab if args.lesson is None or v["lesson"] == args.lesson]
    # Words with no example sentence yet come first.
    words.sort(key=lambda v: sum(mentions(x["en"], v["en"]) for x in existing))
    words = words[: args.limit]

    try:
        urllib.request.urlopen(f"{HOST}/api/version", timeout=5)
    except Exception as e:
        sys.exit(f"Cannot reach Ollama at {HOST} ({e}). Is the Ollama app running?")

    results, rejected = [], 0
    for n, v in enumerate(words, 1):
        lesson = lessons[v["lesson"]]
        allowed = sorted({p for x in vocab if x["lesson"] <= v["lesson"] for p in word_forms(x["en"])})
        prompt = (
            f"You write example sentences for a Chinese child learning English (beginner level).\n"
            f"Write {args.per_word} different, very short English sentences (3-9 words) that use the word \"{v['en']}\" "
            f"(meaning: {v['zh']}). Grammar focus of this lesson: {lesson['grammar']}\n"
            f"Use ONLY these words plus basic words like a/an/the/I/you/he/she/it/we/they/my/your/is/am/are/not/and/in/on/at/to:\n"
            f"{', '.join(allowed)}\n"
            f"Each sentence must be natural, friendly and about everyday life. "
            f"Give a natural Simplified Chinese translation for each. "
            f"Return JSON: {{\"items\": [{{\"en\": \"...\", \"zh\": \"...\"}}]}}"
        )
        t0 = time.time()
        try:
            items = chat(args.model, prompt)
        except Exception as e:
            print(f"[{n}/{len(words)}] {v['en']}: error {e}")
            continue
        kept = []
        for it in items:
            en, zh = it.get("en", "").strip(), it.get("zh", "").strip()
            key = re.sub(r"\W+", " ", en.lower()).strip()
            bad = [w for w in extract_english_words(en) if not check_word(w, corpus)]
            if not en or not zh or bad or key in existing_en or not mentions(en, v["en"]) or len(key.split()) > 12:
                rejected += 1
                continue
            existing_en.add(key)
            kept.append({"lesson": v["lesson"], "word": v["en"], "en": en, "zh": zh})
        results += kept
        print(f"[{n}/{len(words)}] {v['en']}: kept {len(kept)}/{len(items)} ({time.time() - t0:.1f}s)")

    OUT_DIR.mkdir(exist_ok=True)
    out = OUT_DIR / f"lesson{args.lesson or 'all'}-{time.strftime('%Y%m%d-%H%M%S')}.json"
    out.write_text(json.dumps(results, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"\n{len(results)} sentence(s) kept, {rejected} rejected (out of scope / duplicate / missing the word).")
    print(f"Review: {out}\nThen:   python3 tools/ollama_generate.py merge {out.relative_to(HERE.parent)}")


def merge(args):
    reviewed = json.loads(Path(args.file).read_text(encoding="utf-8"))
    corpus = load_corpus_words()
    data = load(args.into)
    prefix = ID_PREFIX[args.into]
    seen = {re.sub(r"\W+", " ", x["en"].lower()).strip() for x in data}
    added = 0
    for it in reviewed:
        key = re.sub(r"\W+", " ", it["en"].lower()).strip()
        bad = [w for w in extract_english_words(it["en"]) if not check_word(w, corpus)]
        if key in seen or bad:
            print(f"skip: {it['en']}" + (f"  (out of scope: {', '.join(bad)})" if bad else "  (duplicate)"))
            continue
        lesson = it["lesson"]
        nums = [int(m.group(1)) for x in data if (m := re.fullmatch(rf"{prefix}{lesson}-(\d+)", x["id"]))]
        new = {"id": f"{prefix}{lesson}-{max(nums, default=0) + 1:02d}", "lesson": lesson, "en": it["en"], "zh": it["zh"]}
        last = max((i for i, x in enumerate(data) if x["lesson"] == lesson), default=len(data) - 1)
        data.insert(last + 1, new)
        seen.add(key)
        added += 1
    write_data(args.into, data)
    print(f"Added {added} item(s) to data/{args.into}.json. Now run: python3 tools/check_data.py")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    g = sub.add_parser("generate")
    g.add_argument("--lesson", type=int, help="only words from this lesson (default: all)")
    g.add_argument("--limit", type=int, default=20, help="max words to process (default 20)")
    g.add_argument("--per-word", type=int, default=2)
    g.add_argument("--model", default="qwen3.5:9b-mlx")
    m = sub.add_parser("merge")
    m.add_argument("file")
    m.add_argument("--into", choices=["sentences", "translations"], default="sentences")
    args = ap.parse_args()
    generate(args) if args.cmd == "generate" else merge(args)


if __name__ == "__main__":
    main()
