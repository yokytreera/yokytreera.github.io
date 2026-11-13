"""Safety net: runs automatically after every `quarto render` / `quarto publish`.

Quarto copies EVERY file inside a project folder into _site, even ones no page uses.
This script removes anything from _site that should never be on the public web,
and strips hidden location (GPS) and camera data from every photo.
You don't need to run it yourself.
"""
import os, pathlib

site = pathlib.Path(os.environ.get("QUARTO_PROJECT_OUTPUT_DIR", "_site"))
NEVER = {".zip", ".csv", ".xlsx", ".xls", ".docx", ".pptx", ".heic", ".mov", ".r", ".py", ".qmd", ".md", ".rds", ".rdata"}
ALLOWED_PDFS = {"files/Yoky-Treerasoradaj-CV.pdf"}

removed = []
for p in list(site.rglob("*")):
    if not p.is_file() or "site_libs" in p.parts:
        continue
    rel = p.relative_to(site).as_posix()
    name = p.name.lower()
    bad = (name == ".ds_store"
           or p.suffix.lower() in NEVER
           or name.startswith("screenshot")
           or (p.suffix.lower() == ".pdf" and rel not in ALLOWED_PDFS))
    if bad:
        p.unlink()
        removed.append(rel)

stripped = []
try:
    from PIL import Image
    for p in site.rglob("*"):
        if p.suffix.lower() not in (".jpg", ".jpeg", ".png") or "site_libs" in p.parts:
            continue
        with Image.open(p) as im:
            has_meta = bool(im.getexif()) or "xmp" in im.info or "XML:com.adobe.xmp" in im.info
            if not has_meta:
                continue
            icc = im.info.get("icc_profile")
            data = im.copy()
        kw = {"icc_profile": icc} if icc else {}
        if p.suffix.lower() in (".jpg", ".jpeg"):
            data.convert("RGB").save(p, quality=90, **kw)
        else:
            data.save(p, **kw)
        stripped.append(p.relative_to(site).as_posix())
except ImportError:
    print("clean-site: Pillow not installed, photo metadata not checked")

if removed:
    print("clean-site: removed from the public site:", ", ".join(removed))
if stripped:
    print("clean-site: removed hidden photo metadata from:", ", ".join(stripped))
