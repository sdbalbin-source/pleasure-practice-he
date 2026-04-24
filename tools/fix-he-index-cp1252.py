# -*- coding: utf-8 -*-
"""
Fix hypnocards-v2-he/index.html mojibake: UTF-8 Hebrew bytes were shown as
Windows-1252 (and some raw C1 bytes as U+0080–U+009F).

Reverse: map each character back to a byte, then decode bytes as UTF-8.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

# Unicode char -> single byte, for bytes 0x00–0xFF under cp1252 decode
BYTE_FROM_CP1252_UNICODE: dict[str, int] = {}
for _b in range(256):
    try:
        _u = bytes([_b]).decode("cp1252")
    except UnicodeDecodeError:
        continue
    if len(_u) == 1:
        BYTE_FROM_CP1252_UNICODE[_u] = _b


def char_to_byte(c: str) -> int | None:
    o = ord(c)
    if o < 128:
        return o
    if c in BYTE_FROM_CP1252_UNICODE:
        return BYTE_FROM_CP1252_UNICODE[c]
    # Mojibake sometimes kept C1 controls as U+0080–U+009F (same code as byte)
    if 0x80 <= o <= 0x9F:
        return o
    return None


def fix_cp1252_mojibake_segment(s: str) -> str:
    out = bytearray()
    for c in s:
        b = char_to_byte(c)
        if b is not None:
            out.append(b)
        else:
            out.extend(c.encode("utf-8"))
    try:
        return out.decode("utf-8")
    except UnicodeDecodeError:
        return out.decode("utf-8", errors="replace")


HEBREW_RE = re.compile(r"[\u0590-\u05FF]")


def fix_render_embedded_line(line: str) -> str:
    m = re.search(
        r"^(?P<pre>\s*renderEmbeddedModule\()\s*'(?P<a>[^']*)'\s*,\s*(?P<path>'[^']+')\s*,\s*'(?P<b>[^']*)'\s*(?P<post>\);.*)$",
        line,
    )
    if not m:
        return line
    a, b = m.group("a"), m.group("b")
    if "\u00d7" in a or any(char_to_byte(ch) is not None for ch in a if ord(ch) > 127):
        a = fix_cp1252_mojibake_segment(a)
    if "\u00d7" in b or any(char_to_byte(ch) is not None for ch in b if ord(ch) > 127):
        b = fix_cp1252_mojibake_segment(b)
    return (
        f"{m.group('pre')}'{a}', {m.group('path')}, '{b}'{m.group('post')}"
    )


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    path = root / "hypnocards-v2-he" / "index.html"
    text = path.read_text(encoding="utf-8", newline="")

    preserve = sorted(
        [
            "./דפוסי שפה עברית/index.html",
            "מודול דפוסי שפה",
            "מודול מצפן תשוקות",
            "מעטפת עברית",
            "טוען בדיקות...",
            "טוען מודול...",
            "מצב מערכת",
            "חזרה →",
        ],
        key=len,
        reverse=True,
    )
    tokens: list[tuple[str, str]] = []
    for i, frag in enumerate(preserve):
        tok = f"@@HEB_KEEP_{i}@@"
        tokens.append((tok, frag))
        text = text.replace(frag, tok)

    raw_lines = text.split("\n")
    out_lines: list[str] = []
    for line in raw_lines:
        if "\u00d7" not in line and not re.search(r"[\u0080-\u009f]", line):
            out_lines.append(line)
            continue
        stripped = line.lstrip()
        if stripped.startswith("renderEmbeddedModule("):
            out_lines.append(fix_render_embedded_line(line))
            continue
        if "@@HEB_KEEP_" in line:
            out_lines.append(line)
            continue
        if HEBREW_RE.search(line):
            out_lines.append(line)
            continue
        out_lines.append(fix_cp1252_mojibake_segment(line))

    text = "\n".join(out_lines)
    for tok, frag in tokens:
        text = text.replace(tok, frag)

    path.write_text(text, encoding="utf-8", newline="\n")
    bad = text.count("\ufffd")
    sys.stdout.buffer.write(
        f"Wrote {path}; U+FFFD count={bad}\n".encode("ascii", errors="replace")
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
