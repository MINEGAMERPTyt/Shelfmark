(() => {
  /* ========================================
     Shelfmark
     Shared 3D Case Viewer
  ======================================== */

  const formatLibrary = window.ShelfmarkFormats;

  if (!formatLibrary) {
    throw new Error(
      "Shelfmark format library is missing. Make sure js/formats.js loads before case-viewer.js.",
    );
  }

  const DEFAULT_ROTATION_X = -8;
  const DEFAULT_ROTATION_Y = 28;
  const DEFAULT_ZOOM = 1;

  const MIN_ROTATION_X = -45;
  const MAX_ROTATION_X = 45;

  const MIN_ZOOM = 0.65;
  const MAX_ZOOM = 1.55;

  let modal = null;
  let stage = null;
  let scene = null;
  let model = null;
  let closeButton = null;
  let titleElement = null;
  let subtitleElement = null;
  let dimensionsElement = null;
  let statusElement = null;

  let rotationX = DEFAULT_ROTATION_X;
  let rotationY = DEFAULT_ROTATION_Y;
  let zoom = DEFAULT_ZOOM;

  let dragging = false;
  let pointerId = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOriginX = 0;
  let dragOriginY = 0;

  let activeRecord = null;
  let activeTrigger = null;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalizeAngle(value) {
    let angle = value % 360;

    if (angle > 180) {
      angle -= 360;
    } else if (angle < -180) {
      angle += 360;
    }

    return angle;
  }

  function getImage(images, type) {
    return (
      images?.find(
        (image) => image.image_type === type && image.signedUrl,
      ) || null
    );
  }

  function getCaseDimensions(game) {
    const caseFormat =
      formatLibrary.normalizeCaseFormat(game?.case_format) || "";

    if (!caseFormat) {
      return null;
    }

    if (caseFormat === "custom") {
      const customWidth = Number(game?.custom_case_width);
      const customHeight = Number(game?.custom_case_height);

      const ratio = formatLibrary.getCaseRatio({
        caseFormat,
        role: "cover",
        customWidth,
        customHeight,
      });

      const virtualHeight = 190;
      const virtualWidth = virtualHeight * ratio;
      const virtualDepth = virtualHeight * (14 / 190);

      const ratioLabel =
        Number.isFinite(customWidth) &&
        Number.isFinite(customHeight) &&
        customWidth > 0 &&
        customHeight > 0
          ? `${Number(customWidth.toFixed(2))} × ${Number(customHeight.toFixed(2))}`
          : `${ratio.toFixed(2)} : 1`;

      return {
        caseFormat,
        label: "Custom case",
        width: virtualWidth,
        height: virtualHeight,
        depth: virtualDepth,
        dimensionLabel: `Custom proportions · ${ratioLabel}`,
        isPhysicalMeasurement: false,
      };
    }

    const definition = formatLibrary.CASE_FORMATS?.[caseFormat];

    if (!definition) {
      return null;
    }

    const width = Number(definition.coverWidthMm);
    const height = Number(definition.coverHeightMm);

    let depth = Number(definition.spineWidthMm);

    if (
      (!Number.isFinite(depth) || depth <= 0) &&
      Number.isFinite(Number(definition.side)) &&
      Number.isFinite(height) &&
      height > 0
    ) {
      depth = Number(definition.side) * height;
    }

    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    ) {
      return null;
    }

    if (!Number.isFinite(depth) || depth <= 0) {
      depth = height * (14 / 190);
    }

    return {
      caseFormat,
      label: definition.label || "Game case",
      width,
      height,
      depth,
      dimensionLabel: `${Math.round(width)} × ${Math.round(height)} × ${Math.round(depth)} mm`,
      isPhysicalMeasurement: true,
    };
  }


  function createModal() {
    if (modal) {
      return;
    }

    modal = document.createElement("div");
    modal.className = "case-viewer-modal";
    modal.id = "case-viewer-modal";
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");

    modal.innerHTML = `
      <section
        class="case-viewer-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="case-viewer-title"
        aria-describedby="case-viewer-subtitle"
      >
        <header class="case-viewer-header">
          <div class="case-viewer-heading">
            <p class="case-viewer-eyebrow">PHYSICAL VIEW</p>
            <h2 id="case-viewer-title">Game case</h2>
            <p id="case-viewer-subtitle"></p>
          </div>

          <button
            type="button"
            class="case-viewer-close"
            aria-label="Close 3D case viewer"
            title="Close"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12"></path>
              <path d="M18 6L6 18"></path>
            </svg>
          </button>
        </header>

        <div
          class="case-viewer-stage"
          tabindex="0"
          aria-label="Interactive 3D game case. Drag to rotate. Use arrow keys to rotate and plus or minus to zoom."
        >
          <div class="case-viewer-scene">
            <div class="case-viewer-model" aria-hidden="true">
              <div class="case-viewer-face case-viewer-face-front" data-case-face="front"></div>
              <div class="case-viewer-face case-viewer-face-back" data-case-face="back"></div>
              <div class="case-viewer-face case-viewer-face-spine" data-case-face="side"></div>
              <div class="case-viewer-face case-viewer-face-edge"></div>
              <div class="case-viewer-face case-viewer-face-top"></div>
              <div class="case-viewer-face case-viewer-face-bottom"></div>
            </div>
          </div>

          <p class="case-viewer-hint">Drag to rotate · Scroll to zoom</p>
        </div>

        <div class="case-viewer-toolbar" aria-label="3D case controls">
          <div class="case-viewer-control-group">
            <button type="button" data-case-control="left" aria-label="Rotate left" title="Rotate left">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6.5 9 12l5.5 5.5"></path></svg>
            </button>

            <button type="button" data-case-control="right" aria-label="Rotate right" title="Rotate right">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 6.5 5.5 5.5-5.5 5.5"></path></svg>
            </button>

            <button type="button" data-case-control="up" aria-label="Tilt up" title="Tilt up">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6.5 14.5 5.5-5.5 5.5 5.5"></path></svg>
            </button>

            <button type="button" data-case-control="down" aria-label="Tilt down" title="Tilt down">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6.5 9.5 5.5 5.5 5.5-5.5"></path></svg>
            </button>
          </div>

          <div class="case-viewer-control-group">
            <button type="button" data-case-control="zoom-out" aria-label="Zoom out" title="Zoom out">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12"></path></svg>
            </button>

            <button type="button" data-case-control="zoom-in" aria-label="Zoom in" title="Zoom in">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6v12"></path><path d="M6 12h12"></path></svg>
            </button>

            <button type="button" class="case-viewer-reset" data-case-control="reset">
              Reset view
            </button>
          </div>
        </div>

        <footer class="case-viewer-footer">
          <div>
            <span class="case-viewer-format" id="case-viewer-dimensions"></span>
            <span class="case-viewer-reference-note">Uploaded artwork is shown as a reference texture on the recorded case proportions.</span>
          </div>

          <output class="case-viewer-status" aria-live="polite"></output>
        </footer>
      </section>
    `;

    document.body.appendChild(modal);

    stage = modal.querySelector(".case-viewer-stage");
    scene = modal.querySelector(".case-viewer-scene");
    model = modal.querySelector(".case-viewer-model");
    closeButton = modal.querySelector(".case-viewer-close");
    titleElement = modal.querySelector("#case-viewer-title");
    subtitleElement = modal.querySelector("#case-viewer-subtitle");
    dimensionsElement = modal.querySelector("#case-viewer-dimensions");
    statusElement = modal.querySelector(".case-viewer-status");

    closeButton?.addEventListener("click", close);

    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        close();
      }
    });

    stage?.addEventListener("pointerdown", startDragging);
    stage?.addEventListener("pointermove", drag);
    stage?.addEventListener("pointerup", stopDragging);
    stage?.addEventListener("pointercancel", stopDragging);

    stage?.addEventListener(
      "wheel",
      (event) => {
        if (modal.hidden) {
          return;
        }

        event.preventDefault();

        zoom = clamp(zoom - event.deltaY * 0.0012, MIN_ZOOM, MAX_ZOOM);
        updateTransform();
      },
      { passive: false },
    );

    modal.querySelectorAll("[data-case-control]").forEach((button) => {
      button.addEventListener("click", () => {
        applyControl(button.dataset.caseControl);
      });
    });

    document.addEventListener("keydown", handleKeydown);
    window.addEventListener("resize", updateModelDimensions);
  }

  function setFaceImage(faceType, imageRecord, alt) {
    const face = model?.querySelector(`[data-case-face="${faceType}"]`);

    if (!face) {
      return;
    }

    face.innerHTML = "";
    face.classList.toggle("has-artwork", Boolean(imageRecord?.signedUrl));

    if (!imageRecord?.signedUrl) {
      if (faceType !== "side") {
        const mark = document.createElement("span");
        mark.className = "case-viewer-face-mark";
        mark.textContent = "S";
        face.appendChild(mark);
      }

      return;
    }

    const image = document.createElement("img");
    image.className = "case-viewer-artwork";
    image.src = imageRecord.signedUrl;
    image.alt = alt;
    image.decoding = "async";

    face.appendChild(image);
  }

  function updateModelDimensions() {
    if (!activeRecord || !stage || !model) {
      return;
    }

    const dimensions = getCaseDimensions(activeRecord.game);

    if (!dimensions) {
      return;
    }

    const stageRect = stage.getBoundingClientRect();

    const availableHeight = Math.max(220, Math.min(390, stageRect.height * 0.7));
    const availableWidth = Math.max(180, stageRect.width * 0.52);

    const scale = Math.min(
      availableHeight / dimensions.height,
      availableWidth / dimensions.width,
    );

    const widthPx = dimensions.width * scale;
    const heightPx = dimensions.height * scale;
    const depthPx = Math.max(10, dimensions.depth * scale);

    model.style.setProperty("--case-3d-width", `${widthPx}px`);
    model.style.setProperty("--case-3d-height", `${heightPx}px`);
    model.style.setProperty("--case-3d-depth", `${depthPx}px`);

    scene.style.setProperty("--case-3d-height", `${heightPx}px`);
  }

  function updateTransform() {
    if (!model) {
      return;
    }

    rotationX = clamp(rotationX, MIN_ROTATION_X, MAX_ROTATION_X);
    rotationY = normalizeAngle(rotationY);
    zoom = clamp(zoom, MIN_ZOOM, MAX_ZOOM);

    model.style.transform =
      `rotateX(${rotationX}deg) rotateY(${rotationY}deg) scale(${zoom})`;

    if (statusElement) {
      statusElement.textContent =
        `${Math.round(rotationY)}° · ${Math.round(rotationX)}° · ${Math.round(zoom * 100)}%`;
    }
  }

  function resetView() {
    rotationX = DEFAULT_ROTATION_X;
    rotationY = DEFAULT_ROTATION_Y;
    zoom = DEFAULT_ZOOM;

    updateTransform();
  }

  function applyControl(control) {
    if (control === "left") {
      rotationY -= 15;
    } else if (control === "right") {
      rotationY += 15;
    } else if (control === "up") {
      rotationX -= 10;
    } else if (control === "down") {
      rotationX += 10;
    } else if (control === "zoom-in") {
      zoom += 0.1;
    } else if (control === "zoom-out") {
      zoom -= 0.1;
    } else if (control === "reset") {
      resetView();
      return;
    }

    updateTransform();
  }

  function startDragging(event) {
    if (!stage || event.button !== 0) {
      return;
    }

    dragging = true;
    pointerId = event.pointerId;

    dragStartX = event.clientX;
    dragStartY = event.clientY;

    dragOriginX = rotationX;
    dragOriginY = rotationY;

    stage.classList.add("dragging");
    stage.setPointerCapture(event.pointerId);
  }

  function drag(event) {
    if (!dragging || event.pointerId !== pointerId) {
      return;
    }

    const deltaX = event.clientX - dragStartX;
    const deltaY = event.clientY - dragStartY;

    rotationY = dragOriginY + deltaX * 0.35;
    rotationX = dragOriginX - deltaY * 0.28;

    updateTransform();
  }

  function stopDragging(event) {
    if (!dragging || event.pointerId !== pointerId) {
      return;
    }

    dragging = false;

    stage?.classList.remove("dragging");

    try {
      stage?.releasePointerCapture(event.pointerId);
    } catch (error) {
      /* Pointer capture may already have been released. */
    }

    pointerId = null;
  }

  function getFocusableElements() {
    if (!modal || modal.hidden) {
      return [];
    }

    return Array.from(
      modal.querySelectorAll(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => !element.hidden);
  }

  function handleKeydown(event) {
    if (!modal || modal.hidden) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }

    if (event.key === "Tab") {
      const focusable = getFocusableElements();

      if (!focusable.length) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }

      return;
    }

    if (document.activeElement !== stage) {
      return;
    }

    const controls = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
      "+": "zoom-in",
      "=": "zoom-in",
      "-": "zoom-out",
      _: "zoom-out",
      "0": "reset",
    };

    const control = controls[event.key];

    if (!control) {
      return;
    }

    event.preventDefault();
    applyControl(control);
  }

  function open(record, { trigger = null } = {}) {
    createModal();

    const dimensions = getCaseDimensions(record?.game);

    if (!record?.item || !record?.game || !dimensions) {
      console.warn("Shelfmark: This game does not have enough case data for the 3D viewer.");
      return;
    }

    activeRecord = record;
    activeTrigger = trigger || document.activeElement;

    const { item, game, images } = record;

    if (titleElement) {
      titleElement.textContent = item.title || "Game case";
    }

    if (subtitleElement) {
      subtitleElement.textContent = [
        game.platform,
        item.region,
        game.edition && game.edition !== "Standard Edition"
          ? game.edition
          : null,
      ]
        .filter(Boolean)
        .join(" · ");
    }

    if (dimensionsElement) {
      dimensionsElement.textContent = `${dimensions.label} · ${dimensions.dimensionLabel}`;
    }

    setFaceImage(
      "front",
      getImage(images, "front"),
      `${item.title || "Game"} front case image`,
    );

    setFaceImage(
      "back",
      getImage(images, "back"),
      `${item.title || "Game"} back case image`,
    );

    setFaceImage(
      "side",
      getImage(images, "side"),
      `${item.title || "Game"} spine image`,
    );

    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("case-viewer-open");

    resetView();

    requestAnimationFrame(() => {
      updateModelDimensions();
      updateTransform();
      closeButton?.focus();
    });
  }

  function close() {
    if (!modal || modal.hidden) {
      return;
    }

    dragging = false;
    pointerId = null;

    stage?.classList.remove("dragging");

    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("case-viewer-open");

    activeRecord = null;

    if (activeTrigger instanceof HTMLElement && activeTrigger.isConnected) {
      activeTrigger.focus();
    }

    activeTrigger = null;
  }

  window.ShelfmarkCaseViewer = {
    open,
    close,
  };
})();
