# lsa-health.github.io

Public website of LabSense AI, a research prototype for clinicians reviewing complex laboratory histories. Static HTML, no build step on the server, no third-party request, no cookies.

- `index.html`: the home page, with the recorded SYN30 worked case, results cards, film, evidence summary, roadmap and evaluator access.
- `evidence.html`: feature status, the SYN30 run record with all 30 outcomes, earlier tests, AI, security and clinical status, and file checksums.
- `assets/site.css`, `assets/site.js`: the only stylesheet and script. Colour tokens are copied unchanged from the LabSense v5 design system.
- `assets/syn30/`: the nine synthetic SYN30 reports, rendered page crops, crops of the run's screen captures and eight full captures.
- `assets/media/`: the product film (clean and captioned MP4), its WebVTT captions and poster.

Every case on the site is synthetic. Nothing on the site reads, uploads or analyses files.
