# Huey · Portfolio

Personal data science / ML portfolio, live at **https://tiqfds.github.io/portfolio-website/**.

Plain HTML, CSS and vanilla JavaScript. No build step and no dependencies (fonts come from Google Fonts).

```
index.html            page content (sections + project dialogs)
assets/css/style.css  styles, dark/light themes, animations
assets/js/main.js     interactions: theme toggle, nav, scroll reveal, counters,
                      project modals, timeline filter, skills explorer, network canvas
assets/img/           favicon, Open Graph image, UPF scanner demo (GIF, WebM, posters)
.nojekyll             tells GitHub Pages to serve files as-is
```

## Preview locally

All asset paths are relative, so the site works at the root or under `/portfolio-website/`.

```bash
# from the folder that contains portfolio-website/
python -m http.server 8000
# open http://localhost:8000/portfolio-website/
```

## Publish with GitHub Pages

1. Push these files to the `main` branch of `tiqfds/portfolio-website` (files at the repo root).
2. On GitHub, go to **Settings > Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**, then pick **main** and **/ (root)** and click **Save**.
4. After a minute or two the site is live at https://tiqfds.github.io/portfolio-website/.

## Editing

- Text lives in `index.html`. Each project's detail view is a `<dialog>` near the bottom of the file.
- The "where I've used it" text for each skill is the `E` map in `assets/js/main.js`.
- Theme colors are CSS variables at the top of `assets/css/style.css`.
