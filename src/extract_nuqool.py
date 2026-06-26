#!/usr/bin/env python3
"""
extract_nuqool.py
-----------------
Batch-extracts nuqool entries from photos of
"Al Lu'lu wal Marjan fi Nuqoolil Mahdi il Ma'ood Alaihissalam"
using Claude's vision API and outputs ready-to-paste JSX.

USAGE
-----
    # Install dependency
    pip install anthropic

    # Set your API key (get one at console.anthropic.com)
    export ANTHROPIC_API_KEY="sk-ant-..."

    # Run on a folder of page photos
    python extract_nuqool.py path/to/pages/

    # Or a single image
    python extract_nuqool.py path/to/page3.jpg

    # For Urdu (Arabic-script) pages add --urdu flag
    python extract_nuqool.py path/to/urdu_pages/ --urdu

OUTPUT
------
    nuqool_extracted.jsx         →  paste entries into src/nuqool/nuqool.jsx
    nuqoolKhulasa_extracted.jsx  →  paste entries into src/nuqool/nuqoolKhulasa.jsx

HOW THE SCRIPT READS THE PAGE
------------------------------
  Bold text      →  nuqoolObject  (the core narration)
  (citations)    →  kept inline inside the nuqool text
  Body text      →  nuqoolKhulasaObject  (explanation / khulasa)
  Arabic verse   →  placed in the khulasa block with dir="rtl"
"""

import anthropic
import base64
import json
import sys
from pathlib import Path


# ──────────────────────────────────────────────
# Image helpers
# ──────────────────────────────────────────────

SUPPORTED = {".jpg", ".jpeg", ".png", ".webp"}

def encode_image(path: str) -> tuple[str, str]:
    ext = Path(path).suffix.lower()
    media_type = {
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
        ".png": "image/png",  ".webp": "image/webp",
    }.get(ext, "image/jpeg")
    with open(path, "rb") as f:
        data = base64.standard_b64encode(f.read()).decode()
    return data, media_type


# ──────────────────────────────────────────────
# Extraction prompts
# ──────────────────────────────────────────────

PROMPT_TRANSLITERATION = """\
You are reading a page from the Islamic book
"Al Lu'lu wal Marjan fi Nuqoolil Mahdi il Ma'ood Alaihissalam".

For EVERY numbered Naql visible on this page, extract:

  naql_number  – the integer printed before the naql (e.g. 2)
  nuqool       – the BOLD main narration text only.
                 Keep inline citations exactly as printed, e.g. (Aqeeda Sharifa Pgno: 4).
                 Do NOT include the body-explanation paragraphs here.
  arabic_text  – any Arabic / Quranic verse shown verbatim (empty string if none)
  quran_ref    – Surah + Ayat reference, e.g. "Surah Yusuf - Ayat: 108" (empty string if none)
  khulasa      – ALL the regular-weight explanatory paragraphs that follow.
                 Separate paragraphs with \\n\\n. Preserve honorifics (AS, SAWS, RZ, RH).

Respond with ONLY a valid JSON array — no markdown, no extra text.

Example:
[
  {
    "naql_number": 2,
    "nuqool": "Hazrat Meeran (AS) ne farmaya ke hum kisi mazhab ke muqayyad nahi hain ... (Aqeeda Sharifa Pgno: 4)",
    "arabic_text": "قُلۡ ہٰذِہٖ سَبِیۡلِیۡۤ اَدۡعُوۡا ...",
    "quran_ref": "Surah Yusuf - Ayat: 108",
    "khulasa": "Rasool Allah (SAWS) ka mazhab Allah ka mazhab hai ...\\n\\nMujtahideen ke muta'alliq yeh aiteqaad hai ..."
  }
]
"""

PROMPT_URDU = """\
Aap ek Islami kitaab ke page ko parh rahe hain:
"Al Lu'lu wal Marjan fi Nuqoolil Mahdi il Ma'ood Alaihissalam" (Urdu nasl)

Har giraan-baha naql ke liye yeh fields nikaalein:

  naql_number  – naql ke aage likha hua integer (misal: 2)
  nuqool       – BOLD (mota) asli naql ka matn.
                 Hawale jaise (Aqeeda Sharifa Pgno: 4) bilkul waisi hi likhein.
                 Sharah ya khulasa is field mein na likhein.
  arabic_text  – agar Qurani aayat ho to bilkul copy karein (varna khali string)
  quran_ref    – Surah aur Ayat hawala (varna khali string)
  khulasa      – Naql ke baad ke tamam sharah ke paragraphs.
                 Paragraphs \\n\\n se alag karein.

SIRF valid JSON array likhein — koi markdown ya extra text nahi.
"""


# ──────────────────────────────────────────────
# API call
# ──────────────────────────────────────────────

def extract_page(client: anthropic.Anthropic, image_path: str, urdu: bool) -> list[dict]:
    b64, media = encode_image(image_path)
    prompt = PROMPT_URDU if urdu else PROMPT_TRANSLITERATION

    resp = client.messages.create(
        model="claude-opus-4-6",   # best vision accuracy; swap to claude-sonnet-4-6 to save cost
        max_tokens=4096,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image",
                 "source": {"type": "base64", "media_type": media, "data": b64}},
                {"type": "text", "text": prompt},
            ],
        }],
    )

    raw = resp.content[0].text.strip()
    # Strip accidental markdown code fences
    if raw.startswith("```"):
        lines = raw.splitlines()
        raw = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

    return json.loads(raw.strip())


# ──────────────────────────────────────────────
# JSX generation
# ──────────────────────────────────────────────

def esc(s: str) -> str:
    """Minimal JSX text escaping."""
    return s.replace("\\", "\\\\").strip()


def build_jsx(entries: list[dict], urdu: bool) -> tuple[str, str]:
    nuqool_lines:  list[str] = []
    khulasa_lines: list[str] = []

    rtl_attr = " dir='rtl'" if urdu else ""   # RTL for Urdu JSX paragraphs

    for e in entries:
        n  = e["naql_number"]
        nq = esc(e.get("nuqool", ""))
        ar = esc(e.get("arabic_text", ""))
        qr = esc(e.get("quran_ref", ""))
        kh = esc(e.get("khulasa", ""))

        # ── nuqoolObject entry ──────────────────
        nuqool_lines.append(
            f"  {n}: (\n    <p{rtl_attr}>{nq}</p>\n  ),"
        )

        # ── khulasa paragraphs ──────────────────
        if kh:
            # Split on the literal two-newline marker Claude outputs
            paras = [p.strip() for p in kh.replace("\\n\\n", "\n\n").split("\n\n") if p.strip()]
            para_block = "\n".join(f"        <p{rtl_attr}>{p}</p>" for p in paras)
        else:
            para_block = "        {/* khulasa tba */}"

        arabic_block = (
            f"\n        <p className='arabic' dir='rtl'>{ar}</p>" if ar else ""
        )
        quran_block = f"\n        <em>({qr})</em>" if qr else ""

        khulasa_lines.append(
            f"  {n}: (\n"
            f"    <>\n"
            f"      <details>\n"
            f"        <summary>Khulasa</summary>\n"
            f"{para_block}{arabic_block}{quran_block}\n"
            f"      </details>\n"
            f"    </>\n"
            f"  ),"
        )

    # ── nuqool.jsx output ───────────────────────
    nuqool_jsx = (
        "import React from 'react';\n\n"
        "// ── Shared name constants ─────────────────────────────\n"
        "export const KHUDA_T = \"Khuda e Ta'ala\";\n"
        "export const R_SAWS  = \"Rasool Allah S.A.W.S\";\n"
        "export const MAS     = \"Mahdi e Ma'ud A.S\";\n"
        "export const HBM     = \"Hazrat Bandagi Miyan\";\n"
        "export const BM      = \"Bandagi Miyan\";\n\n"
        "// ── Auto-generated — review before committing ─────────\n"
        "export const nuqoolObject = {\n"
        + "\n".join(nuqool_lines)
        + "\n};\n\nexport default nuqoolObject;\n"
    )

    # ── nuqoolKhulasa.jsx output ────────────────
    khulasa_jsx = (
        "import React from 'react';\n"
        "import { KHUDA_T, R_SAWS, MAS, HBM, BM } from './nuqool.jsx';\n"
        "export { KHUDA_T, R_SAWS, MAS, HBM, BM };\n\n"
        "// ── Auto-generated — review before committing ─────────\n"
        "export const nuqoolKhulasaObject = {\n"
        + "\n".join(khulasa_lines)
        + "\n};\n\nexport default nuqoolKhulasaObject;\n"
    )

    return nuqool_jsx, khulasa_jsx


# ──────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────

def main():
    args = sys.argv[1:]
    urdu = "--urdu" in args
    paths = [a for a in args if not a.startswith("--")]

    if not paths:
        print(__doc__)
        sys.exit(1)

    target = Path(paths[0])
    if target.is_dir():
        images = sorted(p for p in target.iterdir() if p.suffix.lower() in SUPPORTED)
    elif target.is_file():
        images = [target]
    else:
        sys.exit(f"Error: {target} not found")

    if not images:
        sys.exit("No supported images found (.jpg .jpeg .png .webp)")

    lang = "Urdu" if urdu else "transliteration"
    print(f"Found {len(images)} image(s) — mode: {lang}\n")

    client: anthropic.Anthropic = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY
    all_entries: list[dict] = []

    for i, img in enumerate(images, 1):
        print(f"  [{i}/{len(images)}] {img.name} … ", end="", flush=True)
        try:
            entries = extract_page(client, str(img), urdu)
            all_entries.extend(entries)
            nums = [e["naql_number"] for e in entries]
            print(f"✓  naql(s): {nums}")
        except json.JSONDecodeError as exc:
            print(f"✗  JSON parse error: {exc}")
        except Exception as exc:
            print(f"✗  {exc}")

    if not all_entries:
        sys.exit("\nNothing extracted — check image quality and API key.")

    # Sort by naql number, deduplicate (same naql_number = keep last)
    seen: dict[int, dict] = {}
    for e in all_entries:
        seen[e["naql_number"]] = e
    final = sorted(seen.values(), key=lambda x: x["naql_number"])

    nuqool_jsx, khulasa_jsx = build_jsx(final, urdu)

    suffix = "_urdu" if urdu else ""
    out_nuqool   = Path(f"nuqool_extracted{suffix}.jsx")
    out_khulasa  = Path(f"nuqoolKhulasa_extracted{suffix}.jsx")

    out_nuqool.write_text(nuqool_jsx,  encoding="utf-8")
    out_khulasa.write_text(khulasa_jsx, encoding="utf-8")

    print(f"\n✓  {len(final)} entries written.")
    print(f"   → {out_nuqool}")
    print(f"   → {out_khulasa}")
    print(
        "\nNext steps:"
        "\n  1. Open the extracted files and review for accuracy."
        "\n  2. Add <strong>/<em> tags inside nuqool text as needed."
        "\n  3. Paste the object entries into your src/nuqool/ files."
        "\n  4. Fill in any empty khulasa blocks."
    )


if __name__ == "__main__":
    main()
