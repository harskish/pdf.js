async function togglePreview() {
  const app = window.PDFViewerApplication;
  const anchor = document.getElementById("viewer");
  const layout = await app.pdfDocument.getPageLayout();

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
    preview.setAttribute("role", "presentation"); // TODO: needed?
    
    // Keep preview hidden to prevent flicker
    preview.hidden = true;
    let isPreviewHidden = true;
    const showPreview = function () {
      if (isPreviewHidden) {
        preview.hidden = false;
        isPreviewHidden = false;
      }
    };

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

    // Returns pageProxy since real page might not be rendered yet
    app.pdfDocument.getPage(pageNumber).then(function (page) {
      const tempViewport = page.getViewport({ scale: 1.0 });
      const height = tempViewport.height * 1.2 * app.pdfViewer.currentScale;
      const width = tempViewport.width * 1.2 * app.pdfViewer.currentScale;
      const leftOffset =
        event.clientX > halfWidth ? (2 * width) / 3 : width / 3;
      
      previewStyle.height = `${height}px`;
      previewStyle.width = `${width}px`;
      previewStyle.left = `${event.clientX - leftOffset - 4}px`;

      let offsetX = 0;
      let offsetY = 0;
      switch (explicitDest[1].name) {
        case "XYZ":  // specifies coords, zoom
          offsetX = explicitDest[2];
          offsetY = explicitDest[3];
          break;
        case "FitH":  // fill width at Y
          offsetY = explicitDest[2];
          break;
        case "FitV":  // fill height at X
          offsetX = explicitDest[2];
          break;
        case "FitBH":
        case "FitBV":
          offsetY = explicitDest[2];
          break;
        default:
          console.log(`Unsupported link type "${explicitDest[1].name}"`);
          console.log(explicitDest);
      }

      // All elements under target point
      // TODO: check pdf_viewer.scrollPageIntoView(), ui_utils.scrollIntoView()
      if (!app.pdfViewer.isPageCached(pageNumber)) {
        console.log(`Page ${pageNumber} is not cached`);
      } else {
        const pageView = app.pdfViewer._pages[pageNumber - 1];
        const { div, id } = pageView;
        const rect = div.firstChild.getBoundingClientRect();
        let pageOffsetY = rect.y; //div.offsetTop + div.clientTop;
        let pageOffsetX = rect.x; //div.offsetLeft + div.clientLeft;
  
        //let test = tempViewport.convertToViewportPoint(offsetX, offsetY);
        const targets = document.elementsFromPoint(pageOffsetX + offsetX, pageOffsetY + offsetY);
        console.log(`Element at href target: ${targets[0]}`);
      }

      const scale = 4;
      const viewport = page.getViewport({
        scale: scale,
        offsetY: (offsetY - tempViewport.height) * scale,
      });

      preview.height = viewport.height;
      preview.width = viewport.width;

      const renderContext = {
        canvasContext: preview.getContext("2d", { alpha: false }),
        viewport: viewport,
      };
      
      const renderTask = page.render(renderContext);
      renderTask.promise.then(() => {
        showPreview();
      });
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
