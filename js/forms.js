document.addEventListener("DOMContentLoaded", () => {
  /* =====================================================
     ELEMENTS
  ===================================================== */

  const purchasePriceInput = document.getElementById("purchase-price");

  const estimatedValueInput = document.getElementById("estimated-value");

  const profitLoss = document.getElementById("profit-loss");

  const mediaTypeInputs = document.querySelectorAll('input[name="mediaType"]');

  const discUpload = document.getElementById("disc-upload");

  const cartridgeUpload = document.getElementById("cartridge-upload");

  const discCountField = document.getElementById("disc-count-field");

  const caseFormatInputs = document.querySelectorAll(
    'input[name="caseFormat"]',
  );

  const customCaseSettings = document.getElementById("custom-case-settings");

  const customWidth = document.getElementById("custom-width");

  const customHeight = document.getElementById("custom-height");

  /* =====================================================
     CROPPER ELEMENTS
  ===================================================== */

  const cropperModal = document.getElementById("cropper-modal");

  const cropperStage = document.getElementById("cropper-stage");

  const cropperCanvas = document.getElementById("cropper-canvas");

  const cropperMask = document.getElementById("cropper-mask");

  const cropperTitle = document.getElementById("cropper-title");

  const cropperZoom = document.getElementById("cropper-zoom");

  const cropperZoomOut = document.getElementById("cropper-zoom-out");

  const cropperZoomIn = document.getElementById("cropper-zoom-in");

  const cropperClose = document.getElementById("cropper-close");

  const cropperCancel = document.getElementById("cropper-cancel");

  const cropperApply = document.getElementById("cropper-apply");

  const ctx = cropperCanvas?.getContext("2d");

  /* =====================================================
     CASE FORMAT DEFINITIONS
  ===================================================== */

  /*
    Ratios are width / height.

    Dimensions are based on the external face dimensions
    of common physical cases.

    DVD:
      135 × 190 × 14 mm

    Blu-ray:
      135 × 171.5 × ~13 mm

    PS1 jewel:
      125 × 142 × 10 mm

    GameCube:
      107 × 149 × 17 mm

    PSP:
      99 × 168 × 14 mm

    Vita:
      105 × 135 × 12 mm

    DS / 3DS:
      approximately 122 × 135 mm

    Switch:
      104 × 170 × 10 mm
  */

  const CASE_FORMATS = {
    dvd: {
      cover: 135 / 190,
      side: 14 / 190,
      manual: 135 / 190,
    },

    "blu-ray": {
      cover: 135 / 171.5,
      side: 13 / 171.5,
      manual: 135 / 171.5,
    },

    ps1: {
      cover: 125 / 142,
      side: 10 / 142,
      manual: 125 / 142,
    },

    gamecube: {
      cover: 107 / 149,
      side: 17 / 149,
      manual: 107 / 149,
    },

    psp: {
      cover: 99 / 168,
      side: 14 / 168,
      manual: 99 / 168,
    },

    vita: {
      cover: 105 / 135,
      side: 12 / 135,
      manual: 105 / 135,
    },

    ds: {
      cover: 122 / 135,
      side: 15 / 135,
      manual: 122 / 135,
    },

    switch: {
      cover: 104 / 170,
      side: 10 / 170,
      manual: 104 / 170,
    },
  };

  /* =====================================================
     CROPPER STATE
  ===================================================== */

  let cropperInput = null;
  let cropperUploadBox = null;
  let cropperImage = null;

  let cropperRole = "front";
  let cropperZoomValue = 1;

  let cropperOffsetX = 0;
  let cropperOffsetY = 0;

  let dragStartX = 0;
  let dragStartY = 0;

  let dragOriginX = 0;
  let dragOriginY = 0;

  let isDragging = false;
  let objectUrl = null;

  /* =====================================================
     PROFIT / LOSS
  ===================================================== */

  function updateProfitLoss() {
    if (!purchasePriceInput || !estimatedValueInput || !profitLoss) {
      return;
    }

    const purchasePrice = parseFloat(purchasePriceInput.value);

    const estimatedValue = parseFloat(estimatedValueInput.value);

    if (Number.isNaN(purchasePrice) || Number.isNaN(estimatedValue)) {
      profitLoss.textContent = "—";

      profitLoss.classList.remove("positive", "negative");

      return;
    }

    const difference = estimatedValue - purchasePrice;

    const sign = difference >= 0 ? "+" : "-";

    profitLoss.textContent = `${sign}€${Math.abs(difference).toFixed(2)}`;

    profitLoss.classList.remove("positive", "negative");

    if (difference > 0) {
      profitLoss.classList.add("positive");
    }

    if (difference < 0) {
      profitLoss.classList.add("negative");
    }
  }

  purchasePriceInput?.addEventListener("input", updateProfitLoss);

  estimatedValueInput?.addEventListener("input", updateProfitLoss);

  /* =====================================================
     CASE GEOMETRY
  ===================================================== */

  function getSelectedCaseFormat() {
    return (
      document.querySelector('input[name="caseFormat"]:checked')?.value || "dvd"
    );
  }

  function getCustomRatio() {
    const width = parseFloat(customWidth?.value);

    const height = parseFloat(customHeight?.value);

    if (
      Number.isNaN(width) ||
      Number.isNaN(height) ||
      width <= 0 ||
      height <= 0
    ) {
      return 135 / 190;
    }

    return width / height;
  }

  function getCaseGeometry(role) {
    const format = getSelectedCaseFormat();

    if (format === "custom") {
      const coverRatio = getCustomRatio();

      /*
        A custom case only asks for the cover
        dimensions, so the side ratio is
        estimated from a standard DVD-style
        spine proportion.
      */

      if (role === "side") {
        return {
          ratio: coverRatio * (14 / 135),
        };
      }

      return {
        ratio: coverRatio,
      };
    }

    const definition = CASE_FORMATS[format] || CASE_FORMATS.dvd;

    if (role === "side") {
      return {
        ratio: definition.side,
      };
    }

    if (role === "manual") {
      return {
        ratio: definition.manual,
      };
    }

    return {
      ratio: definition.cover,
    };
  }

  /* =====================================================
     CROP RATIO
  ===================================================== */

  function getCropRatio() {
    if (cropperRole === "disc") {
      return 1;
    }

    if (cropperRole === "cartridge") {
      return 0.78;
    }

    return getCaseGeometry(cropperRole).ratio;
  }

  /* =====================================================
     UPLOAD PREVIEW GEOMETRY
  ===================================================== */

  function updateUploadPreviewGeometry() {
    const uploadBoxes = document.querySelectorAll(
      ".image-upload[data-image-role]",
    );

    let coverHeight = 0;

    /*
      Use the front preview as the reference
      height for the side panel.
    */

    const frontPreview = document.querySelector(
      '[data-image-role="front"] .image-upload-preview',
    );

    if (frontPreview) {
      const frontWidth = frontPreview.clientWidth;

      const frontRatio = getCaseGeometry("front").ratio;

      if (frontWidth > 0 && frontRatio > 0) {
        coverHeight = frontWidth / frontRatio;
      }
    }

    /*
      If the page has not completed layout yet,
      use a sensible fallback.
    */

    if (coverHeight <= 0) {
      coverHeight = 380;
    }

    uploadBoxes.forEach((uploadBox) => {
      const role = uploadBox.dataset.imageRole;

      const preview = uploadBox.querySelector(".image-upload-preview");

      if (!preview) {
        return;
      }

      preview.classList.remove(
        "preview-side",
        "preview-disc",
        "preview-cartridge",
      );

      preview.style.removeProperty("aspect-ratio");

      /*
        DISC
      */

      if (role === "disc") {
        preview.classList.add("preview-disc");

        return;
      }

      /*
        CARTRIDGE
      */

      if (role === "cartridge") {
        preview.classList.add("preview-cartridge");

        return;
      }

      /*
        SIDE
      */

      if (role === "side") {
        const geometry = getCaseGeometry("side");

        const sideWidth = coverHeight * geometry.ratio;

        preview.classList.add("preview-side");

        preview.style.setProperty("--side-preview-height", `${coverHeight}px`);

        preview.style.setProperty("--side-preview-width", `${sideWidth}px`);

        return;
      }

      /*
        FRONT / BACK / MANUAL
      */

      const geometry = getCaseGeometry(role);

      preview.style.aspectRatio = geometry.ratio;
    });
  }

  /* =====================================================
     MEDIA TYPE
  ===================================================== */

  function updateMediaType() {
    const selected = document.querySelector(
      'input[name="mediaType"]:checked',
    )?.value;

    if (!selected) {
      return;
    }

    discUpload?.classList.toggle("is-hidden", selected !== "disc");

    cartridgeUpload?.classList.toggle("is-hidden", selected !== "cartridge");

    if (discCountField) {
      discCountField.style.display = selected === "disc" ? "" : "none";
    }

    updateUploadPreviewGeometry();
  }

  mediaTypeInputs.forEach((input) => {
    input.addEventListener("change", updateMediaType);
  });

  /* =====================================================
     CROPPER MASK
  ===================================================== */

  function updateCropperMask() {
    if (!cropperMask || !cropperStage) {
      return;
    }

    const stageWidth = cropperStage.clientWidth;

    const stageHeight = cropperStage.clientHeight;

    const ratio = getCropRatio();

    cropperMask.classList.remove(
      "rectangle",
      "side",
      "manual",
      "disc",
      "cartridge",
    );

    /*
      Keep the crop comfortably inside
      the editor stage.
    */

    const maxWidth = stageWidth * 0.72;

    const maxHeight = stageHeight * 0.82;

    let cropWidth;
    let cropHeight;

    /*
      DISC
    */

    if (cropperRole === "disc") {
      const size = Math.min(maxWidth, maxHeight, 440);

      cropWidth = size;
      cropHeight = size;

      cropperMask.classList.add("disc");
    } else {
      /*
      NORMAL RECTANGLE
    */
      cropWidth = Math.min(maxWidth, maxHeight * ratio);

      cropHeight = cropWidth / ratio;

      if (cropperRole === "side") {
        cropperMask.classList.add("side");
      } else if (cropperRole === "manual") {
        cropperMask.classList.add("manual");
      } else if (cropperRole === "cartridge") {
        cropperMask.classList.add("cartridge");
      } else {
        cropperMask.classList.add("rectangle");
      }
    }

    cropperMask.style.width = `${cropWidth}px`;

    cropperMask.style.height = `${cropHeight}px`;
  }

  /* =====================================================
     STAGE / MASK RECTANGLES
  ===================================================== */

  function getStageRect() {
    return cropperStage.getBoundingClientRect();
  }

  function getMaskRect() {
    return cropperMask.getBoundingClientRect();
  }

  /* =====================================================
     OPEN CROPPER
  ===================================================== */

  function openCropper(file, input, uploadBox) {
    if (!cropperModal || !cropperStage || !cropperCanvas) {
      return;
    }

    cropperInput = input;
    cropperUploadBox = uploadBox;

    /*
      Determine image role.
    */

    if (input.id === "image-disc") {
      cropperRole = "disc";
    } else if (input.id === "image-cartridge") {
      cropperRole = "cartridge";
    } else if (input.id === "image-side") {
      cropperRole = "side";
    } else if (input.id === "image-manual") {
      cropperRole = "manual";
    } else if (input.id === "image-back") {
      cropperRole = "back";
    } else {
      cropperRole = "front";
    }

    const titleMap = {
      front: "Crop front",
      back: "Crop back",
      side: "Crop side",
      manual: "Crop manual",
      disc: "Crop disc",
      cartridge: "Crop cartridge",
    };

    if (cropperTitle) {
      cropperTitle.textContent = titleMap[cropperRole] || "Crop image";
    }

    cropperZoomValue = 1;

    cropperOffsetX = 0;
    cropperOffsetY = 0;

    if (cropperZoom) {
      cropperZoom.value = "1";
    }

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

      objectUrl = null;

      cropperInput = null;
      cropperUploadBox = null;
    };

    image.src = newObjectUrl;
  }

  /* =====================================================
     CANVAS SETUP
  ===================================================== */

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

  /* =====================================================
     BASE SCALE
  ===================================================== */

  function getBaseScale() {
    if (!cropperImage || !cropperStage || !cropperMask) {
      return 1;
    }

    const mask = getMaskRect();

    const cropWidth = mask.width;

    const cropHeight = mask.height;

    const widthScale = cropWidth / cropperImage.naturalWidth;

    const heightScale = cropHeight / cropperImage.naturalHeight;

    /*
      Only scale enough to cover the
      crop area, rather than the whole
      editor.
    */

    return Math.max(widthScale, heightScale) * 1.015;
  }

  /* =====================================================
     IMAGE GEOMETRY
  ===================================================== */

  function getImageGeometry() {
    const stage = getStageRect();

    const baseScale = getBaseScale();

    const scale = baseScale * cropperZoomValue;

    const width = cropperImage.naturalWidth * scale;

    const height = cropperImage.naturalHeight * scale;

    const centerX = stage.width / 2;

    const centerY = stage.height / 2;

    const x = centerX - width / 2 + cropperOffsetX;

    const y = centerY - height / 2 + cropperOffsetY;

    return {
      scale,
      width,
      height,
      x,
      y,
    };
  }

  /* =====================================================
     PAN CLAMPING
  ===================================================== */

  function clampOffsets() {
    if (!cropperImage || !cropperStage || !cropperMask) {
      return;
    }

    const stage = getStageRect();

    const mask = getMaskRect();

    const cropLeft = mask.left - stage.left;

    const cropTop = mask.top - stage.top;

    const cropRight = cropLeft + mask.width;

    const cropBottom = cropTop + mask.height;

    const baseScale = getBaseScale();

    const scale = baseScale * cropperZoomValue;

    const imageWidth = cropperImage.naturalWidth * scale;

    const imageHeight = cropperImage.naturalHeight * scale;

    const baseX = stage.width / 2 - imageWidth / 2;

    const baseY = stage.height / 2 - imageHeight / 2;

    let minOffsetX = cropRight - (baseX + imageWidth);

    let maxOffsetX = cropLeft - baseX;

    let minOffsetY = cropBottom - (baseY + imageHeight);

    let maxOffsetY = cropTop - baseY;

    /*
      If zoomed out enough that the
      image is smaller than the crop,
      keep it centred.
    */

    if (minOffsetX > maxOffsetX) {
      const middle = (minOffsetX + maxOffsetX) / 2;

      minOffsetX = middle;

      maxOffsetX = middle;
    }

    if (minOffsetY > maxOffsetY) {
      const middle = (minOffsetY + maxOffsetY) / 2;

      minOffsetY = middle;

      maxOffsetY = middle;
    }

    cropperOffsetX = Math.max(minOffsetX, Math.min(maxOffsetX, cropperOffsetX));

    cropperOffsetY = Math.max(minOffsetY, Math.min(maxOffsetY, cropperOffsetY));
  }

  /* =====================================================
     DRAW CROPPER
  ===================================================== */

  function drawCropper() {
    if (!ctx || !cropperCanvas || !cropperImage || !cropperStage) {
      return;
    }

    const stage = getStageRect();

    ctx.clearRect(0, 0, stage.width, stage.height);

    clampOffsets();

    const geometry = getImageGeometry();

    ctx.drawImage(
      cropperImage,
      geometry.x,
      geometry.y,
      geometry.width,
      geometry.height,
    );
  }

  /* =====================================================
     APPLY CROP
  ===================================================== */

  function applyCrop() {
    if (!cropperImage || !cropperInput || !cropperUploadBox || !cropperMask) {
      return;
    }

    const stage = getStageRect();

    const mask = getMaskRect();

    const geometry = getImageGeometry();

    const cropX = mask.left - stage.left;

    const cropY = mask.top - stage.top;

    const cropWidth = mask.width;

    const cropHeight = mask.height;

    const sourceX = (cropX - geometry.x) / geometry.scale;

    const sourceY = (cropY - geometry.y) / geometry.scale;

    const sourceWidth = cropWidth / geometry.scale;

    const sourceHeight = cropHeight / geometry.scale;

    const ratio = getCropRatio();

    const MAX_OUTPUT = 1200;

    let outputWidth;
    let outputHeight;

    if (ratio >= 1) {
      outputWidth = MAX_OUTPUT;

      outputHeight = Math.round(MAX_OUTPUT / ratio);
    } else {
      outputHeight = MAX_OUTPUT;

      outputWidth = Math.round(MAX_OUTPUT * ratio);
    }

    /*
      DISC
    */

    if (cropperRole === "disc") {
      outputWidth = MAX_OUTPUT;

      outputHeight = MAX_OUTPUT;
    }

    const outputCanvas = document.createElement("canvas");

    outputCanvas.width = outputWidth;

    outputCanvas.height = outputHeight;

    const outputCtx = outputCanvas.getContext("2d");

    if (!outputCtx) {
      return;
    }

    /* =================================================
       DISC
    ================================================= */

    if (cropperRole === "disc") {
      outputCtx.save();

      outputCtx.beginPath();

      outputCtx.arc(
        outputWidth / 2,
        outputHeight / 2,
        outputWidth / 2,
        0,
        Math.PI * 2,
      );

      outputCtx.clip();

      outputCtx.drawImage(
        cropperImage,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputWidth,
        outputHeight,
      );

      /*
        Remove disc centre.
      */

      outputCtx.globalCompositeOperation = "destination-out";

      outputCtx.beginPath();

      outputCtx.arc(
        outputWidth / 2,
        outputHeight / 2,
        outputWidth * 0.065,
        0,
        Math.PI * 2,
      );

      outputCtx.fill();

      outputCtx.restore();
    } else {
      /* =================================================
       NORMAL IMAGE
    ================================================= */
      outputCtx.drawImage(
        cropperImage,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputWidth,
        outputHeight,
      );
    }

    /* =================================================
       CREATE FILE
    ================================================= */

    outputCanvas.toBlob((blob) => {
      if (!blob) {
        return;
      }

      const preview = cropperUploadBox.querySelector(".image-upload-preview");

      if (!preview) {
        return;
      }

      const oldImage = preview.querySelector("img");

      if (oldImage) {
        if (oldImage.dataset.objectUrl) {
          URL.revokeObjectURL(oldImage.dataset.objectUrl);
        }

        oldImage.remove();
      }

      const previewUrl = URL.createObjectURL(blob);

      const image = document.createElement("img");

      image.src = previewUrl;

      image.alt = `${cropperRole} image`;

      image.dataset.objectUrl = previewUrl;

      preview.appendChild(image);

      cropperUploadBox.classList.add("has-image");

      /*
          Replace the input file
          with the cropped image.
        */

      try {
        const dataTransfer = new DataTransfer();

        const fileName = `${cropperRole}.png`;

        const croppedFile = new File([blob], fileName, {
          type: "image/png",
        });

        dataTransfer.items.add(croppedFile);

        cropperInput.files = dataTransfer.files;
      } catch (error) {
        console.warn("Could not replace input file:", error);
      }

      closeCropper();
    }, "image/png");
  }

  /* =====================================================
     CLOSE CROPPER
  ===================================================== */

  function closeCropper() {
    if (!cropperModal) {
      return;
    }

    cropperModal.classList.remove("visible");

    cropperModal.setAttribute("aria-hidden", "true");

    document.body.classList.remove("cropper-open");

    if (objectUrl && objectUrl.startsWith("blob:")) {
      URL.revokeObjectURL(objectUrl);
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

  /* =====================================================
     CASE FORMAT
  ===================================================== */

  function updateCaseFormat() {
    const selected = getSelectedCaseFormat();

    customCaseSettings?.classList.toggle("visible", selected === "custom");

    updateUploadPreviewGeometry();

    if (cropperModal?.classList.contains("visible")) {
      updateCropperMask();

      clampOffsets();

      drawCropper();
    }
  }

  caseFormatInputs.forEach((input) => {
    input.addEventListener("change", updateCaseFormat);
  });

  customWidth?.addEventListener("input", () => {
    updateUploadPreviewGeometry();

    if (cropperModal?.classList.contains("visible")) {
      updateCropperMask();

      clampOffsets();

      drawCropper();
    }
  });

  customHeight?.addEventListener("input", () => {
    updateUploadPreviewGeometry();

    if (cropperModal?.classList.contains("visible")) {
      updateCropperMask();

      clampOffsets();

      drawCropper();
    }
  });

  /* =====================================================
     IMAGE INPUTS
  ===================================================== */

  const imageInputs = document.querySelectorAll(
    '.image-upload input[type="file"]',
  );

  imageInputs.forEach((input) => {
    input.addEventListener("change", (event) => {
      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      if (!file.type.startsWith("image/")) {
        return;
      }

      const uploadBox = input.closest(".image-upload");

      if (!uploadBox) {
        return;
      }

      openCropper(file, input, uploadBox);
    });
  });

  document.querySelectorAll(".image-upload").forEach((upload) => {
    const input = upload.querySelector('input[type="file"]');
    const removeButton = upload.querySelector(".image-remove-button");

    if (!input || !removeButton) return;

    input.addEventListener("change", () => {
      removeButton.style.display = input.files.length ? "inline-flex" : "none";
    });

    removeButton.addEventListener("click", () => {
      input.value = "";

      const preview = upload.querySelector(".image-upload-preview");
      if (preview) {
        preview.innerHTML = "";
        preview.classList.remove("has-image");
      }

      removeButton.style.display = "none";
    });
  });

  /* =====================================================
     ZOOM
  ===================================================== */

  cropperZoom?.addEventListener("input", () => {
    cropperZoomValue = parseFloat(cropperZoom.value) || 1;

    clampOffsets();

    drawCropper();
  });

  cropperZoomOut?.addEventListener("click", () => {
    cropperZoomValue = Math.max(0.35, cropperZoomValue - 0.1);

    if (cropperZoom) {
      cropperZoom.value = cropperZoomValue;
    }

    clampOffsets();

    drawCropper();
  });

  cropperZoomIn?.addEventListener("click", () => {
    cropperZoomValue = Math.min(3, cropperZoomValue + 0.1);

    if (cropperZoom) {
      cropperZoom.value = cropperZoomValue;
    }

    clampOffsets();

    drawCropper();
  });

  /* =====================================================
     DRAGGING
  ===================================================== */

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

  /* =====================================================
     BUTTONS
  ===================================================== */

  cropperClose?.addEventListener("click", closeCropper);

  cropperCancel?.addEventListener("click", closeCropper);

  cropperApply?.addEventListener("click", applyCrop);

  /* =====================================================
     BACKDROP
  ===================================================== */

  cropperModal?.addEventListener("click", (event) => {
    if (event.target === cropperModal) {
      closeCropper();
    }
  });

  /* =====================================================
     ESCAPE
  ===================================================== */

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && cropperModal?.classList.contains("visible")) {
      closeCropper();
    }
  });

  /* =====================================================
     RESIZE
  ===================================================== */

  window.addEventListener("resize", () => {
    updateUploadPreviewGeometry();

    if (!cropperModal?.classList.contains("visible")) {
      return;
    }

    updateCropperMask();

    setupCropperCanvas();

    clampOffsets();

    drawCropper();
  });

  /* =====================================================
     SAVE
  ===================================================== */

  const saveGame = document.getElementById("save-game");

  saveGame?.addEventListener("click", (event) => {
    event.preventDefault();

    console.log("Game data ready for Supabase integration.");
  });

  /* =====================================================
     INITIAL STATE
  ===================================================== */

  updateProfitLoss();

  updateMediaType();

  updateCaseFormat();

  /*
    Run once more after layout has
    settled so the side preview gets
    its actual calculated height.
  */

  requestAnimationFrame(() => {
    updateUploadPreviewGeometry();
  });
});
