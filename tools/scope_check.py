"""Build the ground-truth word set from the 6 courseware .docx files (plus the
hand transcriptions of their embedded page images in image_text/), and
check any text (site data files, generated dialogue/chat prompts) against it.

This is the enforcement mechanism behind the site's core rule: nothing on
the site may use an English word that doesn't appear somewhere in the
courseware. It is deliberately lenient about plain English inflections
(plurals, -ed/-ing, etc.) so it flags genuinely new vocabulary, not just
different grammatical forms of a known word.

Usage:
  python3 scope_check.py build                 # writes corpus_words.json
  python3 scope_check.py check <file1> [...]   # reports out-of-scope words
"""
import glob
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).parent
COURSEWARE = HERE.parent / "courseware"
CORPUS_JSON = HERE / "corpus_words.json"
IMAGE_TEXT = HERE / "image_text"

# Basic function/grammar words and small closed classes that are pervasive
# in ordinary English and effectively already "in scope" for any beginner
# course, even if a specific token doesn't happen to appear verbatim in
# the source docx (e.g. a number spelled as a digit like "7:30").
EXTRA_ALLOWED = set("""
a an the to of and or but so because not no yes please excuse sorry thank
thanks very too also just still again together than if when while until
well okay ok right wrong sure maybe really actually
one two three four five six seven eight nine ten
eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty
thirty forty fifty sixty seventy eighty ninety hundred thousand
o'clock am pm
""".split())


def load_corpus_words():
    with open(CORPUS_JSON, encoding="utf-8") as f:
        return set(json.load(f))


def build():
    import docx
    from docx.document import Document as _Document
    from docx.oxml.ns import qn
    from docx.table import Table
    from docx.text.paragraph import Paragraph

    def iter_block_items(parent):
        parent_elm = parent.element.body if isinstance(parent, _Document) else parent._tc
        for child in parent_elm.iterchildren():
            if child.tag == qn("w:p"):
                yield Paragraph(child, parent)
            elif child.tag == qn("w:tbl"):
                yield Table(child, parent)

    text_parts = []
    for path in sorted(glob.glob(str(COURSEWARE / "*.docx"))):
        d = docx.Document(path)
        for block in iter_block_items(d):
            if isinstance(block, Paragraph):
                text_parts.append(block.text)
            else:
                for row in block.rows:
                    for cell in row.cells:
                        text_parts.append(cell.text)

    # The docx files embed scanned textbook pages as images; their English was
    # transcribed by hand into image_text/ so it counts as courseware too.
    for path in sorted(IMAGE_TEXT.glob("*.txt")):
        text_parts.append(path.read_text(encoding="utf-8"))

    text = "\n".join(text_parts)
    text = text.replace("’", "'").replace("‘", "'")
    tokens = re.findall(r"[A-Za-z][A-Za-z'\-]*", text)
    words = {t.lower().strip("'-") for t in tokens if t}
    words |= EXTRA_ALLOWED

    with open(CORPUS_JSON, "w", encoding="utf-8") as f:
        json.dump(sorted(words), f, ensure_ascii=False, indent=1)
    print(f"Wrote {len(words)} unique words to {CORPUS_JSON}")


def stem_variants(word):
    """Cheap English inflection variants so 'wants' matches 'want', etc."""
    w = word
    variants = {w}
    if w.endswith("ies") and len(w) > 4:
        variants.add(w[:-3] + "y")
    if w.endswith("es") and len(w) > 3:
        variants.add(w[:-2])
        variants.add(w[:-1])
    if w.endswith("s") and len(w) > 3:
        variants.add(w[:-1])
    if w.endswith("ing") and len(w) > 5:
        variants.add(w[:-3])
        variants.add(w[:-3] + "e")
        if len(w) > 6 and w[-4] == w[-5]:
            variants.add(w[:-4])
    if w.endswith("ied") and len(w) > 4:
        variants.add(w[:-3] + "y")
    if w.endswith("ed") and len(w) > 4:
        variants.add(w[:-2])
        variants.add(w[:-1])
        if len(w) > 5 and w[-3] == w[-4]:
            variants.add(w[:-3])
    return variants


def check_word(word, corpus):
    w = word.lower()
    if w in corpus:
        return True
    if any(v in corpus for v in stem_variants(w)):
        return True
    # Symmetric case: query is singular/base but corpus only has the
    # inflected form (e.g. "stranger" queried, corpus only has "strangers").
    grown = {w + "s", w + "es", w + "d", w + "ed", w + "ing"}
    if w.endswith("y"):
        grown.add(w[:-1] + "ies")
    if any(v in corpus for v in grown):
        return True
    return False


def extract_english_words(text):
    # Drop anything inside CJK ranges' neighborhood is irrelevant; just pull
    # ascii word tokens (skips Chinese glosses embedded alongside English).
    text = text.replace("’", "'").replace("‘", "'")
    return re.findall(r"[A-Za-z][A-Za-z'\-]*", text)


def check_files(paths):
    corpus = load_corpus_words()
    out_of_scope = {}
    for path in paths:
        text = Path(path).read_text(encoding="utf-8")
        for w in extract_english_words(text):
            if not check_word(w, corpus):
                out_of_scope.setdefault(w.lower(), []).append(path)
    if not out_of_scope:
        print("OK: every English word is within the courseware scope.")
        return 0
    print(f"OUT OF SCOPE: {len(out_of_scope)} word(s) not found in the courseware:")
    for w, paths_ in sorted(out_of_scope.items()):
        uniq = sorted(set(paths_))
        print(f"  {w}  (in: {', '.join(uniq)})")
    return 1


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    if sys.argv[1] == "build":
        build()
    elif sys.argv[1] == "check":
        sys.exit(check_files(sys.argv[2:]))
    else:
        print(__doc__)
        sys.exit(1)
