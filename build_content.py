import argparse
from html import escape
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
from pathlib import Path
import re
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parent
SECTION_ROUTES = ("about", "writing", "9-5")
GENERATED_COPY = re.compile(
    r"^(?P<indent>[ \t]*)<!-- BEGIN GENERATED COPY -->\n"
    r"(?P<body>.*?)"
    r"^(?P=indent)<!-- END GENERATED COPY -->$",
    re.MULTILINE | re.DOTALL,
)


def page_sources():
    yield ROOT / "index.html", ROOT / "content/about.txt"
    for section in ("writing", "work"):
        for source in sorted((ROOT / "content" / section).glob("*.txt")):
            if not source.is_file():
                continue
            page = ROOT / "pages" / section / source.with_suffix(".html").name
            if not page.is_file():
                raise SystemExit(f"{source.relative_to(ROOT)}: missing matching page {page.relative_to(ROOT)}")
            yield page, source


def render_page(html, text, page_name):
    blocks = list(GENERATED_COPY.finditer(html))
    if len(blocks) != 1:
        raise ValueError(f"{page_name}: expected exactly one generated copy block")

    block = blocks[0]
    indent = block["indent"]
    paragraphs = re.split(r"\n(?:[ \t]*\n)+", text.strip())
    body = "".join(
        f"{indent}<p>{escape(' '.join(paragraph.splitlines()), quote=False)}</p>\n"
        for paragraph in paragraphs if paragraph
    )
    return html[:block.start("body")] + body + html[block.end("body"):]


def main():
    updates = {}
    for page, source in page_sources():
        original = page.read_text(encoding="utf-8")
        rendered = render_page(original, source.read_text(encoding="utf-8"), page.relative_to(ROOT))
        if rendered != original:
            updates[page] = rendered

    for page, rendered in updates.items():
        page.parent.mkdir(parents=True, exist_ok=True)
        page.write_text(rendered, encoding="utf-8")
        print(f"Updated {page.relative_to(ROOT)}")

    if not updates:
        print("Site copy is already up to date.")


class PreviewHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_head(self):
        path = urlsplit(self.path).path
        homepage_paths = {"/", "/index.html"}
        for route in SECTION_ROUTES:
            homepage_paths.update((
                f"/{route}", f"/{route}/", f"/{route}/index.html",
                f"/pages/homepage/{route}/", f"/pages/homepage/{route}/index.html",
            ))
        if path not in homepage_paths:
            return super().send_head()
        content = (ROOT / "index.html").read_bytes().split(b"\n---\n", 1)[1]
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        return BytesIO(content)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build site copy and preview shared homepage routes.")
    parser.add_argument("--serve", action="store_true", help="Preview clean section URLs locally.")
    parser.add_argument("--port", type=int, default=8000, help="Local preview port (default: 8000).")
    args = parser.parse_args()
    main()
    if args.serve:
        with ThreadingHTTPServer(("127.0.0.1", args.port), PreviewHandler) as server:
            print(f"Preview: http://127.0.0.1:{args.port}/", flush=True)
            try:
                server.serve_forever()
            except KeyboardInterrupt:
                print("\nPreview stopped.")
