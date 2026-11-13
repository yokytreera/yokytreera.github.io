#!/usr/bin/env python3
"""
check-before-publish.py: run this before every commit / publish.

    python3 _scripts/check-before-publish.py

What it does, on every file that would go to GitHub (it skips _notes/, _site/,
.git/ and anything in .gitignore):

  1. Photos (.jpg, .jpeg, .png): removes hidden EXIF data in place, such as GPS
     location, camera model and the time the photo was taken. The picture
     itself is unchanged. clean-site.py does the same for the built website,
     but this one also protects the source copy that is pushed to GitHub.
  2. Warns about files that should not be public: spreadsheets, Word and
     PowerPoint files, zips, iPhone originals (HEIC, MOV), screenshots, PDFs
     other than the CV, and very large files.
  3. Warns about text that looks like a phone number or a Thai ID number in
     your pages.

It changes nothing except removing photo metadata. Warnings are for you to
read and fix by hand (usually: move the file into _notes/).
"""

import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SKIP_DIRS = ("_notes/", "_site/", ".quarto/", "_freeze/")
RISKY_EXT = {".csv", ".xlsx", ".xls", ".docx", ".doc", ".pptx", ".ppt", ".zip",
             ".heic", ".mov", ".rds", ".rdata", ".sav", ".dta", ".key", ".pem"}
ALLOWED_PDF = {"files/Yoky-Treerasoradaj-CV.pdf"}
BIG_MB = 25

PHONE = re.compile(r"(?<![\w/.-])(?:\+66|\+61|0[2-9])[\d ()-]{7,}\d")
THAI_ID = re.compile(r"(?<![\w/.-])\d(?:-?\d{4})(?:-?\d{5})(?:-?\d{2})-?\d(?![\w-])")


def files_going_public():
    """Tracked files plus new files git would add (respects .gitignore)."""
    out = subprocess.run(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard"],
        cwd=ROOT, capture_output=True, text=True, check=True).stdout
    for line in sorted(set(out.splitlines())):
        if line and not line.startswith(SKIP_DIRS) and (ROOT / line).is_file():
            yield line


def strip_photo(path):
    """Re-save the photo without EXIF. Returns True if something was removed."""
    from PIL import Image, ImageOps
    with Image.open(path) as im:
        exif = im.getexif()
        has_text_meta = any(k in im.info for k in ("exif", "xmp", "XML:com.adobe.xmp"))
        if not len(exif) and not has_text_meta:
            return False
        fmt = im.format
        clean = ImageOps.exif_transpose(im)   # keep the photo upright
        clean.load()
    if fmt == "JPEG":
        clean.convert("RGB").save(path, "JPEG", quality=92)
    else:
        clean.save(path, fmt)
    return True


def main():
    try:
        import PIL  # noqa: F401
    except ImportError:
        sys.exit("Pillow is missing. Install it once with:  pip3 install pillow")

    cleaned, warnings = [], []
    for rel in files_going_public():
        p = ROOT / rel
        ext = p.suffix.lower()
        name = p.name

        if ext in (".jpg", ".jpeg", ".png"):
            try:
                if strip_photo(p):
                    cleaned.append(rel)
            except Exception as e:  # unreadable image: tell the user
                warnings.append(f"could not read photo {rel}: {e}")

        if ext in RISKY_EXT:
            warnings.append(f"{rel}: this file type is usually private. Move it to _notes/.")
        if ext == ".pdf" and rel not in ALLOWED_PDF:
            warnings.append(f"{rel}: a PDF other than your CV. Is it meant to be public?")
        if name.startswith(("Screenshot", "IMG_", "Screen Shot")):
            warnings.append(f"{rel}: looks like a raw screenshot or phone photo. Rename it, "
                            "or move the original to _notes/.")
        if p.stat().st_size > BIG_MB * 1024 * 1024:
            warnings.append(f"{rel}: larger than {BIG_MB} MB. GitHub works best with small files.")

        if ext in (".qmd", ".md", ".yml", ".html", ".js"):
            text = p.read_text(encoding="utf-8", errors="ignore")
            for rx, what in ((PHONE, "a phone number"), (THAI_ID, "a Thai ID number")):
                for m in rx.finditer(text):
                    line = text.count("\n", 0, m.start()) + 1
                    warnings.append(f"{rel}:{line}: '{m.group(0)}' looks like {what}.")

    print("Photo metadata removed from:" if cleaned else "Photos: no hidden metadata found.")
    for c in cleaned:
        print("   ", c)
    if warnings:
        print(f"\n{len(warnings)} thing(s) to check before publishing:")
        for w in warnings:
            print("  !", w)
        sys.exit(1)
    print("All clear: nothing private found.")


if __name__ == "__main__":
    main()
