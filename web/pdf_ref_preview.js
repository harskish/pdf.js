async function togglePreview() {
  const app = window.PDFViewerApplication;
  const anchor = document.getElementById("viewer");

  if ("_previewHandler" in app) {
    console.log("Removing link preview handler")
    anchor.removeEventListener("mouseover", app._previewHandler);
    delete app._previewHandler;
    delete app._previewing;
    return;
  }

  console.log("Adding link preview handler")
  const box = anchor.getBoundingClientRect();
  const halfWidth = (box.left + box.right) / 2;
  const destinations = await app.pdfDocument.getDestinations();
  app._previewing = false;

  async function mouseoverHandler(event) {
    const target = event.target;
    //console.log(`Entering ${target.className}`);

    // Entering hyperlink?
    if (target.tagName != 'A' || app._previewing) return;

    // Place preview at the bottom of the annotation box
    var rect = target.getBoundingClientRect();
    const top = rect.top + rect.height + 4;
    
    //const parent = target.parentElement;
    const preview = document.createElement("canvas");
    const previewStyle = preview.style;
    previewStyle.border = "1px solid black";
    previewStyle.direction = "ltr";
    previewStyle.position = "fixed";
    previewStyle.zIndex = "99"; // on top of everything else (incl. link outline)
    previewStyle.top = `${top}px`;
    previewStyle.boxShadow = "5px 5px 5px black, -5px 5px 5px black";

    const encodedRef = target.href.split("#")[1]
    const namedDest = decodeURIComponent(encodedRef);
    const explicitDest =
      namedDest in destinations
        ? destinations[namedDest]
        : JSON.parse(namedDest);
    const pageNumber = app.pdfLinkService._cachedPageNumber(explicitDest[0]);

    app.pdfDocument.getPage(pageNumber).then(function (page) {
      const tempViewport = page.getViewport({ scale: 1.0 });
      const height = tempViewport.height * 1.2 * app.pdfViewer.currentScale;
      const width = tempViewport.width * 1.2 * app.pdfViewer.currentScale;
      const leftOffset =
        event.clientX > halfWidth ? (2 * width) / 3 : width / 3;
      
      previewStyle.height = `${height}px`;
      previewStyle.width = `${width}px`;
      previewStyle.left = `${event.clientX - leftOffset - 4}px`;

      let offsetY;
      switch (explicitDest[1].name) {
        case "XYZ":
          offsetY = explicitDest[3];
          break;
        case "FitH":
        case "FitBH":
        case "FitV":
        case "FitBV":
          offsetY = explicitDest[2];
          break;
        default:
          console.log(`Oops, link ${explicitDest[1].name} is not supported.`);
      }

      const scale = 4;
      const viewport = page.getViewport({
        scale: scale,
        offsetY: (offsetY - tempViewport.height) * scale,
      });

      preview.height = viewport.height;
      preview.width = viewport.width;

      const renderContext = {
        canvasContext: preview.getContext("2d"),
        viewport: viewport,
      };
      page.render(renderContext);
    });

    anchor.prepend(preview);
    app._previewing = true;

    target.addEventListener("mouseleave", function (event) {
      preview.remove();
      app._previewing = false;
    }, { once: true }); // call once, then remove
  }

  anchor.addEventListener("mouseover", mouseoverHandler);
  app._previewHandler = mouseoverHandler;
}

export { togglePreview };
