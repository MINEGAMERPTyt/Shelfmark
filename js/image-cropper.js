(() => {
  /*
    Shelfmark
    Shared Image Cropper

    Used by:
    - Add / Edit Game
    - Add / Edit Wishlist Item
  */

  /* =====================================================
     CUSTOM PHYSICAL MEDIA OUTLINES
  ===================================================== */

  const OUTLINE_ASSET_PATHS = {
    umd: "assets/images/cropper/umd-outline.png",
    "switch-card": "assets/images/cropper/switch-outline.png",
    "3ds-card": "assets/images/cropper/3ds-outline.png",
    "ds-card": "assets/images/cropper/ds-outline.png",
    gba: "assets/images/cropper/gba-outline.png",
    "game-boy-color": "assets/images/cropper/gbc-outline.png",
    "game-boy": "assets/images/cropper/gb-outline.png",
    n64: "assets/images/cropper/n64-outline.png",
    nes: "assets/images/cropper/nes-outline.png",
    "vita-card": "assets/images/cropper/psvita-outline.png",
    "snes-us": "assets/images/cropper/snes-ntsc-outline.png",
    "snes-pal": "assets/images/cropper/snes-pal-outline.png",
  };

  const shapeAssetCache = new Map();
  const shapeAssetPromises = new Map();

  /* =====================================================
     OUTPUT

     WebP keeps photographs much smaller than PNG while still
     supporting the transparent silhouettes used by discs, UMDs
     and cartridges. 1200 px remains the maximum crop size for
     detail and 3D-viewer quality.
  ===================================================== */

  const OUTPUT_MIME_TYPE = "image/webp";
  const OUTPUT_QUALITY = 0.9;

  /* =====================================================
     SHAPE HELPERS
  ===================================================== */

  function getOutlineAssetPath(shape) {
    return OUTLINE_ASSET_PATHS[shape] || "";
  }

  function usesOutlineAsset(shape) {
    return Boolean(getOutlineAssetPath(shape));
  }

  function createRoundedRectPath(x, y, width, height, radiusRatio = 0.04) {
    const path = new Path2D();

    const radius = Math.min(width, height) * radiusRatio;

    path.moveTo(x + radius, y);
    path.lineTo(x + width - radius, y);

    path.quadraticCurveTo(x + width, y, x + width, y + radius);

    path.lineTo(x + width, y + height - radius);

    path.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius,
      y + height,
    );

    path.lineTo(x + radius, y + height);

    path.quadraticCurveTo(x, y + height, x, y + height - radius);

    path.lineTo(x, y + radius);

    path.quadraticCurveTo(x, y, x + radius, y);

    path.closePath();

    return path;
  }

  function createPolygonPath(x, y, width, height, points) {
    const path = new Path2D();

    points.forEach(([pointX, pointY], index) => {
      const px = x + pointX * width;
      const py = y + pointY * height;

      if (index === 0) {
        path.moveTo(px, py);
      } else {
        path.lineTo(px, py);
      }
    });

    path.closePath();

    return path;
  }

  function createCropShapePath(x, y, width, height, definition) {
    const shape = definition?.shape || "rectangle";

    /* ---------- Rectangle ---------- */

    if (shape === "rectangle") {
      const path = new Path2D();

      path.rect(x, y, width, height);

      return path;
    }

    /* ---------- Disc ---------- */

    if (shape === "disc") {
      const path = new Path2D();

      path.arc(
        x + width / 2,
        y + height / 2,
        Math.min(width, height) / 2,
        0,
        Math.PI * 2,
      );

      path.closePath();

      return path;
    }

    /* ---------- GBA ---------- */

    if (shape === "gba") {
      return createPolygonPath(x, y, width, height, [
        [0.08, 0.05],
        [0.92, 0.05],
        [0.97, 0.18],
        [0.97, 0.92],
        [0.03, 0.92],
        [0.03, 0.18],
      ]);
    }

    /* ---------- 3DS ---------- */

    if (shape === "3ds-card") {
      return createPolygonPath(x, y, width, height, [
        [0.04, 0.04],
        [0.87, 0.04],
        [0.87, 0.17],
        [1, 0.17],
        [1, 0.32],
        [0.94, 0.32],
        [0.94, 0.96],
        [0.04, 0.96],
        [0, 0.91],
        [0, 0.09],
      ]);
    }

    /* ---------- Switch ---------- */

    if (shape === "switch-card") {
      return createPolygonPath(x, y, width, height, [
        [0.1, 0.02],
        [0.9, 0.02],
        [0.98, 0.09],
        [0.98, 0.88],
        [0.89, 0.98],
        [0.11, 0.98],
        [0.02, 0.88],
        [0.02, 0.09],
      ]);
    }

    /* ---------- Vita ---------- */

    if (shape === "vita-card") {
      return createPolygonPath(x, y, width, height, [
        [0.13, 0.02],
        [0.87, 0.02],
        [0.98, 0.12],
        [0.98, 0.88],
        [0.86, 0.98],
        [0.14, 0.98],
        [0.02, 0.88],
        [0.02, 0.12],
      ]);
    }

    /* ---------- Nintendo 64 ---------- */

    if (shape === "n64") {
      const path = new Path2D();

      path.moveTo(x + width * 0.08, y + height * 0.22);

      path.quadraticCurveTo(
        x + width * 0.2,
        y + height * 0.04,
        x + width * 0.42,
        y + height * 0.04,
      );

      path.lineTo(x + width * 0.58, y + height * 0.04);

      path.quadraticCurveTo(
        x + width * 0.8,
        y + height * 0.04,
        x + width * 0.92,
        y + height * 0.22,
      );

      path.lineTo(x + width * 0.98, y + height * 0.92);

      path.lineTo(x + width * 0.02, y + height * 0.92);

      path.closePath();

      return path;
    }

    /* ---------- SNES ---------- */

    if (shape === "snes-pal" || shape === "snes-us") {
      return createRoundedRectPath(x, y, width, height, 0.09);
    }

    /* ---------- NES ---------- */

    if (shape === "nes") {
      return createRoundedRectPath(x, y, width, height, 0.025);
    }

    /*
      GB / GBC / DS / Generic cartridge /
      unknown cartridge shapes.
    */

    return createRoundedRectPath(x, y, width, height, 0.04);
  }

  /* =====================================================
     OUTLINE ASSET LOADING
  ===================================================== */

  function ensureShapeAsset(shape) {
    const assetPath = getOutlineAssetPath(shape);

    if (!assetPath) {
      return Promise.resolve(null);
    }

    if (shapeAssetCache.has(shape)) {
      return Promise.resolve(shapeAssetCache.get(shape));
    }

    if (shapeAssetPromises.has(shape)) {
      return shapeAssetPromises.get(shape);
    }

    const promise = new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        const sourceCanvas = document.createElement("canvas");

        sourceCanvas.width = image.naturalWidth;
        sourceCanvas.height = image.naturalHeight;

        const sourceCtx = sourceCanvas.getContext("2d", {
          willReadFrequently: true,
        });

        if (!sourceCtx) {
          reject(new Error(`Could not create source canvas for "${shape}".`));

          return;
        }

        sourceCtx.drawImage(image, 0, 0);

        const sourceData = sourceCtx.getImageData(
          0,
          0,
          sourceCanvas.width,
          sourceCanvas.height,
        );

        const pixels = sourceData.data;
        const alphaThreshold = 8;

        let minX = sourceCanvas.width;
        let minY = sourceCanvas.height;
        let maxX = -1;
        let maxY = -1;

        for (let y = 0; y < sourceCanvas.height; y += 1) {
          for (let x = 0; x < sourceCanvas.width; x += 1) {
            const index = (y * sourceCanvas.width + x) * 4;

            const alpha = pixels[index + 3];

            if (alpha <= alphaThreshold) {
              continue;
            }

            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }

        if (maxX < minX || maxY < minY) {
          reject(new Error(`The outline image for "${shape}" is empty.`));

          return;
        }

        const width = maxX - minX + 1;
        const height = maxY - minY + 1;

        const outlineCanvas = document.createElement("canvas");

        outlineCanvas.width = width;
        outlineCanvas.height = height;

        const outlineCtx = outlineCanvas.getContext("2d");

        if (!outlineCtx) {
          reject(new Error(`Could not create outline canvas for "${shape}".`));

          return;
        }

        outlineCtx.drawImage(
          sourceCanvas,

          minX,
          minY,
          width,
          height,

          0,
          0,
          width,
          height,
        );

        const outlineData = outlineCtx.getImageData(0, 0, width, height);

        const outlinePixels = outlineData.data;

        const pixelCount = width * height;

        const blocked = new Uint8Array(pixelCount);

        for (let i = 0; i < pixelCount; i += 1) {
          blocked[i] = outlinePixels[i * 4 + 3] > alphaThreshold ? 1 : 0;
        }

        const outside = new Uint8Array(pixelCount);

        const queue = new Int32Array(pixelCount);

        let queueStart = 0;
        let queueEnd = 0;

        function addOutside(x, y) {
          if (x < 0 || y < 0 || x >= width || y >= height) {
            return;
          }

          const index = y * width + x;

          if (blocked[index] || outside[index]) {
            return;
          }

          outside[index] = 1;

          queue[queueEnd] = index;
          queueEnd += 1;
        }

        for (let x = 0; x < width; x += 1) {
          addOutside(x, 0);
          addOutside(x, height - 1);
        }

        for (let y = 0; y < height; y += 1) {
          addOutside(0, y);
          addOutside(width - 1, y);
        }

        while (queueStart < queueEnd) {
          const index = queue[queueStart];

          queueStart += 1;

          const x = index % width;

          const y = Math.floor(index / width);

          addOutside(x - 1, y);
          addOutside(x + 1, y);
          addOutside(x, y - 1);
          addOutside(x, y + 1);
        }

        const maskCanvas = document.createElement("canvas");

        maskCanvas.width = width;
        maskCanvas.height = height;

        const maskCtx = maskCanvas.getContext("2d");

        if (!maskCtx) {
          reject(new Error(`Could not create mask canvas for "${shape}".`));

          return;
        }

        const maskData = maskCtx.createImageData(width, height);

        for (let i = 0; i < pixelCount; i += 1) {
          const isInside = blocked[i] || !outside[i];

          const index = i * 4;

          maskData.data[index] = 255;
          maskData.data[index + 1] = 255;
          maskData.data[index + 2] = 255;
          maskData.data[index + 3] = isInside ? 255 : 0;
        }

        maskCtx.putImageData(maskData, 0, 0);

        const asset = {
          outline: outlineCanvas,
          mask: maskCanvas,
          ratio: width / height,
        };

        shapeAssetCache.set(shape, asset);

        resolve(asset);
      };

      image.onerror = () => {
        reject(new Error(`Could not load outline asset: ${assetPath}`));
      };

      image.src = assetPath;
    }).finally(() => {
      shapeAssetPromises.delete(shape);
    });

    shapeAssetPromises.set(shape, promise);

    return promise;
  }

  /* =====================================================
     THIN OUTLINE GENERATION
  ===================================================== */

  function createThinShapeOutline(asset, width, height) {
    if (!asset?.mask) {
      return null;
    }

    const outlineWidth = Math.max(1, Math.round(width));

    const outlineHeight = Math.max(1, Math.round(height));

    const resizedMask = document.createElement("canvas");

    resizedMask.width = outlineWidth;
    resizedMask.height = outlineHeight;

    const resizedCtx = resizedMask.getContext("2d", {
      willReadFrequently: true,
    });

    if (!resizedCtx) {
      return null;
    }

    resizedCtx.imageSmoothingEnabled = true;

    resizedCtx.drawImage(asset.mask, 0, 0, outlineWidth, outlineHeight);

    const maskData = resizedCtx.getImageData(0, 0, outlineWidth, outlineHeight);

    const maskPixels = maskData.data;

    const outlineCanvas = document.createElement("canvas");

    outlineCanvas.width = outlineWidth;
    outlineCanvas.height = outlineHeight;

    const outlineCtx = outlineCanvas.getContext("2d");

    if (!outlineCtx) {
      return null;
    }

    const outlineData = outlineCtx.createImageData(outlineWidth, outlineHeight);

    const outlinePixels = outlineData.data;

    const accent =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--accent")
        .trim() || "#d6ff4b";

    let red = 214;
    let green = 255;
    let blue = 75;

    if (/^#[0-9a-f]{6}$/i.test(accent)) {
      red = parseInt(accent.slice(1, 3), 16);

      green = parseInt(accent.slice(3, 5), 16);

      blue = parseInt(accent.slice(5, 7), 16);
    }

    function isInside(x, y) {
      if (x < 0 || y < 0 || x >= outlineWidth || y >= outlineHeight) {
        return false;
      }

      const index = (y * outlineWidth + x) * 4;

      return maskPixels[index + 3] > 127;
    }

    for (let y = 0; y < outlineHeight; y += 1) {
      for (let x = 0; x < outlineWidth; x += 1) {
        if (!isInside(x, y)) {
          continue;
        }

        const boundary =
          !isInside(x - 1, y) ||
          !isInside(x + 1, y) ||
          !isInside(x, y - 1) ||
          !isInside(x, y + 1);

        if (!boundary) {
          continue;
        }

        const index = (y * outlineWidth + x) * 4;

        outlinePixels[index] = red;
        outlinePixels[index + 1] = green;
        outlinePixels[index + 2] = blue;
        outlinePixels[index + 3] = 255;
      }
    }

    outlineCtx.putImageData(outlineData, 0, 0);

    return outlineCanvas;
  }

  /* =====================================================
     CROPPER FACTORY
  ===================================================== */

  function create(options = {}) {
    const getCropDefinition =
      typeof options.getCropDefinition === "function"
        ? options.getCropDefinition
        : () => ({
            ratio: 1,
            shape: "rectangle",
            holeRatio: 0,
          });

    const getCropTitle =
      typeof options.getCropTitle === "function" ? options.getCropTitle : null;

    const getOutputFileName =
      typeof options.getOutputFileName === "function"
        ? options.getOutputFileName
        : null;

    const onCommit =
      typeof options.onCommit === "function" ? options.onCommit : null;

    /* ===================================================
       ELEMENTS
    =================================================== */

    const cropperModal = document.getElementById("cropper-modal");

    const cropperStage = document.getElementById("cropper-stage");

    const cropperCanvas = document.getElementById("cropper-canvas");

    const cropperMask = document.getElementById("cropper-mask");

    const cropperTitle = document.getElementById("cropper-title");

    const cropperZoom = document.getElementById("cropper-zoom");

    const cropperZoomOut = document.getElementById("cropper-zoom-out");

    const cropperZoomIn = document.getElementById("cropper-zoom-in");

    const cropperZoomValueDisplay =
      document.getElementById("cropper-zoom-value");

    const cropperRotation = document.getElementById("cropper-rotation");

    const cropperRotationValueDisplay = document.getElementById(
      "cropper-rotation-value",
    );

    const cropperRotationReset = document.getElementById(
      "cropper-rotation-reset",
    );

    const cropperClose = document.getElementById("cropper-close");

    const cropperCancel = document.getElementById("cropper-cancel");

    const cropperApply = document.getElementById("cropper-apply");

    const ctx = cropperCanvas?.getContext("2d");

    /* ===================================================
       STATE
    =================================================== */

    let cropperInput = null;
    let cropperUploadBox = null;
    let cropperImage = null;

    let cropperRole = "front";

    let cropperZoomValue = 0.75;
    let cropperRotationValue = 0;

    let cropperOffsetX = 0;
    let cropperOffsetY = 0;

    let dragStartX = 0;
    let dragStartY = 0;

    let dragOriginX = 0;
    let dragOriginY = 0;

    let isDragging = false;

    let objectUrl = null;

    const imageState = new WeakMap();

    /* ===================================================
       BASIC HELPERS
    =================================================== */

    function getDefinition() {
      return (
        getCropDefinition({
          role: cropperRole,
          uploadBox: cropperUploadBox,
          input: cropperInput,
        }) || {
          ratio: 1,
          shape: "rectangle",
          holeRatio: 0,
        }
      );
    }

    function getActiveOutlineShape() {
      const shape = getDefinition()?.shape || "";

      return usesOutlineAsset(shape) ? shape : "";
    }

    function getStageRect() {
      return cropperStage.getBoundingClientRect();
    }

    function getMaskRect() {
      return cropperMask.getBoundingClientRect();
    }

    function getRotationRadians() {
      return cropperRotationValue * (Math.PI / 180);
    }

    function getCropRatio() {
      const definition = getDefinition();

      const shape = definition?.shape || "";

      if (usesOutlineAsset(shape)) {
        const asset = shapeAssetCache.get(shape);

        if (asset?.ratio) {
          return asset.ratio;
        }
      }

      return definition?.ratio || 1;
    }

    /* ===================================================
       IMAGE STATE
    =================================================== */

    function getState(uploadBox) {
      return imageState.get(uploadBox) || null;
    }

    function updateRemoveButton(uploadBox) {
      const input = uploadBox?.querySelector('input[type="file"]');

      const removeButton = uploadBox?.querySelector(".image-remove-button");

      if (!input || !removeButton) {
        return;
      }

      const state = imageState.get(uploadBox);

      const hasImage = Boolean(
        state?.hasImage &&
        (state.file || state.existingImage || input.files?.length),
      );

      removeButton.style.display = hasImage ? "inline-flex" : "none";
    }

    function restoreCommittedFileToInput(input, uploadBox) {
      if (!input || !uploadBox) {
        return;
      }

      const state = imageState.get(uploadBox);

      try {
        const dataTransfer = new DataTransfer();

        if (state?.file) {
          dataTransfer.items.add(state.file);
        }

        input.files = dataTransfer.files;
      } catch (error) {
        if (!state?.file) {
          input.value = "";
        }
      }

      updateRemoveButton(uploadBox);
    }

    function resetUploadBox(uploadBox) {
      if (!uploadBox) {
        return;
      }

      if (cropperUploadBox === uploadBox) {
        closeCropper();
      }

      const input = uploadBox.querySelector('input[type="file"]');

      const preview = uploadBox.querySelector(".image-upload-preview");

      const oldState = imageState.get(uploadBox);

      if (oldState?.objectUrl?.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(oldState.objectUrl);
        } catch (error) {
          /* Already revoked. */
        }
      }

      preview?.querySelectorAll(".cropped-preview-image").forEach((image) => {
        image.remove();
      });

      const placeholder = preview?.querySelector(".image-upload-placeholder");

      if (placeholder) {
        placeholder.style.display = "";

        if (placeholder.dataset.defaultLabel) {
          placeholder.textContent = placeholder.dataset.defaultLabel;
        }
      }

      if (input) {
        input.value = "";
      }

      uploadBox.classList.remove("has-image");

      imageState.delete(uploadBox);

      updateRemoveButton(uploadBox);
    }

    function disposeUploadBox(uploadBox) {
      if (!uploadBox) {
        return;
      }

      resetUploadBox(uploadBox);

      uploadBox.remove();
    }

    function showExistingImage(
      uploadBox,
      imageRecord,
      { signedUrl = imageRecord?.signedUrl || null, alt = "" } = {},
    ) {
      if (!uploadBox || !imageRecord) {
        return;
      }

      const input = uploadBox.querySelector('input[type="file"]');

      const preview = uploadBox.querySelector(".image-upload-preview");

      const placeholder = preview?.querySelector(".image-upload-placeholder");

      if (!input || !preview) {
        return;
      }

      if (placeholder && !placeholder.dataset.defaultLabel) {
        placeholder.dataset.defaultLabel = placeholder.textContent.trim();
      }

      preview.querySelector(".cropped-preview-image")?.remove();

      input.value = "";

      if (signedUrl) {
        const image = document.createElement("img");

        image.className = "cropped-preview-image";

        image.src = signedUrl;

        image.alt = alt || `${imageRecord.image_type || "Saved"} image`;

        preview.appendChild(image);

        uploadBox.classList.add("has-image");

        if (placeholder) {
          placeholder.style.display = "none";
        }
      } else {
        uploadBox.classList.remove("has-image");

        if (placeholder) {
          placeholder.textContent = "SAVED IMAGE";

          placeholder.style.display = "";
        }
      }

      imageState.set(uploadBox, {
        hasImage: true,
        objectUrl: null,
        file: null,
        existingImage: imageRecord,
      });

      updateRemoveButton(uploadBox);
    }

    /* ===================================================
       UPLOAD INITIALIZATION
    =================================================== */

    function initializeUploadBox(uploadBox) {
      if (!uploadBox || uploadBox.dataset.uploadInitialized === "true") {
        return;
      }

      uploadBox.dataset.uploadInitialized = "true";

      const input = uploadBox.querySelector('input[type="file"]');

      const removeButton = uploadBox.querySelector(".image-remove-button");

      if (!input) {
        return;
      }

      updateRemoveButton(uploadBox);

      input.addEventListener("change", (event) => {
        const file = event.target.files?.[0];

        if (!file) {
          updateRemoveButton(uploadBox);

          return;
        }

        if (!file.type.startsWith("image/")) {
          restoreCommittedFileToInput(input, uploadBox);

          return;
        }

        openCropper(file, input, uploadBox);
      });

      removeButton?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        resetUploadBox(uploadBox);
      });
    }

    function initializeAll(root = document) {
      root
        .querySelectorAll(".image-upload[data-image-role]")
        .forEach((uploadBox) => {
          initializeUploadBox(uploadBox);
        });
    }

    /* ===================================================
       CONTROL DISPLAY
    =================================================== */

    function updateControlDisplays() {
      if (cropperZoomValueDisplay) {
        cropperZoomValueDisplay.textContent = `${Math.round(
          cropperZoomValue * 100,
        )}%`;
      }

      if (cropperRotationValueDisplay) {
        const angle =
          Math.abs(cropperRotationValue) < 0.05 ? 0 : cropperRotationValue;

        cropperRotationValueDisplay.textContent = `${angle.toFixed(1)}°`;
      }
    }

    /* ===================================================
       CROPPER MASK
    =================================================== */

    function updateCropperMask() {
      if (!cropperMask || !cropperStage) {
        return;
      }

      const stageWidth = cropperStage.clientWidth;

      const stageHeight = cropperStage.clientHeight;

      const ratio = getCropRatio();

      const maxWidth = stageWidth * 0.72;

      const maxHeight = stageHeight * 0.82;

      let cropWidth = Math.min(maxWidth, maxHeight * ratio);

      let cropHeight = cropWidth / ratio;

      /*
        Keep disc-type media reasonably
        sized on large desktop displays.
      */

      if (cropperRole === "disc" && cropWidth > 440) {
        cropWidth = 440;
        cropHeight = cropWidth / ratio;
      }

      cropperMask.style.width = `${cropWidth}px`;

      cropperMask.style.height = `${cropHeight}px`;
    }

    function setupCropperCanvas() {
      if (!cropperCanvas || !cropperStage || !ctx) {
        return;
      }

      const rect = cropperStage.getBoundingClientRect();

      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      cropperCanvas.width = Math.round(rect.width * dpr);

      cropperCanvas.height = Math.round(rect.height * dpr);

      cropperCanvas.style.width = `${rect.width}px`;

      cropperCanvas.style.height = `${rect.height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /* ===================================================
       IMAGE GEOMETRY
    =================================================== */

    function getBaseScale() {
      if (!cropperImage || !cropperMask) {
        return 1;
      }

      const mask = getMaskRect();

      const angle = getRotationRadians();

      const cos = Math.abs(Math.cos(angle));

      const sin = Math.abs(Math.sin(angle));

      const requiredWidth = mask.width * cos + mask.height * sin;

      const requiredHeight = mask.width * sin + mask.height * cos;

      const widthScale = requiredWidth / cropperImage.naturalWidth;

      const heightScale = requiredHeight / cropperImage.naturalHeight;

      return Math.max(widthScale, heightScale) * 1.015;
    }

    function getImageGeometry() {
      const stage = getStageRect();

      const scale = getBaseScale() * cropperZoomValue;

      const width = cropperImage.naturalWidth * scale;

      const height = cropperImage.naturalHeight * scale;

      const centerX = stage.width / 2 + cropperOffsetX;

      const centerY = stage.height / 2 + cropperOffsetY;

      return {
        scale,
        width,
        height,
        centerX,
        centerY,
        angle: getRotationRadians(),
      };
    }

    function clampOffsets() {
      if (!cropperImage || !cropperStage || !cropperMask) {
        return;
      }

      const stage = getStageRect();
      const mask = getMaskRect();

      const geometry = getImageGeometry();

      const angle = geometry.angle;

      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      const absCos = Math.abs(cos);

      const absSin = Math.abs(sin);

      const cropCenterX = mask.left - stage.left + mask.width / 2;

      const cropCenterY = mask.top - stage.top + mask.height / 2;

      const cropHalfWidthLocal =
        (mask.width * absCos + mask.height * absSin) / 2;

      const cropHalfHeightLocal =
        (mask.width * absSin + mask.height * absCos) / 2;

      const imageHalfWidth = geometry.width / 2;

      const imageHalfHeight = geometry.height / 2;

      const maxLocalX = Math.max(0, imageHalfWidth - cropHalfWidthLocal);

      const maxLocalY = Math.max(0, imageHalfHeight - cropHalfHeightLocal);

      const deltaX = cropCenterX - geometry.centerX;

      const deltaY = cropCenterY - geometry.centerY;

      let localX = cos * deltaX + sin * deltaY;

      let localY = -sin * deltaX + cos * deltaY;

      localX = Math.max(-maxLocalX, Math.min(maxLocalX, localX));

      localY = Math.max(-maxLocalY, Math.min(maxLocalY, localY));

      const clampedDeltaX = cos * localX - sin * localY;

      const clampedDeltaY = sin * localX + cos * localY;

      const imageCenterX = cropCenterX - clampedDeltaX;

      const imageCenterY = cropCenterY - clampedDeltaY;

      cropperOffsetX = imageCenterX - stage.width / 2;

      cropperOffsetY = imageCenterY - stage.height / 2;
    }

    /* ===================================================
       OUTLINE OVERLAY
    =================================================== */

    function drawOutlineAssetOverlay(
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      shape,
    ) {
      if (!ctx || !cropperStage) {
        return false;
      }

      const asset = shapeAssetCache.get(shape);

      if (!asset?.mask) {
        return false;
      }

      const stage = getStageRect();

      const overlayCanvas = document.createElement("canvas");

      overlayCanvas.width = Math.max(1, Math.ceil(stage.width));

      overlayCanvas.height = Math.max(1, Math.ceil(stage.height));

      const overlayCtx = overlayCanvas.getContext("2d");

      if (!overlayCtx) {
        return false;
      }

      overlayCtx.fillStyle = "rgba(0, 0, 0, 0.58)";

      overlayCtx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);

      overlayCtx.globalCompositeOperation = "destination-out";

      overlayCtx.drawImage(asset.mask, cropX, cropY, cropWidth, cropHeight);

      overlayCtx.globalCompositeOperation = "source-over";

      ctx.drawImage(overlayCanvas, 0, 0);

      const thinOutline = createThinShapeOutline(asset, cropWidth, cropHeight);

      if (!thinOutline) {
        return true;
      }

      ctx.drawImage(thinOutline, cropX, cropY, cropWidth, cropHeight);

      return true;
    }

    /* ===================================================
       OVERLAY
    =================================================== */

    function drawCropOverlay() {
      if (!ctx || !cropperStage || !cropperMask) {
        return;
      }

      const stage = getStageRect();
      const mask = getMaskRect();

      const cropX = mask.left - stage.left;

      const cropY = mask.top - stage.top;

      const activeOutlineShape = getActiveOutlineShape();

      if (
        activeOutlineShape &&
        drawOutlineAssetOverlay(
          cropX,
          cropY,
          mask.width,
          mask.height,
          activeOutlineShape,
        )
      ) {
        return;
      }

      const definition = getDefinition();

      const shapePath = createCropShapePath(
        cropX,
        cropY,
        mask.width,
        mask.height,
        definition,
      );

      const overlay = new Path2D();

      overlay.rect(0, 0, stage.width, stage.height);

      overlay.addPath(shapePath);

      ctx.save();

      ctx.fillStyle = "rgba(0, 0, 0, 0.58)";

      ctx.fill(overlay, "evenodd");

      const accent =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--accent")
          .trim() || "#d6ff4b";

      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;

      ctx.stroke(shapePath);

      if (definition.holeRatio > 0) {
        const holeDiameter =
          Math.min(mask.width, mask.height) * definition.holeRatio;

        ctx.beginPath();

        ctx.arc(
          cropX + mask.width / 2,
          cropY + mask.height / 2,
          holeDiameter / 2,
          0,
          Math.PI * 2,
        );

        ctx.fillStyle = "#0d0d0d";

        ctx.fill();

        ctx.strokeStyle = accent;

        ctx.stroke();
      }

      ctx.restore();
    }

    /* ===================================================
       DRAW
    =================================================== */

    function drawCropper() {
      if (!ctx || !cropperCanvas || !cropperImage || !cropperStage) {
        return;
      }

      const stage = getStageRect();

      ctx.clearRect(0, 0, stage.width, stage.height);

      clampOffsets();

      const geometry = getImageGeometry();

      ctx.save();

      ctx.translate(geometry.centerX, geometry.centerY);

      ctx.rotate(geometry.angle);

      ctx.drawImage(
        cropperImage,

        -geometry.width / 2,
        -geometry.height / 2,

        geometry.width,
        geometry.height,
      );

      ctx.restore();

      drawCropOverlay();
    }

    /* ===================================================
       OPEN
    =================================================== */

    async function openCropper(file, input, uploadBox) {
      if (!cropperModal || !cropperStage || !cropperCanvas) {
        return;
      }

      cropperInput = input;
      cropperUploadBox = uploadBox;

      cropperRole = uploadBox.dataset.imageRole || "front";

      const previousState = imageState.get(uploadBox);

      cropperInput._shelfmarkPreviousFiles = previousState?.file
        ? [previousState.file]
        : [];

      const definition = getDefinition();

      const outlineShape = usesOutlineAsset(definition?.shape)
        ? definition.shape
        : "";

      if (outlineShape) {
        try {
          await ensureShapeAsset(outlineShape);
        } catch (error) {
          console.error("Shelfmark crop outline error:", error);

          restoreCommittedFileToInput(input, uploadBox);

          cropperInput = null;
          cropperUploadBox = null;

          return;
        }
      }

      const discNumber = Number(uploadBox.dataset.discNumber) || null;

      if (cropperTitle) {
        if (getCropTitle) {
          cropperTitle.textContent = getCropTitle({
            role: cropperRole,
            uploadBox,
            definition,
            discNumber,
          });
        } else if (cropperRole === "disc") {
          if (definition?.shape === "umd") {
            cropperTitle.textContent =
              discNumber > 1 ? `Crop UMD ${discNumber}` : "Crop UMD";
          } else {
            cropperTitle.textContent = discNumber
              ? `Crop disc ${discNumber}`
              : "Crop disc";
          }
        } else {
          const titleMap = {
            front: "Crop front",
            back: "Crop back",
            side: "Crop side",
            manual: "Crop manual",
            cartridge: "Crop cartridge",
          };

          cropperTitle.textContent = titleMap[cropperRole] || "Crop image";
        }
      }

      cropperZoomValue = 0.75;
      cropperRotationValue = 0;

      cropperOffsetX = 0;
      cropperOffsetY = 0;

      if (cropperZoom) {
        cropperZoom.value = "0.75";
      }

      if (cropperRotation) {
        cropperRotation.value = "0";
      }

      updateControlDisplays();

      const image = new Image();

      const newObjectUrl = URL.createObjectURL(file);

      objectUrl = newObjectUrl;

      image.onload = () => {
        cropperImage = image;

        cropperModal.classList.add("visible");

        cropperModal.setAttribute("aria-hidden", "false");

        document.body.classList.add("cropper-open");

        requestAnimationFrame(() => {
          updateCropperMask();
          setupCropperCanvas();
          clampOffsets();
          drawCropper();
        });
      };

      image.onerror = () => {
        URL.revokeObjectURL(newObjectUrl);

        restoreCommittedFileToInput(input, uploadBox);

        objectUrl = null;
        cropperImage = null;
        cropperInput = null;
        cropperUploadBox = null;
      };

      image.src = newObjectUrl;
    }

    /* ===================================================
       CLOSE
    =================================================== */

    function closeCropper({ commit = false } = {}) {
      if (!cropperModal) {
        return;
      }

      if (!commit && cropperInput && cropperUploadBox) {
        try {
          const previousFiles = cropperInput._shelfmarkPreviousFiles || [];

          const dataTransfer = new DataTransfer();

          previousFiles.forEach((file) => {
            dataTransfer.items.add(file);
          });

          cropperInput.files = dataTransfer.files;
        } catch (error) {
          restoreCommittedFileToInput(cropperInput, cropperUploadBox);
        }

        updateRemoveButton(cropperUploadBox);
      }

      cropperModal.classList.remove("visible");

      cropperModal.setAttribute("aria-hidden", "true");

      document.body.classList.remove("cropper-open");

      if (objectUrl?.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch (error) {
          /* Already revoked. */
        }
      }

      objectUrl = null;
      cropperImage = null;
      cropperInput = null;
      cropperUploadBox = null;

      cropperOffsetX = 0;
      cropperOffsetY = 0;

      isDragging = false;

      cropperStage?.classList.remove("dragging");
    }

    /* ===================================================
       APPLY
    =================================================== */

    async function applyCrop() {
      if (!cropperImage || !cropperInput || !cropperUploadBox || !cropperMask) {
        return;
      }

      clampOffsets();

      const stage = getStageRect();
      const mask = getMaskRect();

      const geometry = getImageGeometry();

      const cropX = mask.left - stage.left;

      const cropY = mask.top - stage.top;

      const cropWidth = mask.width;
      const cropHeight = mask.height;

      const ratio = getCropRatio();

      const cropDefinition = getDefinition();

      const MAX_OUTPUT = 1200;

      const activeOutlineShape = getActiveOutlineShape();

      let shapeAsset = null;

      if (activeOutlineShape) {
        try {
          shapeAsset = await ensureShapeAsset(activeOutlineShape);
        } catch (error) {
          console.warn("Shelfmark outline asset error:", error);
        }
      }

      let outputWidth;
      let outputHeight;
      let outputScale;

      if (ratio >= 1) {
        outputWidth = MAX_OUTPUT;

        outputScale = outputWidth / cropWidth;

        outputHeight = Math.round(cropHeight * outputScale);
      } else {
        outputHeight = MAX_OUTPUT;

        outputScale = outputHeight / cropHeight;

        outputWidth = Math.round(cropWidth * outputScale);
      }

      const outputCanvas = document.createElement("canvas");

      outputCanvas.width = outputWidth;

      outputCanvas.height = outputHeight;

      const outputCtx = outputCanvas.getContext("2d");

      if (!outputCtx) {
        return;
      }

      outputCtx.imageSmoothingEnabled = true;

      outputCtx.imageSmoothingQuality = "high";

      const outputImageCenterX = (geometry.centerX - cropX) * outputScale;

      const outputImageCenterY = (geometry.centerY - cropY) * outputScale;

      const outputImageWidth = geometry.width * outputScale;

      const outputImageHeight = geometry.height * outputScale;

      /* ---------- Photograph ---------- */

      outputCtx.save();

      outputCtx.translate(outputImageCenterX, outputImageCenterY);

      outputCtx.rotate(geometry.angle);

      outputCtx.drawImage(
        cropperImage,

        -outputImageWidth / 2,
        -outputImageHeight / 2,

        outputImageWidth,
        outputImageHeight,
      );

      outputCtx.restore();

      /* ---------- Physical shape ---------- */

      if (shapeAsset?.mask) {
        outputCtx.save();

        outputCtx.globalCompositeOperation = "destination-in";

        outputCtx.drawImage(shapeAsset.mask, 0, 0, outputWidth, outputHeight);

        outputCtx.restore();
      } else {
        const outputShape = createCropShapePath(
          0,
          0,
          outputWidth,
          outputHeight,
          cropDefinition,
        );

        outputCtx.save();

        outputCtx.globalCompositeOperation = "destination-in";

        outputCtx.fillStyle = "#ffffff";

        outputCtx.fill(outputShape);

        outputCtx.restore();
      }

      /* ---------- Disc hole ---------- */

      if (!shapeAsset && cropDefinition.holeRatio > 0) {
        const holeDiameter =
          Math.min(outputWidth, outputHeight) * cropDefinition.holeRatio;

        outputCtx.save();

        outputCtx.globalCompositeOperation = "destination-out";

        outputCtx.beginPath();

        outputCtx.arc(
          outputWidth / 2,
          outputHeight / 2,
          holeDiameter / 2,
          0,
          Math.PI * 2,
        );

        outputCtx.fill();

        outputCtx.restore();
      }

      /* ---------- File ---------- */

      outputCanvas.toBlob((blob) => {
        if (!blob || !cropperUploadBox || !cropperInput) {
          return;
        }

        const uploadBox = cropperUploadBox;

        const input = cropperInput;

        const preview = uploadBox.querySelector(".image-upload-preview");

        if (!preview) {
          return;
        }

        const oldState = imageState.get(uploadBox);

        if (oldState?.objectUrl?.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(oldState.objectUrl);
          } catch (error) {
            /* Already revoked. */
          }
        }

        preview.querySelector(".cropped-preview-image")?.remove();

        const previewUrl = URL.createObjectURL(blob);

        const discNumber = Number(uploadBox.dataset.discNumber) || null;

        let fileName;

        if (getOutputFileName) {
          fileName = getOutputFileName({
            role: cropperRole,
            uploadBox,
            discNumber,
            definition: cropDefinition,
          });
        }

        const outputType = blob.type || OUTPUT_MIME_TYPE;

        const extension =
          outputType === "image/webp"
            ? "webp"
            : outputType === "image/jpeg"
              ? "jpg"
              : "png";

        if (!fileName) {
          fileName =
            cropperRole === "disc" && discNumber
              ? `disc-${discNumber}.${extension}`
              : `${cropperRole}.${extension}`;
        } else {
          fileName = /\.(?:png|jpe?g|webp)$/i.test(fileName)
            ? fileName.replace(/\.(?:png|jpe?g|webp)$/i, `.${extension}`)
            : `${fileName}.${extension}`;
        }

        const croppedFile = new File([blob], fileName, {
          type: outputType,
        });

        const image = document.createElement("img");

        image.className = "cropped-preview-image";

        image.src = previewUrl;

        image.alt =
          cropperRole === "disc" && discNumber
            ? `Disc ${discNumber} image`
            : `${cropperRole} image`;

        image.dataset.objectUrl = previewUrl;

        preview.appendChild(image);

        uploadBox.classList.add("has-image");

        const placeholder = preview.querySelector(".image-upload-placeholder");

        if (placeholder) {
          placeholder.style.display = "none";
        }

        imageState.set(uploadBox, {
          hasImage: true,
          objectUrl: previewUrl,
          file: croppedFile,
          existingImage: oldState?.existingImage || null,
        });

        try {
          const dataTransfer = new DataTransfer();

          dataTransfer.items.add(croppedFile);

          input.files = dataTransfer.files;
        } catch (error) {
          console.warn("Could not replace input file:", error);
        }

        updateRemoveButton(uploadBox);

        onCommit?.({
          uploadBox,
          input,
          file: croppedFile,
          role: cropperRole,
          discNumber,
          definition: cropDefinition,
        });

        closeCropper({
          commit: true,
        });
      }, OUTPUT_MIME_TYPE, OUTPUT_QUALITY);
    }

    /* ===================================================
       REFRESH
    =================================================== */

    function refreshCropper() {
      if (!cropperModal?.classList.contains("visible")) {
        return;
      }

      const definition = getDefinition();

      const shape = definition?.shape || "";

      const finish = () => {
        updateCropperMask();
        setupCropperCanvas();
        clampOffsets();
        drawCropper();
      };

      if (usesOutlineAsset(shape) && !shapeAssetCache.has(shape)) {
        ensureShapeAsset(shape)
          .then(finish)
          .catch((error) => {
            console.warn("Shelfmark crop outline error:", error);

            finish();
          });

        return;
      }

      finish();
    }

    /* ===================================================
       CONTROLS
    =================================================== */

    cropperZoom?.addEventListener("input", () => {
      cropperZoomValue = parseFloat(cropperZoom.value) || 0.75;

      updateControlDisplays();
      clampOffsets();
      drawCropper();
    });

    cropperZoomOut?.addEventListener("click", () => {
      cropperZoomValue = Math.max(
        parseFloat(cropperZoom?.min) || 0.35,

        cropperZoomValue - 0.1,
      );

      if (cropperZoom) {
        cropperZoom.value = String(cropperZoomValue);
      }

      updateControlDisplays();
      clampOffsets();
      drawCropper();
    });

    cropperZoomIn?.addEventListener("click", () => {
      cropperZoomValue = Math.min(
        parseFloat(cropperZoom?.max) || 3,

        cropperZoomValue + 0.1,
      );

      if (cropperZoom) {
        cropperZoom.value = String(cropperZoomValue);
      }

      updateControlDisplays();
      clampOffsets();
      drawCropper();
    });

    cropperRotation?.addEventListener("input", () => {
      cropperRotationValue = parseFloat(cropperRotation.value) || 0;

      updateControlDisplays();
      clampOffsets();
      drawCropper();
    });

    cropperRotationReset?.addEventListener("click", () => {
      cropperRotationValue = 0;

      if (cropperRotation) {
        cropperRotation.value = "0";
      }

      updateControlDisplays();
      clampOffsets();
      drawCropper();
    });

    /* ===================================================
       DRAGGING
    =================================================== */

    cropperStage?.addEventListener("pointerdown", (event) => {
      if (!cropperImage) {
        return;
      }

      isDragging = true;

      cropperStage.classList.add("dragging");

      dragStartX = event.clientX;

      dragStartY = event.clientY;

      dragOriginX = cropperOffsetX;

      dragOriginY = cropperOffsetY;

      cropperStage.setPointerCapture(event.pointerId);
    });

    cropperStage?.addEventListener("pointermove", (event) => {
      if (!isDragging) {
        return;
      }

      cropperOffsetX = dragOriginX + (event.clientX - dragStartX);

      cropperOffsetY = dragOriginY + (event.clientY - dragStartY);

      clampOffsets();
      drawCropper();
    });

    function stopDragging(event) {
      if (!isDragging) {
        return;
      }

      isDragging = false;

      cropperStage.classList.remove("dragging");

      try {
        cropperStage.releasePointerCapture(event.pointerId);
      } catch (error) {
        /* Already released. */
      }
    }

    cropperStage?.addEventListener("pointerup", stopDragging);

    cropperStage?.addEventListener("pointercancel", stopDragging);

    /* ===================================================
       MODAL EVENTS
    =================================================== */

    cropperClose?.addEventListener("click", () => closeCropper());

    cropperCancel?.addEventListener("click", () => closeCropper());

    cropperApply?.addEventListener("click", applyCrop);

    cropperModal?.addEventListener("click", (event) => {
      if (event.target === cropperModal) {
        closeCropper();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        cropperModal?.classList.contains("visible")
      ) {
        closeCropper();
      }
    });

    window.addEventListener("resize", () => {
      if (!cropperModal?.classList.contains("visible")) {
        return;
      }

      updateCropperMask();
      setupCropperCanvas();
      clampOffsets();
      drawCropper();
    });

    /* ===================================================
       PUBLIC API
    =================================================== */

    return {
      initializeUploadBox,
      initializeAll,

      resetUploadBox,
      disposeUploadBox,

      showExistingImage,

      getState,

      refreshCropper,

      isOpen() {
        return Boolean(cropperModal?.classList.contains("visible"));
      },

      getActiveUploadBox() {
        return cropperUploadBox;
      },
    };
  }

  /* =====================================================
     GLOBAL
  ===================================================== */

  window.ShelfmarkImageCropper = {
    create,
  };
})();
