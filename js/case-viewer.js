(() => {
  /* ========================================
     Shelfmark
     Shared Physical 3D Viewer
  ======================================== */

  const formatLibrary = window.ShelfmarkFormats;
  const appSettings = window.ShelfmarkSettings;

  if (!formatLibrary) {
    throw new Error(
      "Shelfmark format library is missing. Make sure js/formats.js loads before case-viewer.js.",
    );
  }

  const DEFAULT_CASE_ROTATION = { x: -8, y: 28 };
  const DEFAULT_MEDIA_ROTATION = { x: -10, y: -24 };
  const DEFAULT_ZOOM = 1;

  const MIN_ROTATION_X = -55;
  const MAX_ROTATION_X = 55;
  const MIN_ZOOM = 0.68;
  const MAX_ZOOM = 1.5;
  const VIEWER_LAST_OBJECT_KEY = "shelfmark.viewer.lastObject";

  const MEDIA_SILHOUETTE_MASKS = {
    umd: "/assets/images/viewer/umd-silhouette.png",
    nes: "/assets/images/viewer/nes-silhouette.png",
    "snes-pal": "/assets/images/viewer/snes-pal-silhouette.png",
    "snes-us": "/assets/images/viewer/snes-ntsc-silhouette.png",
    n64: "/assets/images/viewer/n64-silhouette.png",
    "game-boy": "/assets/images/viewer/gb-silhouette.png",
    "game-boy-color": "/assets/images/viewer/gbc-silhouette.png",
    gba: "/assets/images/viewer/gba-silhouette.png",
    "ds-card": "/assets/images/viewer/ds-silhouette.png",
    "3ds-card": "/assets/images/viewer/3ds-silhouette.png",
    "switch-card": "/assets/images/viewer/switch-silhouette.png",
    "vita-card": "/assets/images/viewer/psvita-silhouette.png",
  };

  let modal = null;
  let stage = null;
  let scene = null;
  let world = null;
  let caseObject = null;
  let caseModel = null;
  let mediaObject = null;
  let mediaModel = null;
  let mediaDepthStack = null;
  let closeButton = null;
  let titleElement = null;
  let subtitleElement = null;
  let dimensionsElement = null;
  let referenceElement = null;
  let statusElement = null;
  let hintElement = null;
  let caseTargetButton = null;
  let mediaTargetButton = null;

  let caseRotation = { ...DEFAULT_CASE_ROTATION };
  let mediaRotation = { ...DEFAULT_MEDIA_ROTATION };
  let zoom = DEFAULT_ZOOM;
  let activeObject = "case";

  let dragging = false;
  let pointerId = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOriginX = 0;
  let dragOriginY = 0;

  let activeRecord = null;
  let activeTrigger = null;
  let activeCaseDimensions = null;
  let activeMediaDimensions = null;

  const trimmedMediaArtworkCache = new Map();

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function getStoredLastViewerObject() {
    try {
      const value = localStorage.getItem(VIEWER_LAST_OBJECT_KEY);
      return value === "media" ? "media" : "case";
    } catch {
      return "case";
    }
  }

  function storeLastViewerObject(value) {
    if (value !== "case" && value !== "media") {
      return;
    }

    try {
      localStorage.setItem(VIEWER_LAST_OBJECT_KEY, value);
    } catch {
      // Optional local preference only.
    }
  }

  function getInitialViewerObject() {
    const preference = appSettings?.get?.("viewerDefault") || "last";

    if (preference === "media") {
      return "media";
    }

    if (preference === "case") {
      return "case";
    }

    return getStoredLastViewerObject();
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

  function normalizeRecord(record) {
    if (!record?.game) {
      return null;
    }

    if (record.item) {
      return {
        item: record.item,
        game: record.game,
        images: Array.isArray(record.images) ? record.images : [],
      };
    }

    return {
      item: {
        title: record.title,
        condition: record.condition,
        completeness: record.completeness,
        region: record.region,
        country: record.country,
      },
      game: record.game,
      images: Array.isArray(record.images) ? record.images : [],
    };
  }

  function getImage(images, type) {
    return (
      images?.find(
        (image) => image.image_type === type && image.signedUrl,
      ) || null
    );
  }

  function getMediaImage(images, mediaType) {
    if (mediaType === "cartridge") {
      return getImage(images, "cartridge");
    }

    if (mediaType === "disc") {
      return [...(images || [])]
        .filter(
          (image) => image.image_type === "disc" && image.signedUrl,
        )
        .sort((a, b) => {
          const discA = Number(a.disc_number) || 999;
          const discB = Number(b.disc_number) || 999;

          if (discA !== discB) {
            return discA - discB;
          }

          return (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);
        })[0] || null;
    }

    return null;
  }

  function loadImageFromSource(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Could not load image: ${source}`));
      image.src = source;
    });
  }

  function getOpaqueBounds(imageData) {
    const { data, width, height } = imageData;
    let left = width;
    let top = height;
    let right = -1;
    let bottom = -1;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const alpha = data[(y * width + x) * 4 + 3];

        if (alpha <= 8) {
          continue;
        }

        if (x < left) left = x;
        if (y < top) top = y;
        if (x > right) right = x;
        if (y > bottom) bottom = y;
      }
    }

    if (right < left || bottom < top) {
      return null;
    }

    return {
      left,
      top,
      width: right - left + 1,
      height: bottom - top + 1,
    };
  }

  async function getTrimmedMediaArtworkUrl(sourceUrl) {
    if (!sourceUrl) {
      return sourceUrl;
    }

    if (!trimmedMediaArtworkCache.has(sourceUrl)) {
      trimmedMediaArtworkCache.set(
        sourceUrl,
        (async () => {
          try {
            const response = await fetch(sourceUrl);

            if (!response.ok) {
              throw new Error(`Fetch failed with status ${response.status}`);
            }

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);

            try {
              const image = await loadImageFromSource(objectUrl);
              const sourceCanvas = document.createElement("canvas");
              sourceCanvas.width = image.naturalWidth || image.width;
              sourceCanvas.height = image.naturalHeight || image.height;

              const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
              sourceContext.drawImage(image, 0, 0);

              const bounds = getOpaqueBounds(
                sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height),
              );

              if (!bounds) {
                return sourceUrl;
              }

              const padding = Math.max(2, Math.round(Math.max(bounds.width, bounds.height) * 0.012));
              const trimmedCanvas = document.createElement("canvas");
              trimmedCanvas.width = bounds.width + padding * 2;
              trimmedCanvas.height = bounds.height + padding * 2;

              const trimmedContext = trimmedCanvas.getContext("2d");
              trimmedContext.drawImage(
                sourceCanvas,
                bounds.left,
                bounds.top,
                bounds.width,
                bounds.height,
                padding,
                padding,
                bounds.width,
                bounds.height,
              );

              return trimmedCanvas.toDataURL("image/png");
            } finally {
              URL.revokeObjectURL(objectUrl);
            }
          } catch (error) {
            console.warn("Shelfmark: Could not trim media artwork, falling back to the original file.", error);
            return sourceUrl;
          }
        })(),
      );
    }

    return trimmedMediaArtworkCache.get(sourceUrl);
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

  function getMediaDepthMm(definition, mediaType) {
    if (mediaType === "disc") {
      return definition?.shape === "umd" ? 4.2 : 1.2;
    }

    const depthByShape = {
      nes: 17,
      "snes-pal": 17,
      "snes-us": 17,
      n64: 20,
      "game-boy": 7.5,
      "game-boy-color": 7.5,
      gba: 4.8,
      "ds-card": 3.8,
      "3ds-card": 3.8,
      "switch-card": 3.4,
      "vita-card": 3.4,
      rounded: 6,
    };

    return depthByShape[definition?.shape] || 6;
  }

  function getMediaDimensions(item, game) {
    const mediaType = game?.media_type || "";

    if (mediaType !== "disc" && mediaType !== "cartridge") {
      return null;
    }

    const definition = formatLibrary.getMediaDefinition({
      mediaFormat: game?.media_format || "",
      platform: game?.platform || "",
      mediaType,
      region: item?.region || "",
    });

    if (!definition) {
      return null;
    }

    let width = Number(definition.widthMm);
    let height = Number(definition.heightMm);

    if (!Number.isFinite(width) || width <= 0) {
      width = mediaType === "disc" ? 120 : 70;
    }

    if (!Number.isFinite(height) || height <= 0) {
      height = mediaType === "disc" ? 120 : width / (Number(definition.ratio) || 0.78);
    }

    return {
      mediaType,
      definition,
      label: definition.shortLabel || definition.label || (mediaType === "disc" ? "Disc" : "Cartridge"),
      width,
      height,
      depth: getMediaDepthMm(definition, mediaType),
      dimensionLabel:
        Math.abs(width - height) < 0.01
          ? `${Math.round(width)} mm`
          : `${Number(width.toFixed(1))} × ${Number(height.toFixed(1))} mm`,
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
            <h2 id="case-viewer-title">Physical copy</h2>
            <p id="case-viewer-subtitle"></p>
          </div>

          <button
            type="button"
            class="case-viewer-close"
            aria-label="Close physical 3D viewer"
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
          aria-label="Interactive physical game viewer. Select the case or media, then drag to rotate. Scroll to zoom."
        >
          <div class="case-viewer-scene">
            <div class="case-viewer-world">
              <div class="case-viewer-object case-viewer-case-object" data-viewer-object="case">
                <span class="case-viewer-object-label">CASE</span>
                <div class="case-viewer-model" aria-hidden="true">
                  <div class="case-viewer-face case-viewer-face-front" data-case-face="front"></div>
                  <div class="case-viewer-face case-viewer-face-back" data-case-face="back"></div>
                  <div class="case-viewer-face case-viewer-face-spine" data-case-face="side"></div>
                  <div class="case-viewer-face case-viewer-face-edge"></div>
                  <div class="case-viewer-face case-viewer-face-top"></div>
                  <div class="case-viewer-face case-viewer-face-bottom"></div>
                </div>
              </div>

              <div class="case-viewer-object case-viewer-media-object" data-viewer-object="media">
                <span class="case-viewer-object-label" data-media-object-label>MEDIA</span>
                <div class="case-viewer-media-model" aria-hidden="true">
                  <div class="case-viewer-media-depth-stack" data-media-depth-stack></div>
                  <div class="case-viewer-media-face case-viewer-media-front" data-media-face="front"></div>
                  <div class="case-viewer-media-face case-viewer-media-back" data-media-face="back"></div>
                </div>
              </div>
            </div>
          </div>

          <p class="case-viewer-hint">Select an object · Drag to rotate · Scroll to zoom</p>
        </div>

        <div class="case-viewer-toolbar" aria-label="Physical viewer controls">
          <div class="case-viewer-object-tabs" aria-label="Object to rotate">
            <button type="button" data-viewer-target="case">Case</button>
            <button type="button" data-viewer-target="media">Media</button>
          </div>

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

          <div class="case-viewer-control-group case-viewer-zoom-controls">
            <button type="button" data-case-control="zoom-out" aria-label="Zoom out" title="Zoom out">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12"></path></svg>
            </button>
            <button type="button" data-case-control="zoom-in" aria-label="Zoom in" title="Zoom in">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6v12"></path><path d="M6 12h12"></path></svg>
            </button>
            <button type="button" class="case-viewer-reset" data-case-control="reset">Reset view</button>
          </div>
        </div>

        <footer class="case-viewer-footer">
          <div>
            <span class="case-viewer-format" id="case-viewer-dimensions"></span>
            <span class="case-viewer-reference-note">Case and media share one physical scale. Uploaded artwork fills the recorded face.</span>
          </div>
          <output class="case-viewer-status" aria-live="polite"></output>
        </footer>
      </section>
    `;

    document.body.appendChild(modal);

    stage = modal.querySelector(".case-viewer-stage");
    scene = modal.querySelector(".case-viewer-scene");
    world = modal.querySelector(".case-viewer-world");
    caseObject = modal.querySelector(".case-viewer-case-object");
    caseModel = modal.querySelector(".case-viewer-model");
    mediaObject = modal.querySelector(".case-viewer-media-object");
    mediaModel = modal.querySelector(".case-viewer-media-model");
    mediaDepthStack = modal.querySelector("[data-media-depth-stack]");
    closeButton = modal.querySelector(".case-viewer-close");
    titleElement = modal.querySelector("#case-viewer-title");
    subtitleElement = modal.querySelector("#case-viewer-subtitle");
    dimensionsElement = modal.querySelector("#case-viewer-dimensions");
    referenceElement = modal.querySelector(".case-viewer-reference-note");
    statusElement = modal.querySelector(".case-viewer-status");
    hintElement = modal.querySelector(".case-viewer-hint");
    caseTargetButton = modal.querySelector('[data-viewer-target="case"]');
    mediaTargetButton = modal.querySelector('[data-viewer-target="media"]');

    closeButton?.addEventListener("click", close);

    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        close();
      }
    });

    modal.querySelectorAll("[data-viewer-target]").forEach((button) => {
      button.addEventListener("click", () => {
        setActiveObject(button.dataset.viewerTarget);
        stage?.focus();
      });
    });

    modal.querySelectorAll("[data-viewer-object]").forEach((object) => {
      object.addEventListener("pointerdown", () => {
        setActiveObject(object.dataset.viewerObject);
      });
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
        updateTransforms();
      },
      { passive: false },
    );

    modal.querySelectorAll("[data-case-control]").forEach((button) => {
      button.addEventListener("click", () => {
        applyControl(button.dataset.caseControl);
      });
    });

    document.addEventListener("keydown", handleKeydown);
    window.addEventListener("resize", updatePhysicalLayout);
  }

  function setFaceImage(faceType, imageRecord, alt) {
    const face = caseModel?.querySelector(`[data-case-face="${faceType}"]`);

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
    image.draggable = false;

    face.appendChild(image);
  }

  function getMediaShapeClass(shape) {
    return `case-viewer-media-shape-${shape || "rounded"}`;
  }

  function clearMediaShapeClasses(element) {
    if (!element) {
      return;
    }

    [...element.classList].forEach((className) => {
      if (className.startsWith("case-viewer-media-shape-")) {
        element.classList.remove(className);
      }
    });
  }

  function getMediaMaskPath(shape) {
    return MEDIA_SILHOUETTE_MASKS[shape] || "";
  }

  function buildMediaDepthLayers(shape, maskPath, isOpticalDisc) {
    if (!mediaDepthStack) {
      return;
    }

    mediaDepthStack.innerHTML = "";

    const layerCount = isOpticalDisc ? 5 : 9;

    for (let index = 1; index <= layerCount; index += 1) {
      const fraction = -0.5 + index / (layerCount + 1);
      const layer = document.createElement("span");

      layer.className = `case-viewer-media-depth-layer ${getMediaShapeClass(shape)}`;
      layer.dataset.depthFraction = String(fraction);

      if (maskPath) {
        layer.classList.add("case-viewer-media-uses-mask");
        layer.style.setProperty("--media-mask-image", `url("${maskPath}")`);
      }

      if (isOpticalDisc) {
        layer.classList.add("is-optical-disc");
      }

      mediaDepthStack.appendChild(layer);
    }
  }

  function updateMediaDepthLayerPositions(depthPx) {
    mediaDepthStack?.querySelectorAll("[data-depth-fraction]").forEach((layer) => {
      const fraction = Number(layer.dataset.depthFraction) || 0;
      layer.style.transform = `translateZ(${depthPx * fraction}px)`;
    });
  }

  async function setMediaArtwork(record, mediaDimensions) {
    const front = mediaModel?.querySelector('[data-media-face="front"]');
    const back = mediaModel?.querySelector('[data-media-face="back"]');
    const label = modal?.querySelector("[data-media-object-label]");

    if (!front || !back || !mediaDimensions) {
      return;
    }

    const { item, game, images } = record;
    const imageRecord = getMediaImage(images, game.media_type);
    const shape = mediaDimensions.definition?.shape || "rounded";
    const shapeClass = getMediaShapeClass(shape);
    const maskPath = getMediaMaskPath(shape);
    const isOpticalDisc = shape === "disc";

    clearMediaShapeClasses(front);
    clearMediaShapeClasses(back);

    front.classList.add(shapeClass);
    back.classList.add(shapeClass);
    front.classList.toggle("has-artwork", Boolean(imageRecord?.signedUrl));
    front.classList.toggle("case-viewer-media-uses-mask", Boolean(maskPath));
    back.classList.toggle("case-viewer-media-uses-mask", Boolean(maskPath));
    front.classList.toggle("is-optical-disc", isOpticalDisc);
    back.classList.toggle("is-optical-disc", isOpticalDisc);

    if (maskPath) {
      front.style.setProperty("--media-mask-image", `url("${maskPath}")`);
      back.style.setProperty("--media-mask-image", `url("${maskPath}")`);
    } else {
      front.style.removeProperty("--media-mask-image");
      back.style.removeProperty("--media-mask-image");
    }

    const holeRatio = Number(mediaDimensions.definition?.holeRatio) || 0;
    mediaModel?.style.setProperty("--media-hole-ratio", `${holeRatio * 100}%`);

    buildMediaDepthLayers(shape, maskPath, isOpticalDisc);

    front.innerHTML = "";
    back.innerHTML = "";

    if (imageRecord?.signedUrl) {
      const imageSource = await getTrimmedMediaArtworkUrl(imageRecord.signedUrl);

      if (activeRecord !== record || !front.isConnected) {
        return;
      }

      const image = document.createElement("img");
      image.className = "case-viewer-media-artwork";
      image.src = imageSource;
      image.alt = `${item.title || "Game"} ${mediaDimensions.label}`;
      image.decoding = "async";
      image.draggable = false;
      front.appendChild(image);
    } else {
      const mark = document.createElement("span");
      mark.className = "case-viewer-media-placeholder-mark";
      mark.textContent = game.media_type === "disc" ? "DISC" : "CART";
      front.appendChild(mark);
    }

    if (!isOpticalDisc) {
      const backMark = document.createElement("span");
      backMark.className = "case-viewer-media-back-mark";
      backMark.textContent = "S";
      back.appendChild(backMark);
    }

    if (label) {
      label.textContent = mediaDimensions.label.toUpperCase();
    }
  }

  function updatePhysicalLayout() {
    if (!activeRecord || !stage || !world) {
      return;
    }

    const hasCase = Boolean(activeCaseDimensions);
    const hasMedia = Boolean(activeMediaDimensions);

    if (!hasCase && !hasMedia) {
      return;
    }

    const stageRect = stage.getBoundingClientRect();
    const availableHeight = Math.max(210, Math.min(410, stageRect.height * 0.7));
    const availableWidth = Math.max(250, stageRect.width * 0.76);

    const physicalGapMm = hasCase && hasMedia ? 28 : 0;
    const totalWidthMm =
      (hasCase ? activeCaseDimensions.width : 0) +
      (hasMedia ? activeMediaDimensions.width : 0) +
      physicalGapMm;
    const maxHeightMm = Math.max(
      hasCase ? activeCaseDimensions.height : 0,
      hasMedia ? activeMediaDimensions.height : 0,
    );

    const scale = Math.min(
      availableHeight / Math.max(1, maxHeightMm),
      availableWidth / Math.max(1, totalWidthMm),
    );

    if (hasCase && caseObject && caseModel) {
      const widthPx = activeCaseDimensions.width * scale;
      const heightPx = activeCaseDimensions.height * scale;
      const depthPx = Math.max(1.5, activeCaseDimensions.depth * scale);

      caseObject.style.width = `${widthPx}px`;
      caseObject.style.height = `${heightPx}px`;
      caseModel.style.setProperty("--case-3d-width", `${widthPx}px`);
      caseModel.style.setProperty("--case-3d-height", `${heightPx}px`);
      caseModel.style.setProperty("--case-3d-depth", `${depthPx}px`);
    }

    if (hasMedia && mediaObject && mediaModel) {
      const widthPx = activeMediaDimensions.width * scale;
      const heightPx = activeMediaDimensions.height * scale;
      const depthPx = Math.max(1, activeMediaDimensions.depth * scale);

      mediaObject.style.width = `${widthPx}px`;
      mediaObject.style.height = `${heightPx}px`;
      mediaModel.style.setProperty("--media-3d-width", `${widthPx}px`);
      mediaModel.style.setProperty("--media-3d-height", `${heightPx}px`);
      mediaModel.style.setProperty("--media-3d-depth", `${depthPx}px`);
      updateMediaDepthLayerPositions(depthPx);
    }

    world.style.setProperty(
      "--viewer-object-gap",
      `${Math.max(22, physicalGapMm * scale)}px`,
    );
  }

  function setActiveObject(next) {
    const canUseCase = Boolean(activeCaseDimensions && caseObject && !caseObject.hidden);
    const canUseMedia = Boolean(activeMediaDimensions && mediaObject && !mediaObject.hidden);

    if (next === "case" && !canUseCase) {
      next = canUseMedia ? "media" : "case";
    }

    if (next === "media" && !canUseMedia) {
      next = canUseCase ? "case" : "media";
    }

    activeObject = next;

    if ((appSettings?.get?.("viewerDefault") || "last") === "last") {
      storeLastViewerObject(activeObject);
    }

    caseObject?.classList.toggle("is-active", activeObject === "case");
    mediaObject?.classList.toggle("is-active", activeObject === "media");
    caseTargetButton?.classList.toggle("is-active", activeObject === "case");
    mediaTargetButton?.classList.toggle("is-active", activeObject === "media");
    caseTargetButton?.setAttribute("aria-pressed", String(activeObject === "case"));
    mediaTargetButton?.setAttribute("aria-pressed", String(activeObject === "media"));

    if (hintElement) {
      const targetLabel = activeObject === "case" ? "case" : (activeMediaDimensions?.label || "media").toLowerCase();
      hintElement.textContent = `Rotating ${targetLabel} · Drag to rotate · Scroll to zoom`;
    }

    updateStatus();
  }

  function updateStatus() {
    if (!statusElement) {
      return;
    }

    const rotation = activeObject === "media" ? mediaRotation : caseRotation;
    const label = activeObject === "media" ? (activeMediaDimensions?.label || "Media") : "Case";

    statusElement.textContent = `${label} · ${Math.round(rotation.y)}° / ${Math.round(rotation.x)}° · ${Math.round(zoom * 100)}%`;
  }

  function updateTransforms() {
    caseRotation.x = clamp(caseRotation.x, MIN_ROTATION_X, MAX_ROTATION_X);
    caseRotation.y = normalizeAngle(caseRotation.y);
    mediaRotation.x = clamp(mediaRotation.x, MIN_ROTATION_X, MAX_ROTATION_X);
    mediaRotation.y = normalizeAngle(mediaRotation.y);
    zoom = clamp(zoom, MIN_ZOOM, MAX_ZOOM);

    if (caseModel) {
      caseModel.style.transform = `rotateX(${caseRotation.x}deg) rotateY(${caseRotation.y}deg)`;
    }

    if (mediaModel) {
      mediaModel.style.transform = `rotateX(${mediaRotation.x}deg) rotateY(${mediaRotation.y}deg)`;
    }

    if (world) {
      world.style.transform = `scale(${zoom})`;
    }

    updateStatus();
  }

  function resetView() {
    caseRotation = { ...DEFAULT_CASE_ROTATION };
    mediaRotation = { ...DEFAULT_MEDIA_ROTATION };
    zoom = DEFAULT_ZOOM;
    updateTransforms();
  }

  function applyControl(control) {
    const rotation = activeObject === "media" ? mediaRotation : caseRotation;

    if (control === "left") {
      rotation.y -= 15;
    } else if (control === "right") {
      rotation.y += 15;
    } else if (control === "up") {
      rotation.x -= 10;
    } else if (control === "down") {
      rotation.x += 10;
    } else if (control === "zoom-in") {
      zoom += 0.1;
    } else if (control === "zoom-out") {
      zoom -= 0.1;
    } else if (control === "reset") {
      resetView();
      return;
    }

    updateTransforms();
  }

  function startDragging(event) {
    if (!stage || event.button !== 0) {
      return;
    }

    const object = event.target.closest?.("[data-viewer-object]");

    if (object?.dataset.viewerObject) {
      setActiveObject(object.dataset.viewerObject);
    }

    dragging = true;
    pointerId = event.pointerId;
    dragStartX = event.clientX;
    dragStartY = event.clientY;

    const rotation = activeObject === "media" ? mediaRotation : caseRotation;
    dragOriginX = rotation.x;
    dragOriginY = rotation.y;

    stage.classList.add("dragging");
    stage.setPointerCapture(event.pointerId);
  }

  function drag(event) {
    if (!dragging || event.pointerId !== pointerId) {
      return;
    }

    const deltaX = event.clientX - dragStartX;
    const deltaY = event.clientY - dragStartY;
    const rotation = activeObject === "media" ? mediaRotation : caseRotation;

    rotation.y = dragOriginY + deltaX * 0.35;
    rotation.x = dragOriginX - deltaY * 0.28;

    updateTransforms();
  }

  function stopDragging(event) {
    if (!dragging || event.pointerId !== pointerId) {
      return;
    }

    dragging = false;
    stage?.classList.remove("dragging");

    try {
      stage?.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already have been released.
    }

    pointerId = null;
  }

  function getFocusableElements() {
    if (!modal || modal.hidden) {
      return [];
    }

    return Array.from(
      modal.querySelectorAll(
        'button:not([disabled]):not([hidden]), [href], [tabindex]:not([tabindex="-1"])',
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

    if (event.key.toLowerCase() === "c" && activeCaseDimensions) {
      event.preventDefault();
      setActiveObject("case");
      return;
    }

    if (event.key.toLowerCase() === "m" && activeMediaDimensions) {
      event.preventDefault();
      setActiveObject("media");
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

  function updateDimensionsText() {
    const parts = [];

    if (activeCaseDimensions) {
      parts.push(`${activeCaseDimensions.label} · ${activeCaseDimensions.dimensionLabel}`);
    }

    if (activeMediaDimensions) {
      parts.push(`${activeMediaDimensions.label} · ${activeMediaDimensions.dimensionLabel}`);
    }

    if (dimensionsElement) {
      dimensionsElement.textContent = parts.join("  |  ");
    }

    if (referenceElement) {
      referenceElement.textContent =
        activeCaseDimensions && activeMediaDimensions
          ? "Case and media share one physical scale. Zoom is applied uniformly to the complete scene."
          : "The object keeps its recorded physical face proportions at every zoom level.";
    }
  }

  function open(record, { trigger = null } = {}) {
    createModal();

    const normalized = normalizeRecord(record);

    if (!normalized?.item || !normalized?.game) {
      console.warn("Shelfmark: This record does not contain enough physical data for the viewer.");
      return;
    }

    activeCaseDimensions = getCaseDimensions(normalized.game);
    activeMediaDimensions = getMediaDimensions(normalized.item, normalized.game);

    if (!activeCaseDimensions && !activeMediaDimensions) {
      console.warn("Shelfmark: This game does not have a supported case or physical media format.");
      return;
    }

    activeRecord = normalized;
    activeTrigger = trigger || document.activeElement;

    const { item, game, images } = normalized;

    if (titleElement) {
      titleElement.textContent = item.title || "Physical copy";
    }

    if (subtitleElement) {
      subtitleElement.textContent = [
        game.platform,
        item.region,
        game.edition && game.edition !== "Standard Edition" ? game.edition : null,
      ]
        .filter(Boolean)
        .join(" · ");
    }

    if (caseObject) {
      caseObject.hidden = !activeCaseDimensions;
    }

    if (caseTargetButton) {
      caseTargetButton.hidden = !activeCaseDimensions;
    }

    if (mediaObject) {
      mediaObject.hidden = !activeMediaDimensions;
    }

    if (mediaTargetButton) {
      mediaTargetButton.hidden = !activeMediaDimensions;
      mediaTargetButton.textContent = activeMediaDimensions?.label || "Media";
    }

    if (activeCaseDimensions) {
      setFaceImage("front", getImage(images, "front"), `${item.title || "Game"} front case image`);
      setFaceImage("back", getImage(images, "back"), `${item.title || "Game"} back case image`);
      setFaceImage("side", getImage(images, "side"), `${item.title || "Game"} spine image`);
    }

    if (activeMediaDimensions) {
      setMediaArtwork(normalized, activeMediaDimensions).catch((error) => {
        console.error("Shelfmark: Failed to prepare media artwork for the physical viewer.", error);
      });
    }

    updateDimensionsText();

    activeObject = getInitialViewerObject();

    if (activeObject === "case" && !activeCaseDimensions) {
      activeObject = "media";
    } else if (activeObject === "media" && !activeMediaDimensions) {
      activeObject = "case";
    }

    caseRotation = { ...DEFAULT_CASE_ROTATION };
    mediaRotation = { ...DEFAULT_MEDIA_ROTATION };
    zoom = DEFAULT_ZOOM;

    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("case-viewer-open");

    requestAnimationFrame(() => {
      updatePhysicalLayout();
      setActiveObject(activeObject);
      updateTransforms();
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
    activeCaseDimensions = null;
    activeMediaDimensions = null;

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
