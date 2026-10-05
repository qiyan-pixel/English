"""Validate data/basic850.json (the Basic English 850 section).

Checks every target word is on Ogden's list (tools/basic850_words.txt), that no
word is taught twice, and that every scene actor points at a word of its scene.
Unlike data/*.json for the courseware, this section is NOT limited to the
courseware vocabulary, so check_data.py deliberately skips it.

Usage: python3 tools/check_basic850.py
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).parent
WORDS = {l.strip() for l in (HERE / "basic850_words.txt").read_text(encoding="utf-8").splitlines() if l.strip() and not l.startswith("#")}
data = json.loads((HERE.parent / "data" / "basic850.json").read_text(encoding="utf-8"))

errors, seen = [], {}
for sc in data["scenes"]:
    ids = set()
    for w in sc["words"]:
        if w["en"] not in WORDS:
            errors.append(f"{sc['id']}: '{w['en']}' is not one of the 850 words")
        if w["en"] in seen:
            errors.append(f"{sc['id']}: '{w['en']}' already taught in {seen[w['en']]}")
        seen[w["en"]] = sc["id"]
        if w["id"] != f"b850-{w['en']}":
            errors.append(f"{sc['id']}: id {w['id']} should be b850-{w['en']}")
        for k in ("zh", "pos", "pic", "example", "example_zh"):
            if not w.get(k):
                errors.append(f"{sc['id']}: '{w['en']}' is missing {k}")
        ids.add(w["id"])
    for a in sc["actors"]:
        if "word" in a and a["word"] not in ids:
            errors.append(f"{sc['id']}: actor {a['pic']} points at unknown word {a['word']}")

if errors:
    print("\n".join(errors))
    sys.exit(1)
print(f"OK: {len(seen)} of {len(WORDS)} Basic English words in {len(data['scenes'])} scenes.")
