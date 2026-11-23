# Audrey Writes Stuff

Edit `content/about.txt` for the paragraphs below the About bio, `content/writing/` for essays, and `content/work/` for 9–5 entries. Leave a blank line between paragraphs. The About bio, page titles, and labels stay in the HTML.

The script discovers essay and project text files automatically. Match the filename of the page: `content/writing/test.txt` fills `pages/writing/test.html`, and `content/work/test.txt` fills `pages/work/test.html`. New entries need a matching HTML page with the same copy markers and a link in `index.html`. Image assets live in `content/images/`.

After editing, run `python3 build_content.py` from the repository root, then refresh `index.html` in your browser. The script updates only the marked copy blocks. Keep the updated HTML when publishing so the site can display your text without JavaScript or a server.
