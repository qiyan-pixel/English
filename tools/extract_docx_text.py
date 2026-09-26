"""Dump paragraphs and tables from a .docx into a flat, readable text file.

Used once per courseware file to pull out lesson content for curating the
site's data/*.json files. Kept here so a future Part 7+ file can be
processed the same way.

Usage: python3 extract_docx_text.py <input.docx> <output.txt>
"""
import sys

import docx
from docx.document import Document
from docx.oxml.ns import qn
from docx.table import Table
from docx.text.paragraph import Paragraph


def iter_block_items(parent):
    parent_elm = parent.element.body if isinstance(parent, Document) else parent._tc
    for child in parent_elm.iterchildren():
        if child.tag == qn("w:p"):
            yield Paragraph(child, parent)
        elif child.tag == qn("w:tbl"):
            yield Table(child, parent)


def dump(path, outpath):
    d = docx.Document(path)
    lines = []
    for block in iter_block_items(d):
        if isinstance(block, Paragraph):
            t = block.text.strip()
            if t:
                lines.append(t)
        else:
            lines.append("[TABLE]")
            for row in block.rows:
                cells = [c.text.strip().replace("\n", " | ") for c in row.cells]
                lines.append(" || ".join(cells))
            lines.append("[/TABLE]")
    with open(outpath, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"{path}: {len(lines)} lines -> {outpath}")


if __name__ == "__main__":
    dump(sys.argv[1], sys.argv[2])
