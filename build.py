"""Create a dependency-free HTML game from the editable source files."""
from pathlib import Path

root = Path(__file__).resolve().parent
src = root / "src"
html = (src / "index.html").read_text(encoding="utf-8")
css = (src / "style.css").read_text(encoding="utf-8")
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + css + '\n</style>')
for filename in ("core.js", "game.js"):
    code = (src / filename).read_text(encoding="utf-8")
    assert "</script" not in code.lower()
    html = html.replace(f'<script src="{filename}"></script>', '<script>\n' + code + '\n</script>')
out = root / "JUGAR.html"
out.write_text(html, encoding="utf-8")
print(f"Creado {out.name}: {out.stat().st_size:,} bytes. Sin dependencias externas.")
