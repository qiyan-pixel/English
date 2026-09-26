"""Check every data/*.json file's English text fields against the courseware
vocabulary scope (tools/corpus_words.json). Run after editing any data file.

Usage: python3 tools/check_data.py
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from scope_check import check_word, extract_english_words, load_corpus_words

DATA = Path(__file__).parent.parent / "data"

# field name -> which files/keys hold English text worth checking
TARGETS = {
    "vocabulary.json": {"item_fields": ["en", "example", "note"]},
    "sentences.json": {"item_fields": ["en"]},
    "translations.json": {"item_fields": ["en"]},
    "questions.json": {"item_fields": ["en"]},
    "dialogues.json": {"item_fields": ["en"], "nested": "lines"},
}


def walk_strings(obj, field_names):
    """Yield English text values for the configured fields, recursing into
    lists so dialogue turns (lines: [...]) are covered too."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in field_names and isinstance(v, str):
                yield v
            elif isinstance(v, (dict, list)):
                yield from walk_strings(v, field_names)
    elif isinstance(obj, list):
        for item in obj:
            yield from walk_strings(item, field_names)


def main():
    corpus = load_corpus_words()
    out = {}
    for fname, cfg in TARGETS.items():
        path = DATA / fname
        if not path.exists():
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        for text in walk_strings(data, set(cfg["item_fields"])):
            for w in extract_english_words(text):
                if not check_word(w, corpus):
                    out.setdefault(w.lower(), set()).add(f"{fname}: {text[:60]}")

    if not out:
        print("OK: all data/*.json English text is within the courseware scope.")
        return 0
    print(f"{len(out)} out-of-scope word(s):")
    for w, contexts in sorted(out.items()):
        print(f"  {w}")
        for c in sorted(contexts)[:3]:
            print(f"      {c}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
