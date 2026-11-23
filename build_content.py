from html import escape
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parent
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
        page.write_text(rendered, encoding="utf-8")
        print(f"Updated {page.relative_to(ROOT)}")

    if not updates:
        print("Site copy is already up to date.")


if __name__ == "__main__":
    main()
