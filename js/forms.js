document.addEventListener("DOMContentLoaded", () => {
  /* =====================================================
     ELEMENTS
  ===================================================== */

  const form = document.getElementById("add-game-form");
  const saveGameButton = document.getElementById("save-game");
  const supabaseClient = window.shelfmarkSupabase;

  const gameTitleInput = document.getElementById("game-title");
  const platformInput = document.getElementById("platform");
  const releaseYearInput = document.getElementById("release-year");
  const genreInput = document.getElementById("genre");
  const regionInput = document.getElementById("region");
  const countryInput = document.getElementById("country");
  const typeInput = document.getElementById("game-type");
  const editionInput = document.getElementById("edition");
  const developerInput = document.getElementById("developer");
  const publisherInput = document.getElementById("publisher");

  const mediaTypeInputs = document.querySelectorAll('input[name="mediaType"]');
  const mediaSelector = document.querySelector(".format-selector");

  const caseFormatInputs = document.querySelectorAll(
    'input[name="caseFormat"]',
  );
  const caseFormatSelector = document.querySelector(".case-format-selector");
  const customCaseSettings = document.getElementById("custom-case-settings");
  const customWidth = document.getElementById("custom-width");
  const customHeight = document.getElementById("custom-height");

  const conditionInput = document.getElementById("condition");
  const completenessInput = document.getElementById("completeness");
  const discCountField = document.getElementById("disc-count-field");
  const discCountInput = document.getElementById("disc-count");

  const purchaseDateInput = document.getElementById("purchase-date");
  const purchasePriceInput = document.getElementById("purchase-price");
  const estimatedValueInput = document.getElementById("estimated-value");
  const estimatedValuePrefix = estimatedValueInput
    ?.closest(".input-with-prefix")
    ?.querySelector("span");
  const valueStatus = document.getElementById("value-status");
  const profitLoss = document.getElementById("profit-loss");
  const notesInput = document.getElementById("notes");

  const discUploadGroup = document.getElementById("disc-upload-group");
  const cartridgeUpload = document.getElementById("cartridge-upload");
  const mediaPhotoStatus = document.getElementById("media-photo-status");
  const mediaUploadEmpty = document.getElementById("media-upload-empty");

  let formSaveMessage = document.getElementById("form-save-message");

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
    custom: {
      cover: 1 / 1.4,
      side: (1 / 1.4) * (14 / 135),
      manual: 1 / 1.4,
    },
  };

  const PLATFORM_DEFAULTS = {
    PlayStation: { mediaType: "disc", caseFormat: "ps1" },
    "PlayStation 2": { mediaType: "disc", caseFormat: "dvd" },
    "PlayStation 3": { mediaType: "disc", caseFormat: "blu-ray" },
    "PlayStation 4": { mediaType: "disc", caseFormat: "blu-ray" },
    "PlayStation 5": { mediaType: "disc", caseFormat: "blu-ray" },

    Xbox: { mediaType: "disc", caseFormat: "dvd" },
    "Xbox 360": { mediaType: "disc", caseFormat: "dvd" },
    "Xbox One": { mediaType: "disc", caseFormat: "blu-ray" },
    "Xbox Series X/S": { mediaType: "disc", caseFormat: "blu-ray" },

    "Nintendo Entertainment System": {
      mediaType: "cartridge",
      caseFormat: "",
    },
    "Super Nintendo": { mediaType: "cartridge", caseFormat: "" },
    "Nintendo 64": { mediaType: "cartridge", caseFormat: "" },
    GameCube: { mediaType: "disc", caseFormat: "gamecube" },
    Wii: { mediaType: "disc", caseFormat: "dvd" },
    "Wii U": { mediaType: "disc", caseFormat: "dvd" },
    Switch: { mediaType: "cartridge", caseFormat: "switch" },

    "Game Boy": { mediaType: "cartridge", caseFormat: "" },
    "Game Boy Color": { mediaType: "cartridge", caseFormat: "" },
    "Game Boy Advance": { mediaType: "cartridge", caseFormat: "" },
    "Nintendo DS": { mediaType: "cartridge", caseFormat: "ds" },
    "Nintendo 3DS": { mediaType: "cartridge", caseFormat: "ds" },

    PSP: { mediaType: "disc", caseFormat: "psp" },
    "PS Vita": { mediaType: "cartridge", caseFormat: "vita" },

    PC: { mediaType: "disc", caseFormat: "" },
    Other: { mediaType: "", caseFormat: "" },
  };

  const COMMON_COMPLETENESS_OPTIONS = [
    "Complete",
    "Complete — No Manual",
    "Missing Manual",
    "Manual Only",
    "Missing Inserts",
    "Missing Case",
    "Box Only",
    "Incomplete",
    "Loose",
    "Other",
  ];

  const DISC_COMPLETENESS_OPTIONS = ["Missing Disc", "Disc Only"];
  const CARTRIDGE_COMPLETENESS_OPTIONS = [
    "Missing Cartridge",
    "Cartridge Only",
  ];

  const COUNTRIES_BY_REGION = {
    europe: [
      "Portugal",
      "Spain",
      "France",
      "United Kingdom",
      "Germany",
      "Italy",
      "Netherlands",
      "Belgium",
      "Switzerland",
      "Austria",
      "Ireland",
      "Poland",
      "Czech Republic",
      "Denmark",
      "Sweden",
      "Norway",
      "Finland",
      "Greece",
      "Other",
    ],
    north_america: ["United States", "Canada", "Mexico", "Other"],
    japan: ["Japan"],
    asia: [
      "Japan",
      "South Korea",
      "China",
      "Taiwan",
      "Hong Kong",
      "Singapore",
      "Other",
    ],
    australia: ["Australia"],
    other: ["Other"],
  };

  /* =====================================================
     CROPPER / IMAGE STATE
  ===================================================== */

  let cropperInput = null;
  let cropperUploadBox = null;
  let cropperImage = null;
  let cropperRole = "front";
  let cropperZoomValue = 0.75;
  let cropperOffsetX = 0;
  let cropperOffsetY = 0;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOriginX = 0;
  let dragOriginY = 0;
  let isDragging = false;
  let objectUrl = null;

  const imageState = new WeakMap();

  /* =====================================================
     GENERAL HELPERS
  ===================================================== */

  function optionalString(value) {
    const result = String(value ?? "").trim();
    return result || null;
  }

  function optionalNumber(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function optionalInteger(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    const number = Number(value);
    return Number.isInteger(number) ? number : null;
  }

  function getSelectedMediaType() {
    return (
      document.querySelector('input[name="mediaType"]:checked')?.value || ""
    );
  }

  function getSelectedCaseFormat() {
    const value =
      document.querySelector('input[name="caseFormat"]:checked')?.value || "";

    const aliases = {
      standard: "dvd",
      "ps3-ps4-ps5": "blu-ray",
      "ps1-jewel": "ps1",
      "nintendo-ds": "ds",
      "3ds": "ds",
    };

    return aliases[value] || value;
  }

  function setRadioGroupValue(name, value) {
    document.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
      input.checked = Boolean(value) && input.value === value;
    });
  }

  function getValidDiscCount() {
    const count = Number(discCountInput?.value);

    if (!Number.isInteger(count) || count < 1 || count > 20) {
      return null;
    }

    return count;
  }

  /* =====================================================
     ESTIMATED VALUE / PROFIT LOSS
  ===================================================== */

  function setEstimatedValueField(value) {
    if (!estimatedValueInput) {
      return;
    }

    if (estimatedValueInput.type !== "text") {
      estimatedValueInput.type = "text";
    }

    estimatedValueInput.value = value;

    if (estimatedValuePrefix) {
      estimatedValuePrefix.hidden = value === "" || value === "N/D";
    }
  }

  function updateProfitLoss() {
    if (!purchasePriceInput || !estimatedValueInput || !profitLoss) {
      return;
    }

    if (
      estimatedValueInput.value === "N/D" ||
      estimatedValueInput.value.trim() === ""
    ) {
      profitLoss.textContent = "N/D";
      profitLoss.classList.remove("positive", "negative");
      return;
    }

    const purchasePrice = parseFloat(purchasePriceInput.value);
    const estimatedValue = parseFloat(estimatedValueInput.value);

    if (Number.isNaN(purchasePrice) || Number.isNaN(estimatedValue)) {
      profitLoss.textContent = "N/D";
      profitLoss.classList.remove("positive", "negative");
      return;
    }

    const difference = estimatedValue - purchasePrice;
    const sign = difference >= 0 ? "+" : "-";

    profitLoss.textContent = `${sign}€${Math.abs(difference).toFixed(2)}`;
    profitLoss.classList.remove("positive", "negative");

    if (difference > 0) {
      profitLoss.classList.add("positive");
    } else if (difference < 0) {
      profitLoss.classList.add("negative");
    }
  }

  purchasePriceInput?.addEventListener("input", updateProfitLoss);

  /* =====================================================
     PLATFORM DEFAULTS
  ===================================================== */

  function applyPlatformDefaults() {
    const platform = platformInput?.value || "";
    const preset = PLATFORM_DEFAULTS[platform];

    if (!preset) {
      return;
    }

    const previousMedia = getSelectedMediaType();

    setRadioGroupValue("mediaType", preset.mediaType);
    setRadioGroupValue("caseFormat", preset.caseFormat);

    if (
      preset.mediaType === "disc" &&
      previousMedia !== "disc" &&
      discCountInput
    ) {
      discCountInput.value = "1";
    }

    updateMediaType();
    updateCaseFormat();
  }

  platformInput?.addEventListener("change", applyPlatformDefaults);

  /* =====================================================
     COMPLETENESS
  ===================================================== */

  function getCompletenessOptions(mediaType) {
    if (mediaType === "disc") {
      return [
        ...COMMON_COMPLETENESS_OPTIONS.slice(0, 4),
        ...DISC_COMPLETENESS_OPTIONS,
        ...COMMON_COMPLETENESS_OPTIONS.slice(4),
      ];
    }

    if (mediaType === "cartridge") {
      return [
        ...COMMON_COMPLETENESS_OPTIONS.slice(0, 4),
        ...CARTRIDGE_COMPLETENESS_OPTIONS,
        ...COMMON_COMPLETENESS_OPTIONS.slice(4),
      ];
    }

    return [];
  }

  function updateCompletenessOptions() {
    if (!completenessInput) {
      return;
    }

    const mediaType = getSelectedMediaType();
    const previousValue = completenessInput.value;
    const options = getCompletenessOptions(mediaType);

    completenessInput.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = mediaType
      ? "Select completeness"
      : "Select media first";

    completenessInput.appendChild(placeholder);

    if (!mediaType) {
      completenessInput.disabled = true;
      completenessInput.value = "";
      return;
    }

    options.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      completenessInput.appendChild(option);
    });

    completenessInput.disabled = false;

    if (options.includes(previousValue)) {
      completenessInput.value = previousValue;
    } else {
      completenessInput.value = "";
    }
  }

  /* =====================================================
     CASE FORMAT / PREVIEW GEOMETRY
  ===================================================== */

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
    const format = getSelectedCaseFormat() || "dvd";

    if (format === "custom") {
      const coverRatio = getCustomRatio();

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
      return { ratio: definition.side };
    }

    if (role === "manual") {
      return { ratio: definition.manual };
    }

    return { ratio: definition.cover };
  }

  function updateUploadPreviewGeometry() {
    const uploadBoxes = document.querySelectorAll(
      ".image-upload[data-image-role]",
    );

    let coverHeight = 0;

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

      if (role === "disc") {
        preview.classList.add("preview-disc");
        return;
      }

      if (role === "cartridge") {
        preview.classList.add("preview-cartridge");
        return;
      }

      if (role === "side") {
        const geometry = getCaseGeometry("side");
        const sideWidth = coverHeight * geometry.ratio;

        preview.classList.add("preview-side");
        preview.style.setProperty("--side-preview-height", `${coverHeight}px`);
        preview.style.setProperty("--side-preview-width", `${sideWidth}px`);
        return;
      }

      preview.style.aspectRatio = getCaseGeometry(role).ratio;
    });
  }

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
    input.addEventListener("change", () => {
      caseFormatSelector?.classList.remove("is-invalid");
      updateCaseFormat();
    });
  });

  customWidth?.addEventListener("input", () => {
    updateCaseFormat();
  });

  customHeight?.addEventListener("input", () => {
    updateCaseFormat();
  });

  /* =====================================================
     IMAGE PREVIEW HELPERS
  ===================================================== */

  function updateRemoveButton(uploadBox) {
    const input = uploadBox?.querySelector('input[type="file"]');
    const removeButton = uploadBox?.querySelector(".image-remove-button");

    if (!input || !removeButton) {
      return;
    }

    const state = imageState.get(uploadBox);
    const hasImage = Boolean(state?.hasImage && input.files?.length);

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

  function resetPreview(uploadBox) {
    if (!uploadBox) {
      return;
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

    if (cropperUploadBox === uploadBox) {
      closeCropper();
    }

    resetPreview(uploadBox);
    uploadBox.remove();
  }

  /* =====================================================
     DYNAMIC DISC IMAGE SLOTS
  ===================================================== */

  function createDiscUploadBox(discNumber) {
    const uploadBox = document.createElement("div");

    uploadBox.className = "image-upload disc-upload-item";
    uploadBox.dataset.imageRole = "disc";
    uploadBox.dataset.discNumber = String(discNumber);

    const inputId = `image-disc-${discNumber}`;

    uploadBox.innerHTML = `
      <div class="image-upload-preview">
        <span class="image-upload-placeholder">DISC ${discNumber}</span>
      </div>

      <label for="${inputId}" class="image-upload-button">
        Add image
      </label>

      <input
        type="file"
        id="${inputId}"
        name="imageDisc${discNumber}"
        accept="image/*"
        hidden
      />

      <button
        type="button"
        class="image-remove-button"
        data-remove-image="disc-${discNumber}"
      >
        Remove image
      </button>
    `;

    initializeImageUploadBox(uploadBox);

    return uploadBox;
  }

  function syncDiscUploadSlots() {
    if (!discUploadGroup) {
      return;
    }

    const count = getValidDiscCount();

    if (!count) {
      return;
    }

    discUploadGroup
      .querySelectorAll('.image-upload[data-image-role="disc"]')
      .forEach((uploadBox) => {
        const discNumber = Number(uploadBox.dataset.discNumber);

        if (!Number.isInteger(discNumber) || discNumber > count) {
          disposeUploadBox(uploadBox);
        }
      });

    for (let discNumber = 1; discNumber <= count; discNumber += 1) {
      let uploadBox = discUploadGroup.querySelector(
        `.image-upload[data-disc-number="${discNumber}"]`,
      );

      if (!uploadBox) {
        uploadBox = createDiscUploadBox(discNumber);
      }

      discUploadGroup.appendChild(uploadBox);
    }

    updateUploadPreviewGeometry();
  }

  discCountInput?.addEventListener("input", () => {
    const count = getValidDiscCount();

    if (count) {
      syncDiscUploadSlots();

      if (mediaPhotoStatus && getSelectedMediaType() === "disc") {
        mediaPhotoStatus.textContent = `Disc · ${count} ${
          count === 1 ? "disc" : "discs"
        }`;
      }
    }
  });

  /* =====================================================
     MEDIA TYPE
  ===================================================== */

  function updateMediaType() {
    const selected = getSelectedMediaType();

    discUploadGroup?.classList.toggle("is-hidden", selected !== "disc");

    cartridgeUpload?.classList.toggle("is-hidden", selected !== "cartridge");

    if (discCountField) {
      discCountField.hidden = selected !== "disc";
    }

    /* =================================================
     DISC
  ================================================= */

    if (selected === "disc") {
      if (!getValidDiscCount() && discCountInput) {
        discCountInput.value = "1";
      }

      syncDiscUploadSlots();

      const count = getValidDiscCount() || 1;

      if (mediaPhotoStatus) {
        mediaPhotoStatus.textContent = `Disc · ${count} ${
          count === 1 ? "disc" : "discs"
        }`;
      }

      mediaUploadEmpty?.classList.remove("visible");
    }

    /* =================================================
     CARTRIDGE
  ================================================= */

    if (selected === "cartridge") {
      if (mediaPhotoStatus) {
        mediaPhotoStatus.textContent = "Cartridge";
      }

      mediaUploadEmpty?.classList.remove("visible");
    }

    /* =================================================
     NOTHING SELECTED
  ================================================= */

    if (!selected) {
      if (mediaPhotoStatus) {
        mediaPhotoStatus.textContent = "Select media above";
      }

      mediaUploadEmpty?.classList.add("visible");
    }

    updateCompletenessOptions();

    updateUploadPreviewGeometry();
  }

  mediaTypeInputs.forEach((input) => {
    input.addEventListener("change", () => {
      mediaSelector?.classList.remove("is-invalid");
      updateMediaType();
    });
  });

  /* =====================================================
     IMAGE INPUT INITIALIZATION
  ===================================================== */

  function initializeImageUploadBox(uploadBox) {
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

      if (
        cropperModal?.classList.contains("visible") &&
        cropperUploadBox === uploadBox
      ) {
        closeCropper();
      }

      resetPreview(uploadBox);
    });
  }

  document.querySelectorAll(".image-upload").forEach((uploadBox) => {
    initializeImageUploadBox(uploadBox);
  });

  /* =====================================================
     CROPPER GEOMETRY
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

    const maxWidth = stageWidth * 0.72;
    const maxHeight = stageHeight * 0.82;

    let cropWidth;
    let cropHeight;

    if (cropperRole === "disc") {
      const size = Math.min(maxWidth, maxHeight, 440);
      cropWidth = size;
      cropHeight = size;
      cropperMask.classList.add("disc");
    } else {
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

  function getStageRect() {
    return cropperStage.getBoundingClientRect();
  }

  function getMaskRect() {
    return cropperMask.getBoundingClientRect();
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

  function getBaseScale() {
    if (!cropperImage || !cropperMask) {
      return 1;
    }

    const mask = getMaskRect();
    const widthScale = mask.width / cropperImage.naturalWidth;
    const heightScale = mask.height / cropperImage.naturalHeight;

    return Math.max(widthScale, heightScale) * 1.015;
  }

  function getImageGeometry() {
    const stage = getStageRect();
    const scale = getBaseScale() * cropperZoomValue;
    const width = cropperImage.naturalWidth * scale;
    const height = cropperImage.naturalHeight * scale;

    return {
      scale,
      width,
      height,
      x: stage.width / 2 - width / 2 + cropperOffsetX,
      y: stage.height / 2 - height / 2 + cropperOffsetY,
    };
  }

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
    const scale = getBaseScale() * cropperZoomValue;
    const imageWidth = cropperImage.naturalWidth * scale;
    const imageHeight = cropperImage.naturalHeight * scale;
    const baseX = stage.width / 2 - imageWidth / 2;
    const baseY = stage.height / 2 - imageHeight / 2;

    let minOffsetX = cropRight - (baseX + imageWidth);
    let maxOffsetX = cropLeft - baseX;
    let minOffsetY = cropBottom - (baseY + imageHeight);
    let maxOffsetY = cropTop - baseY;

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
     CROPPER OPEN / CLOSE / APPLY
  ===================================================== */

  function openCropper(file, input, uploadBox) {
    if (!cropperModal || !cropperStage || !cropperCanvas) {
      return;
    }

    cropperInput = input;
    cropperUploadBox = uploadBox;

    const previousState = imageState.get(uploadBox);

    cropperInput._shelfmarkPreviousFiles = previousState?.file
      ? [previousState.file]
      : [];

    cropperRole = uploadBox.dataset.imageRole || "front";

    const discNumber = uploadBox.dataset.discNumber;
    const titleMap = {
      front: "Crop front",
      back: "Crop back",
      side: "Crop side",
      manual: "Crop manual",
      cartridge: "Crop cartridge",
    };

    if (cropperTitle) {
      cropperTitle.textContent =
        cropperRole === "disc"
          ? `Crop disc ${discNumber || ""}`.trim()
          : titleMap[cropperRole] || "Crop image";
    }

    cropperZoomValue = 0.75;
    cropperOffsetX = 0;
    cropperOffsetY = 0;

    if (cropperZoom) {
      cropperZoom.value = "0.75";
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
      restoreCommittedFileToInput(input, uploadBox);
      objectUrl = null;
      cropperImage = null;
      cropperInput = null;
      cropperUploadBox = null;
    };

    image.src = newObjectUrl;
  }

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

    outputCanvas.toBlob((blob) => {
      if (!blob || !cropperUploadBox || !cropperInput) {
        return;
      }

      const preview = cropperUploadBox.querySelector(".image-upload-preview");

      if (!preview) {
        return;
      }

      const oldState = imageState.get(cropperUploadBox);

      if (oldState?.objectUrl?.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(oldState.objectUrl);
        } catch (error) {
          /* Already revoked. */
        }
      }

      preview.querySelector(".cropped-preview-image")?.remove();

      const previewUrl = URL.createObjectURL(blob);
      const discNumber = Number(cropperUploadBox.dataset.discNumber) || null;
      const fileName =
        cropperRole === "disc" && discNumber
          ? `disc-${discNumber}.png`
          : `${cropperRole}.png`;
      const croppedFile = new File([blob], fileName, {
        type: "image/png",
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
      cropperUploadBox.classList.add("has-image");

      const placeholder = preview.querySelector(".image-upload-placeholder");

      if (placeholder) {
        placeholder.style.display = "none";
      }

      imageState.set(cropperUploadBox, {
        hasImage: true,
        objectUrl: previewUrl,
        file: croppedFile,
      });

      try {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(croppedFile);
        cropperInput.files = dataTransfer.files;
      } catch (error) {
        console.warn("Could not replace input file:", error);
      }

      updateRemoveButton(cropperUploadBox);
      closeCropper({ commit: true });
    }, "image/png");
  }

  /* =====================================================
     CROPPER CONTROLS
  ===================================================== */

  cropperZoom?.addEventListener("input", () => {
    cropperZoomValue = parseFloat(cropperZoom.value) || 0.75;
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

    clampOffsets();
    drawCropper();
  });

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

  cropperClose?.addEventListener("click", () => closeCropper());
  cropperCancel?.addEventListener("click", () => closeCropper());
  cropperApply?.addEventListener("click", applyCrop);

  cropperModal?.addEventListener("click", (event) => {
    if (event.target === cropperModal) {
      closeCropper();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && cropperModal?.classList.contains("visible")) {
      closeCropper();
    }
  });

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
     COUNTRY / REGION
  ===================================================== */

  function normalizeRegionValue(value) {
    const aliases = {
      Europe: "europe",
      "North America": "north_america",
      Japan: "japan",
      Asia: "asia",
      Australia: "australia",
      Other: "other",
    };

    return aliases[value] || "";
  }

  function updateCountryOptions() {
    if (!countryInput) {
      return;
    }

    const regionValue = normalizeRegionValue(regionInput?.value);
    const countries = COUNTRIES_BY_REGION[regionValue];
    const previousValue = countryInput.value;

    countryInput.innerHTML = "";

    if (!regionValue || !countries) {
      countryInput.innerHTML = '<option value="">Select region first</option>';
      countryInput.value = "";
      countryInput.disabled = true;
      return;
    }

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select country";
    countryInput.appendChild(placeholder);

    countries.forEach((country) => {
      const option = document.createElement("option");
      option.value = country;
      option.textContent = country;
      countryInput.appendChild(option);
    });

    countryInput.disabled = false;

    if (countries.includes(previousValue)) {
      countryInput.value = previousValue;
    }
  }

  regionInput?.addEventListener("change", updateCountryOptions);

  /* =====================================================
     MARKET VALUE
  ===================================================== */

  const VALUE_ENDPOINT = "/api/game-value";
  let valueLookupTimer = null;
  let valueLookupController = null;

  function setValueStatus(message, state = "") {
    if (!valueStatus) {
      return;
    }

    valueStatus.textContent = message;
    valueStatus.classList.remove("loading", "success", "error");

    if (state) {
      valueStatus.classList.add(state);
    }
  }

  function getGameValuePayload() {
    return {
      name: gameTitleInput?.value.trim() || "",
      platform: platformInput?.value || "",
      edition: editionInput?.value || "",
      condition: conditionInput?.value || "",
      completeness: completenessInput?.value || "",
      region: regionInput?.value || "",
      country: countryInput?.value || "",
      type: typeInput?.value || "",
    };
  }

  function hasEnoughValueData(payload) {
    return Boolean(payload.name && payload.platform);
  }

  async function updateEstimatedValue() {
    const payload = getGameValuePayload();

    if (!hasEnoughValueData(payload)) {
      setEstimatedValueField("");
      updateProfitLoss();
      setValueStatus(
        "Enter the game title and platform to estimate its current market value.",
      );
      return;
    }

    if (valueLookupController) {
      valueLookupController.abort();
    }

    valueLookupController = new AbortController();
    setValueStatus("Checking current market value…", "loading");

    try {
      const response = await fetch(VALUE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: valueLookupController.signal,
      });

      if (response.status === 404) {
        setEstimatedValueField("N/D");
        updateProfitLoss();
        setValueStatus("No current market price could be found for this game.");
        return;
      }

      if (!response.ok) {
        throw new Error(`Market value request failed: ${response.status}`);
      }

      const data = await response.json();
      const rawValue = data?.value;

      if (
        rawValue === null ||
        rawValue === undefined ||
        rawValue === "" ||
        data?.found === false
      ) {
        setEstimatedValueField("N/D");
        updateProfitLoss();
        setValueStatus("No current market price could be found for this game.");
        return;
      }

      const value = Number(rawValue);

      if (!Number.isFinite(value) || value < 0) {
        setEstimatedValueField("N/D");
        updateProfitLoss();
        setValueStatus("No current market price could be found for this game.");
        return;
      }

      setEstimatedValueField(value.toFixed(2));
      updateProfitLoss();
      setValueStatus("Estimated from current market data.", "success");
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }

      console.warn("Market value lookup unavailable:", error);
      setEstimatedValueField("N/D");
      updateProfitLoss();
      setValueStatus("Market value is currently unavailable.", "error");
    }
  }

  function scheduleValueLookup() {
    clearTimeout(valueLookupTimer);

    valueLookupTimer = setTimeout(() => {
      updateEstimatedValue();
    }, 500);
  }

  [
    gameTitleInput,
    platformInput,
    editionInput,
    conditionInput,
    completenessInput,
    regionInput,
    countryInput,
    typeInput,
  ].forEach((input) => {
    input?.addEventListener("input", scheduleValueLookup);
    input?.addEventListener("change", scheduleValueLookup);
  });

  /* =====================================================
     SAVE STATUS / VALIDATION
  ===================================================== */

  if (!formSaveMessage && form) {
    formSaveMessage = document.createElement("p");
    formSaveMessage.id = "form-save-message";
    formSaveMessage.className = "form-save-message";
    formSaveMessage.setAttribute("aria-live", "polite");

    const actions = form.querySelector(".form-actions");

    if (actions) {
      actions.before(formSaveMessage);
    } else {
      form.appendChild(formSaveMessage);
    }
  }

  function setFormSaveMessage(message, type = "") {
    if (!formSaveMessage) {
      return;
    }

    formSaveMessage.textContent = message;
    formSaveMessage.classList.remove("visible", "error", "success", "loading");

    if (!message) {
      return;
    }

    formSaveMessage.classList.add("visible");

    if (type) {
      formSaveMessage.classList.add(type);
    }
  }

  function setSaveLoading(loading, text = "Saving game…") {
    if (!saveGameButton) {
      return;
    }

    if (loading) {
      if (!saveGameButton.dataset.originalText) {
        saveGameButton.dataset.originalText = saveGameButton.textContent.trim();
      }

      saveGameButton.textContent = text;
      saveGameButton.disabled = true;
      return;
    }

    saveGameButton.textContent =
      saveGameButton.dataset.originalText || "Save game";
    saveGameButton.disabled = false;
  }

  function clearFormValidation() {
    form?.querySelectorAll(".is-invalid").forEach((element) => {
      element.classList.remove("is-invalid");
      element.removeAttribute("aria-invalid");
    });
  }

  function markInvalid(element) {
    if (!element) {
      return;
    }

    element.classList.add("is-invalid");
    element.setAttribute("aria-invalid", "true");
  }

  function focusInvalidField(field) {
    if (!field) {
      return;
    }

    markInvalid(field);
    field.focus({ preventScroll: true });
    field.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  function focusInvalidGroup(group) {
    if (!group) {
      return;
    }

    markInvalid(group);
    group.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  function validateGameForm() {
    clearFormValidation();
    setFormSaveMessage("");

    if (!gameTitleInput?.value.trim()) {
      setFormSaveMessage("Enter the game title.", "error");
      focusInvalidField(gameTitleInput);
      return false;
    }

    if (!platformInput?.value) {
      setFormSaveMessage("Select the game's platform.", "error");
      focusInvalidField(platformInput);
      return false;
    }

    if (!typeInput?.value) {
      setFormSaveMessage("Select the game type.", "error");
      focusInvalidField(typeInput);
      return false;
    }

    const mediaType = getSelectedMediaType();

    if (!mediaType) {
      setFormSaveMessage("Select the physical media type.", "error");
      focusInvalidGroup(mediaSelector);
      return false;
    }

    const caseFormat = getSelectedCaseFormat();

    if (!caseFormat) {
      setFormSaveMessage("Select the case format.", "error");
      focusInvalidGroup(caseFormatSelector);
      return false;
    }

    if (!conditionInput?.value) {
      setFormSaveMessage("Select the condition of this copy.", "error");
      focusInvalidField(conditionInput);
      return false;
    }

    if (!completenessInput?.value) {
      setFormSaveMessage("Select the completeness of this copy.", "error");
      focusInvalidField(completenessInput);
      return false;
    }

    if (releaseYearInput?.value !== "") {
      const releaseYear = Number(releaseYearInput.value);

      if (
        !Number.isInteger(releaseYear) ||
        releaseYear < 1970 ||
        releaseYear > 2100
      ) {
        setFormSaveMessage(
          "Enter a valid release year between 1970 and 2100.",
          "error",
        );
        focusInvalidField(releaseYearInput);
        return false;
      }
    }

    if (purchasePriceInput?.value !== "") {
      const purchasePrice = Number(purchasePriceInput.value);

      if (!Number.isFinite(purchasePrice) || purchasePrice < 0) {
        setFormSaveMessage("Enter a valid purchase price.", "error");
        focusInvalidField(purchasePriceInput);
        return false;
      }
    }

    if (mediaType === "disc") {
      const discCount = getValidDiscCount();

      if (!discCount) {
        setFormSaveMessage(
          "Enter a valid number of discs between 1 and 20.",
          "error",
        );
        focusInvalidField(discCountInput);
        return false;
      }
    }

    if (caseFormat === "custom") {
      const width = Number(customWidth?.value);
      const height = Number(customHeight?.value);

      if (!Number.isFinite(width) || width <= 0) {
        setFormSaveMessage("Enter a valid custom case width.", "error");
        focusInvalidField(customWidth);
        return false;
      }

      if (!Number.isFinite(height) || height <= 0) {
        setFormSaveMessage("Enter a valid custom case height.", "error");
        focusInvalidField(customHeight);
        return false;
      }
    }

    return true;
  }

  form?.querySelectorAll("input, select, textarea").forEach((field) => {
    const clearInvalidState = () => {
      field.classList.remove("is-invalid");
      field.removeAttribute("aria-invalid");
    };

    field.addEventListener("input", clearInvalidState);
    field.addEventListener("change", clearInvalidState);
  });

  /* =====================================================
     DATABASE PAYLOAD
  ===================================================== */

  function getGameFormData(userId) {
    const mediaType = getSelectedMediaType();
    const caseFormat = getSelectedCaseFormat();
    const estimatedValueRaw = estimatedValueInput?.value.trim() || "";

    return {
      collectionItem: {
        user_id: userId,
        category: "game",
        title: gameTitleInput?.value.trim() || "",
        condition: optionalString(conditionInput?.value),
        completeness: optionalString(completenessInput?.value),
        region: optionalString(regionInput?.value),
        country: optionalString(countryInput?.value),
        purchase_date: optionalString(purchaseDateInput?.value),
        purchase_price: optionalNumber(purchasePriceInput?.value),
        estimated_value:
          estimatedValueRaw && estimatedValueRaw !== "N/D"
            ? optionalNumber(estimatedValueRaw)
            : null,
        notes: optionalString(notesInput?.value),
      },

      game: {
        platform: platformInput?.value || "",
        release_year: optionalInteger(releaseYearInput?.value),
        genre: optionalString(genreInput?.value),
        game_type: optionalString(typeInput?.value),
        edition: optionalString(editionInput?.value),
        developer: optionalString(developerInput?.value),
        publisher: optionalString(publisherInput?.value),
        media_type: mediaType,
        case_format: caseFormat,
        custom_case_width:
          caseFormat === "custom" ? optionalNumber(customWidth?.value) : null,
        custom_case_height:
          caseFormat === "custom" ? optionalNumber(customHeight?.value) : null,
        disc_count:
          mediaType === "disc" ? optionalInteger(discCountInput?.value) : null,
      },

      mediaType,
    };
  }

  /* =====================================================
     IMAGE COLLECTION FOR SAVE
  ===================================================== */

  function getFileExtension(file) {
    const type = file?.type?.toLowerCase();

    if (type === "image/png") {
      return "png";
    }

    if (type === "image/jpeg" || type === "image/jpg") {
      return "jpg";
    }

    if (type === "image/webp") {
      return "webp";
    }

    return "png";
  }

  function getImageSortOrder(role, discNumber) {
    if (role === "front") {
      return 0;
    }

    if (role === "disc") {
      return 10 + (discNumber || 0);
    }

    if (role === "cartridge") {
      return 10;
    }

    if (role === "back") {
      return 100;
    }

    if (role === "side") {
      return 110;
    }

    if (role === "manual") {
      return 120;
    }

    return 999;
  }

  function getSelectedImages(mediaType) {
    return Array.from(
      document.querySelectorAll(".image-upload[data-image-role]"),
    )
      .map((uploadBox) => {
        const role = uploadBox.dataset.imageRole;
        const discNumber =
          role === "disc" ? Number(uploadBox.dataset.discNumber) || null : null;
        const input = uploadBox.querySelector('input[type="file"]');
        const file = input?.files?.[0] || null;

        return {
          role,
          discNumber,
          file,
          sortOrder: getImageSortOrder(role, discNumber),
        };
      })
      .filter((image) => {
        if (!image.file) {
          return false;
        }

        if (image.role === "disc" && mediaType !== "disc") {
          return false;
        }

        if (image.role === "cartridge" && mediaType !== "cartridge") {
          return false;
        }

        return true;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /* =====================================================
     SUPABASE ROLLBACK / SAVE
  ===================================================== */

  async function rollbackGameSave(itemId, uploadedPaths) {
    if (!supabaseClient) {
      return;
    }

    if (uploadedPaths.length > 0) {
      const { error: storageError } = await supabaseClient.storage
        .from("item-images")
        .remove(uploadedPaths);

      if (storageError) {
        console.warn(
          "Shelfmark rollback: Some uploaded images could not be removed:",
          storageError,
        );
      }
    }

    if (itemId) {
      const { error: itemError } = await supabaseClient
        .from("collection_items")
        .delete()
        .eq("id", itemId);

      if (itemError) {
        console.warn(
          "Shelfmark rollback: Partial collection item could not be removed:",
          itemError,
        );
      }
    }
  }

  async function saveGame() {
    if (!supabaseClient) {
      throw new Error("Supabase is not connected.");
    }

    setFormSaveMessage("Checking your account…", "loading");

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error("You must be logged in to save a game.");
    }

    const { collectionItem, game, mediaType } = getGameFormData(user.id);
    let createdItemId = null;
    const uploadedPaths = [];

    try {
      setFormSaveMessage("Saving game information…", "loading");

      const { data: createdItem, error: itemError } = await supabaseClient
        .from("collection_items")
        .insert(collectionItem)
        .select("id")
        .single();

      if (itemError) {
        throw itemError;
      }

      if (!createdItem?.id) {
        throw new Error("Supabase did not return the new game ID.");
      }

      createdItemId = createdItem.id;

      const { error: gameError } = await supabaseClient.from("games").insert({
        item_id: createdItemId,
        ...game,
      });

      if (gameError) {
        throw gameError;
      }

      const selectedImages = getSelectedImages(mediaType);
      const imageRows = [];

      for (let index = 0; index < selectedImages.length; index += 1) {
        const image = selectedImages[index];

        setFormSaveMessage(
          `Uploading image ${index + 1} of ${selectedImages.length}…`,
          "loading",
        );

        const extension = getFileExtension(image.file);
        const filename =
          image.role === "disc"
            ? `disc-${image.discNumber}.${extension}`
            : `${image.role}.${extension}`;
        const storagePath = `${user.id}/${createdItemId}/${filename}`;

        const { error: uploadError } = await supabaseClient.storage
          .from("item-images")
          .upload(storagePath, image.file, {
            cacheControl: "3600",
            contentType: image.file.type || "image/png",
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        uploadedPaths.push(storagePath);

        imageRows.push({
          item_id: createdItemId,
          image_type: image.role,
          storage_path: storagePath,
          disc_number: image.role === "disc" ? image.discNumber : null,
          sort_order: image.sortOrder,
        });
      }

      if (imageRows.length > 0) {
        setFormSaveMessage("Saving image records…", "loading");

        const { error: imageRowsError } = await supabaseClient
          .from("item_images")
          .insert(imageRows);

        if (imageRowsError) {
          throw imageRowsError;
        }
      }

      setFormSaveMessage("Game saved successfully.", "success");
      return createdItemId;
    } catch (error) {
      await rollbackGameSave(createdItemId, uploadedPaths);
      throw error;
    }
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (saveGameButton?.disabled || !validateGameForm()) {
      return;
    }

    setSaveLoading(true, "Saving game…");
    setFormSaveMessage("Saving game…", "loading");

    try {
      const itemId = await saveGame();

      window.location.href = `game.html?id=${encodeURIComponent(itemId)}`;
    } catch (error) {
      console.error("Shelfmark save game error:", error);

      const message =
        error?.message === "You must be logged in to save a game."
          ? "Your session has expired. Log in again before saving the game."
          : "The game could not be saved. Please try again.";

      setFormSaveMessage(message, "error");
      setSaveLoading(false);
    }
  });

  /* =====================================================
     INITIAL STATE
  ===================================================== */

  setEstimatedValueField(estimatedValueInput?.value || "");
  updateProfitLoss();
  updateCountryOptions();
  updateCompletenessOptions();
  updateMediaType();
  updateCaseFormat();

  setValueStatus(
    "Enter the game title and platform to estimate its current market value.",
  );

  requestAnimationFrame(() => {
    updateUploadPreviewGeometry();
  });
});
