# PDF.js for Science Papers

This is a fork of [PDF.js](https://mozilla.github.io/pdf.js/) with inline link previews for quickly exploring references and section/equation links. The preview feature is based on [PDFRefPreview](https://github.com/belinghy/PDFRefPreview.git).

## Getting the Code and Dependencies
- Install Node.js 15.14.0 (v88, newest version supported by [some dependencies](https://github.com/node-gfx/node-canvas-prebuilt/releases))
    - Install [nvm](https://github.com/nvm-sh/nvm#installing-and-updating), then run `nvm install 15.14.0`
- Clone repository: `git clone --recursive -b extension https://github.com/harskish/pdf.js.git`
- Install glup: `npm install -g gulp-cli`
- Install dependencies: `npm install --legacy-peer-deps`

For more complete instructions, please refer to the upstream [documentation](https://github.com/mozilla/pdf.js/blob/master/README.md).

## Building the Browser Extensions

### Chrome
- `gulp chromium`: places extension in `build/chromium`
- Open Chrome -> More Tools -> Extensions -> Developer Mode -> Load unpacked -> load folder `build/chromium`

### Firefox
- TODO

## Running server for local development
- `gulp server`
- Navigate to http://localhost:8888/web/viewer.html
- Specify file with: http://localhost:8888/web/viewer.html?file=../rebasin.pdf (relative to ./web)

It is also possible to view all test PDF files on the right side by opening: http://localhost:8888/test/pdfs/?frame


## Usage
- Open PDF in viewer. Only PDFs with embedded liks will work.
- Press q to activate link preview functionality
- Hover over a link (to section, equation, reference etc.), a pop-up preview will show up.

________________________________________________________________________________

## TODO
- Align popup with bottom of link element to prevent flickering on downward mouse movement
- Slight ~500ms delay to popup

## Potential future features
- Separately formatted previews for articles
    - Showing journal/conference name, authors, year etc.
    - Also add tests for parsing using real pdfs (or just strings)
- ML-based detection of links in PDF that are missing them?
