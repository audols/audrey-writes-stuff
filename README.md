# Audrey Writes Stuff

Edit `content/about.txt` for the paragraphs below the About bio, `content/writing/` for essays, and `content/work/` for 9–5 entries. Leave a blank line between paragraphs. The About bio, page titles, and labels stay in the HTML.

The script discovers essay and project text files automatically. Match the filename of the page: `content/writing/test.txt` fills `pages/writing/test.html`, and `content/work/test.txt` fills `pages/work/test.html`. New entries need a matching HTML page with the same copy markers and a link in `index.html`. Image assets live in `content/images/`.

The homepage markup lives only in the root `index.html`. The small route files under `pages/homepage/` reuse its content through Jekyll. Their permalinks publish the sections at `/about`, `/writing`, and `/9-5` on GitHub Pages, without duplicating the source markup or needing a separate layout file.

After editing copy, run `python3 build_content.py` from the repository root to update the marked HTML blocks. Keep the updated HTML when publishing, and leave Jekyll enabled (do not add `.nojekyll`). Edit `index.html` for the About bio, labels, links, or homepage structure. Keep its opening front matter so Jekyll can expose its content to the route files.

To build and preview, run `python3 build_content.py --serve` from the repository root and open `http://127.0.0.1:8000`. This preview server handles the same clean section URLs as GitHub Pages; a plain `python3 -m http.server` does not. Use `--port 8001` to choose another port.
