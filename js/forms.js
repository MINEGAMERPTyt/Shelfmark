document.addEventListener("DOMContentLoaded", () => {
  /* =====================================================
     ELEMENTS
  ===================================================== */

  const form = document.getElementById("add-game-form");
  const saveGameButton = document.getElementById("save-game");
  const supabaseClient = window.shelfmarkSupabase;

  const formatLibrary = window.ShelfmarkFormats;
  const imageCropperLibrary = window.ShelfmarkImageCropper;

  if (!formatLibrary) {
    throw new Error(
      "Shelfmark format library is missing. Make sure js/formats.js loads before forms.js.",
    );
  }

  if (!imageCropperLibrary) {
    throw new Error(
      "Shelfmark image cropper is missing. Make sure js/image-cropper.js loads before forms.js.",
    );
  }

  const { CASE_FORMATS, MEDIA_FORMATS, PLATFORM_DEFAULTS } = formatLibrary;

  let imageCropper = null;

  const formHeading = document.querySelector(".form-header h1");

  const formIntro = document.querySelector(".form-intro");

  const formEyebrow = document.querySelector(".form-eyebrow");

  const cancelButton = document.querySelector(".form-button-secondary");

  const urlParams = new URLSearchParams(window.location.search);

  const editItemId = urlParams.get("edit");

  const wishlistSourceId = urlParams.get("wishlist");

  const isEditMode = Boolean(editItemId);

  const isWishlistImportMode = Boolean(wishlistSourceId) && !isEditMode;

  let sourceWishlistItem = null;

  let editOriginalItem = null;
  let editOriginalGame = null;
  let editOriginalImages = [];

  const gameTitleInput = document.getElementById("game-title");
  const platformInput = document.getElementById("platform");
  const releaseYearInput = document.getElementById("release-year");
  const genreInput = document.getElementById("genre");
  const regionInput = document.getElementById("region");
  const countryInput = document.getElementById("country");
  const typeInput = document.getElementById("game-type");
  const editionInput = document.getElementById("edition");
  const customEditionField = document.getElementById("custom-edition-field");
  const customEditionInput = document.getElementById("custom-edition");
  const developerInput = document.getElementById("developer");
  const publisherInput = document.getElementById("publisher");

  const mediaTypeInputs = document.querySelectorAll('input[name="mediaType"]');
  const mediaSelector = document.querySelector(".format-selector");

  const mediaFormatSettings = document.getElementById("media-format-settings");

  const mediaFormatInput = document.getElementById("media-format");

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

  const valueSourceInput = document.getElementById("value-source");

  const valueCheckedPreview = document.getElementById("value-checked-preview");

  const marketResearchLinks = document.querySelectorAll(
    ".market-research-link",
  );

  const profitLoss = document.getElementById("profit-loss");

  let valuationDirty = false;
  let pendingValueCheckedAt = null;
  const notesInput = document.getElementById("notes");

  const discUploadGroup = document.getElementById("disc-upload-group");
  const cartridgeUpload = document.getElementById("cartridge-upload");
  const mediaPhotoStatus = document.getElementById("media-photo-status");
  const mediaUploadEmpty = document.getElementById("media-upload-empty");

  let formSaveMessage = document.getElementById("form-save-message");

  /* =====================================================
     CASE FORMAT DEFINITIONS
  ===================================================== */

  const COMMON_COMPLETENESS_OPTIONS = [
    "Complete",
    "Complete — No Manual",
    "Manual Only",
    "Missing Inserts",
    "Missing Case",
    "Box Only",
    "Incomplete",
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
     GENERAL HELPERS
  ===================================================== */

  function optionalString(value) {
    const result = String(value ?? "").trim();
    return result || null;
  }

  const editionPresetValues = new Set(
    Array.from(editionInput?.options || [])
      .map((option) => option.value)
      .filter((value) => value && value !== "Other"),
  );

  function getEditionValue() {
    if (editionInput?.value === "Other") {
      return optionalString(customEditionInput?.value);
    }

    return optionalString(editionInput?.value);
  }

  function updateCustomEditionField() {
    const isCustomEdition = editionInput?.value === "Other";

    if (customEditionField) {
      customEditionField.hidden = !isCustomEdition;
    }

    if (customEditionInput) {
      customEditionInput.required = isCustomEdition;

      if (!isCustomEdition) {
        customEditionInput.classList.remove("is-invalid");
        customEditionInput.removeAttribute("aria-invalid");
      }
    }
  }

  function setEditionValue(value) {
    if (!editionInput) {
      return;
    }

    const savedEdition = optionalString(value) || "";

    if (!savedEdition) {
      editionInput.value = "";

      if (customEditionInput) {
        customEditionInput.value = "";
      }
    } else if (editionPresetValues.has(savedEdition)) {
      editionInput.value = savedEdition;

      if (customEditionInput) {
        customEditionInput.value = "";
      }
    } else {
      editionInput.value = "Other";

      if (customEditionInput) {
        customEditionInput.value = savedEdition;
      }
    }

    updateCustomEditionField();
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

  function getSelectedMediaFormat() {
    return mediaFormatInput?.value || "";
  }

  function getSelectedCaseFormat() {
    const value =
      document.querySelector('input[name="caseFormat"]:checked')?.value || "";

    return formatLibrary.normalizeCaseFormat(value);
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
   MANUAL VALUE / PROFIT LOSS
===================================================== */

  function setEstimatedValueField(value) {
    if (!estimatedValueInput) {
      return;
    }

    estimatedValueInput.value = value ?? "";

    if (estimatedValuePrefix) {
      estimatedValuePrefix.hidden = estimatedValueInput.value === "";
    }
  }

  function formatValueCheckedAt(value) {
    if (!value) {
      return "Not checked yet";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not checked yet";
    }

    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function setValueCheckedPreview(value) {
    if (!valueCheckedPreview) {
      return;
    }

    valueCheckedPreview.textContent = formatValueCheckedAt(value);
  }

  function setValueStatus(message, state = "") {
    if (!valueStatus) {
      return;
    }

    valueStatus.textContent = message;

    valueStatus.classList.remove("success", "error");

    if (state) {
      valueStatus.classList.add(state);
    }
  }

  function markValuationChanged() {
    valuationDirty = true;

    const rawValue = estimatedValueInput?.value.trim() || "";

    if (!rawValue) {
      pendingValueCheckedAt = null;

      setValueCheckedPreview(null);

      if (valueSourceInput) {
        valueSourceInput.value = "";
      }

      setValueStatus(
        "Research the market below, then enter the value you consider appropriate for this copy.",
      );

      return;
    }

    pendingValueCheckedAt = new Date().toISOString();

    setValueCheckedPreview(pendingValueCheckedAt);

    setValueStatus(
      "Manual estimate ready to save. Choose the source you used.",
      "success",
    );
  }

  function updateProfitLoss() {
    if (!purchasePriceInput || !estimatedValueInput || !profitLoss) {
      return;
    }

    if (estimatedValueInput.value.trim() === "") {
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

  estimatedValueInput?.addEventListener("input", () => {
    markValuationChanged();
    updateProfitLoss();
  });

  valueSourceInput?.addEventListener("change", () => {
    if (estimatedValueInput?.value.trim()) {
      markValuationChanged();
    }
  });

  /* =====================================================
   MEDIA FORMAT
===================================================== */

  function getAvailableMediaFormats(mediaType) {
    return Object.entries(MEDIA_FORMATS).filter(
      ([, definition]) => definition.mediaType === mediaType,
    );
  }

  function populateMediaFormatOptions(preferredValue = "") {
    if (!mediaFormatInput || !mediaFormatSettings) {
      return;
    }

    const mediaType = getSelectedMediaType();

    const previousValue = mediaFormatInput.value;

    mediaFormatInput.innerHTML = "";

    if (!mediaType) {
      mediaFormatSettings.hidden = true;

      const option = document.createElement("option");

      option.value = "";
      option.textContent = "Select media type first";

      mediaFormatInput.appendChild(option);

      return;
    }

    mediaFormatSettings.hidden = false;

    const formats = getAvailableMediaFormats(mediaType);

    formats.forEach(([value, definition]) => {
      const option = document.createElement("option");

      option.value = value;
      option.textContent = definition.label;

      mediaFormatInput.appendChild(option);
    });

    const inferredValue = formatLibrary.inferMediaFormat({
      platform: platformInput?.value || "",
      mediaType,
      region: regionInput?.value || "",
    });

    const availableValues = new Set(formats.map(([value]) => value));

    const selectedValue =
      [preferredValue, previousValue, inferredValue].find(
        (value) => value && availableValues.has(value),
      ) ||
      formats[0]?.[0] ||
      "";

    mediaFormatInput.value = selectedValue;
  }

  function updateMediaFormat() {
    updateUploadPreviewGeometry();
    imageCropper?.refreshCropper();
  }

  mediaFormatInput?.addEventListener("change", () => {
    mediaFormatInput.classList.remove("is-invalid");
    mediaFormatInput.removeAttribute("aria-invalid");

    updateMediaFormat();
  });

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

    const mediaFormat = formatLibrary.inferMediaFormat({
      platform,
      mediaType: preset.mediaType,
      region: regionInput?.value || "",
    });

    updateMediaType(mediaFormat);

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

  /*
    Older Shelfmark versions allowed the broad "Loose" value.
    New entries use the more precise Disc Only / Cartridge Only
    options instead, but an existing legacy value must remain
    editable without being silently erased.
  */
  function ensureLegacyCompletenessOption(value) {
    if (!completenessInput || !value) {
      return;
    }

    const alreadyAvailable = Array.from(completenessInput.options).some(
      (option) => option.value === value,
    );

    if (alreadyAvailable) {
      return;
    }

    const option = document.createElement("option");
    option.value = value;
    option.textContent = `${value} (legacy)`;
    option.dataset.legacy = "true";

    completenessInput.appendChild(option);
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
    const caseFormat = getSelectedCaseFormat() || "dvd";

    let geometryRole = role;

    if (role === "front" || role === "back") {
      geometryRole = "cover";
    }

    const ratio = formatLibrary.getCaseRatio({
      caseFormat,
      role: geometryRole,

      customWidth: customWidth?.value,

      customHeight: customHeight?.value,
    });

    return {
      ratio,
    };
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
        "preview-media",
        "preview-disc",
        "preview-umd",
        "preview-cartridge",
      );
      preview.style.removeProperty("aspect-ratio");
      preview.style.removeProperty("width");
      preview.style.removeProperty("max-width");
      preview.style.removeProperty("margin-left");
      preview.style.removeProperty("margin-right");

      if (role === "disc" || role === "cartridge") {
        const mediaDefinition = formatLibrary.getMediaDefinition({
          mediaFormat: getSelectedMediaFormat(),

          platform: platformInput?.value || "",

          mediaType: getSelectedMediaType(),

          region: regionInput?.value || "",
        });

        const ratio = mediaDefinition?.ratio || 1;

        preview.classList.add("preview-media");

        preview.style.setProperty("--media-preview-ratio", String(ratio));

        preview.style.aspectRatio = String(ratio);

        if (mediaDefinition?.shape === "disc") {
          preview.classList.add("preview-disc");
        } else if (
          mediaDefinition?.shape === "umd" ||
          mediaDefinition?.shape === "umd-mask"
        ) {
          preview.classList.add("preview-umd");
        } else {
          preview.classList.add("preview-cartridge");
        }

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

      if (role === "manual") {
        const manualRatio = getCaseGeometry("manual").ratio;

        const manualWidth = coverHeight * manualRatio;

        preview.style.aspectRatio = String(manualRatio);

        preview.style.width = `${manualWidth}px`;

        preview.style.maxWidth = "100%";

        preview.style.marginLeft = "auto";

        preview.style.marginRight = "auto";

        return;
      }

      preview.style.aspectRatio = getCaseGeometry(role).ratio;
    });
  }

  function updateCaseFormat() {
    const selected = getSelectedCaseFormat();

    customCaseSettings?.classList.toggle("visible", selected === "custom");

    updateUploadPreviewGeometry();
    imageCropper?.refreshCropper();
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

    imageCropper?.initializeUploadBox(uploadBox);

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
          imageCropper?.disposeUploadBox(uploadBox);
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

  function updateMediaType(preferredMediaFormat = "") {
    const selected = getSelectedMediaType();

    populateMediaFormatOptions(preferredMediaFormat);

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
    updateMediaFormat();
    updateUploadPreviewGeometry();
  }

  mediaTypeInputs.forEach((input) => {
    input.addEventListener("change", () => {
      mediaSelector?.classList.remove("is-invalid");
      updateMediaType();
    });
  });

  /* =====================================================
   SHARED IMAGE CROPPER
===================================================== */

  function getCropDefinition({ role = "front" } = {}) {
    if (role === "disc" || role === "cartridge") {
      return (
        formatLibrary.getMediaDefinition({
          mediaFormat: getSelectedMediaFormat(),

          platform: platformInput?.value || "",

          mediaType: getSelectedMediaType(),

          region: regionInput?.value || "",
        }) || {
          ratio: 1,
          shape: "rectangle",
          holeRatio: 0,
        }
      );
    }

    return {
      ratio: getCaseGeometry(role).ratio,
      shape: "rectangle",
      holeRatio: 0,
    };
  }

  function getCropTitle({ role, definition, discNumber }) {
    if (role === "disc") {
      if (definition?.shape === "umd") {
        return discNumber > 1 ? `Crop UMD ${discNumber}` : "Crop UMD";
      }

      return discNumber ? `Crop disc ${discNumber}` : "Crop disc";
    }

    const titleMap = {
      front: "Crop front",
      back: "Crop back",
      side: "Crop side",
      manual: "Crop manual",
      cartridge: "Crop cartridge",
    };

    return titleMap[role] || "Crop image";
  }

  imageCropper = imageCropperLibrary.create({
    getCropDefinition,
    getCropTitle,
  });

  imageCropper.initializeAll();

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

  regionInput?.addEventListener("change", () => {
    updateCountryOptions();

    if (platformInput?.value === "Super Nintendo") {
      const mediaFormat = formatLibrary.inferMediaFormat({
        platform: platformInput.value,

        mediaType: getSelectedMediaType(),

        region: regionInput.value,
      });

      populateMediaFormatOptions(mediaFormat);

      updateMediaFormat();
    }
  });

  /* =====================================================
   MARKET RESEARCH
===================================================== */

  function getResearchEdition() {
    const edition = getEditionValue() || "";

    if (!edition || edition === "Standard Edition") {
      return "";
    }

    return edition;
  }

  function getResearchRegionLabel(provider) {
    const region = regionInput?.value || "";

    if (provider === "pricecharting") {
      if (region === "Europe" || region === "Australia") {
        return "PAL";
      }

      if (region === "Japan") {
        return "JP";
      }

      return "";
    }

    if (region === "Europe") {
      return "PAL";
    }

    if (region === "North America") {
      return "NTSC";
    }

    if (region === "Japan") {
      return "Japanese";
    }

    return "";
  }

  function buildMarketResearchQuery(provider) {
    const title = gameTitleInput?.value.trim() || "";

    const platform = platformInput?.value || "";

    if (!title || !platform) {
      return "";
    }

    const region = getResearchRegionLabel(provider);

    const edition = getResearchEdition();

    return [title, region, platform, edition].filter(Boolean).join(" ");
  }

  function createMarketResearchUrl(provider, query) {
    if (!query) {
      return null;
    }

    let url;

    if (provider === "pricecharting") {
      url = new URL("/search-products", "https:" + "//www.pricecharting.com");

      url.searchParams.set("type", "prices");

      url.searchParams.set("q", query);

      return url.toString();
    }

    if (provider === "ebay") {
      url = new URL("/sch/i.html", "https:" + "//www.ebay.com");

      url.searchParams.set("_nkw", query);

      /*
      Show sold AND completed items.

      This is much more useful for
      valuation research than simply
      showing active asking prices.
    */

      url.searchParams.set("LH_Sold", "1");

      url.searchParams.set("LH_Complete", "1");

      return url.toString();
    }

    if (provider === "cex") {
      url = new URL("/search/", "https:" + "//pt.webuy.com");

      url.searchParams.set("stext", query);

      return url.toString();
    }

    return null;
  }

  function updateMarketResearchLinks() {
    marketResearchLinks.forEach((link) => {
      const provider = link.dataset.marketProvider;

      const query = buildMarketResearchQuery(provider);

      const url = createMarketResearchUrl(provider, query);

      if (!url) {
        link.href = "#";

        link.setAttribute("aria-disabled", "true");

        return;
      }

      link.href = url;

      link.setAttribute("aria-disabled", "false");
    });
  }

  marketResearchLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      if (link.getAttribute("aria-disabled") === "true") {
        event.preventDefault();
        return;
      }

      /*
          If the user hasn't chosen a
          source yet, selecting a research
          service automatically fills it.

          They can still change it later.
        */

      if (valueSourceInput && !valueSourceInput.value) {
        valueSourceInput.value = link.dataset.valueSource || "";
      }
    });
  });

  [
    gameTitleInput,
    platformInput,
    regionInput,
    editionInput,
    customEditionInput,
  ].forEach((input) => {
    input?.addEventListener("input", updateMarketResearchLinks);

    input?.addEventListener("change", updateMarketResearchLinks);
  });

  editionInput?.addEventListener("change", () => {
    updateCustomEditionField();

    if (editionInput.value !== "Other" && customEditionInput) {
      customEditionInput.value = "";
    }
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

    if (editionInput?.value === "Other" && !customEditionInput?.value.trim()) {
      setFormSaveMessage("Enter the custom edition name.", "error");
      focusInvalidField(customEditionInput);
      return false;
    }

    const mediaType = getSelectedMediaType();

    if (!mediaType) {
      setFormSaveMessage("Select the physical media type.", "error");
      focusInvalidGroup(mediaSelector);
      return false;
    }

    const mediaFormat = getSelectedMediaFormat();

    const mediaDefinition = MEDIA_FORMATS[mediaFormat];

    if (
      !mediaFormat ||
      !mediaDefinition ||
      mediaDefinition.mediaType !== mediaType
    ) {
      setFormSaveMessage("Select the physical media format.", "error");

      focusInvalidField(mediaFormatInput);

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

    if (estimatedValueInput?.value !== "") {
      const estimatedValue = Number(estimatedValueInput.value);

      if (!Number.isFinite(estimatedValue) || estimatedValue < 0) {
        setFormSaveMessage("Enter a valid estimated value.", "error");

        focusInvalidField(estimatedValueInput);

        return false;
      }

      if (!valueSourceInput?.value) {
        setFormSaveMessage(
          "Select the source used for the estimated value.",
          "error",
        );

        focusInvalidField(valueSourceInput);

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
   EDIT MODE
===================================================== */

  function isValidUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  function setEditModeInterface(item) {
    document.title = `Edit ${item.title} - Shelfmark`;

    if (formHeading) {
      formHeading.textContent = "Edit game";
    }

    if (formEyebrow) {
      formEyebrow.textContent = "Collection / Edit";
    }

    if (formIntro) {
      formIntro.textContent =
        "Update the information recorded for this physical copy.";
    }

    if (saveGameButton) {
      saveGameButton.textContent = "Save changes";

      saveGameButton.dataset.originalText = "Save changes";
    }

    if (cancelButton) {
      cancelButton.href = `game.html?id=${encodeURIComponent(item.id)}`;
    }
  }

  function setWishlistImportInterface(item) {
    document.title = `Add ${item.title} - Shelfmark`;

    if (formHeading) {
      formHeading.textContent = "Add game";
    }

    if (formEyebrow) {
      formEyebrow.textContent = "Wishlist / Collection";
    }

    if (formIntro) {
      formIntro.textContent =
        "Record the physical copy you acquired. Release information has been carried over from your Wishlist, but copy-specific details and photographs must be recorded separately.";
    }

    if (saveGameButton) {
      saveGameButton.textContent = "Add to collection";
      saveGameButton.dataset.originalText = "Add to collection";
    }

    if (cancelButton) {
      cancelButton.href = "wishlist.html";
    }
  }

  async function addEditSignedUrls(images) {
    return window.ShelfmarkStorage.addSignedUrls(images);
  }

  function getUploadBoxForExistingImage(image) {
    if (image.image_type === "disc") {
      return (
        discUploadGroup?.querySelector(
          `.image-upload[data-disc-number="${image.disc_number}"]`,
        ) || null
      );
    }

    return (
      document.querySelector(
        `.image-upload[data-image-role="${image.image_type}"]`,
      ) || null
    );
  }

  function setInputValue(input, value) {
    if (!input) {
      return;
    }

    input.value = value ?? "";
  }

  async function loadEditMode() {
    if (!isEditMode) {
      return;
    }

    if (!editItemId || !isValidUuid(editItemId)) {
      setFormSaveMessage(
        "This edit link does not contain a valid game ID.",
        "error",
      );

      if (saveGameButton) {
        saveGameButton.disabled = true;

        saveGameButton.textContent = "Unavailable";
      }

      return;
    }

    if (!supabaseClient) {
      setFormSaveMessage("Shelfmark could not connect to Supabase.", "error");

      return;
    }

    setSaveLoading(true, "Loading game…");

    setFormSaveMessage("Loading game information…", "loading");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser();

      if (userError || !user) {
        throw new Error("You must be logged in to edit this game.");
      }

      const [itemResult, gameResult, imagesResult] = await Promise.all([
        supabaseClient
          .from("collection_items")
          .select(
            `
              id,
              user_id,
              category,
              title,
              condition,
              completeness,
              region,
              country,
              purchase_date,
              purchase_price,
              estimated_value,
              value_source,
              value_checked_at,
              notes
            `,
          )
          .eq("id", editItemId)
          .eq("user_id", user.id)
          .eq("category", "game")
          .maybeSingle(),

        supabaseClient
          .from("games")
          .select(
            `
              item_id,
              platform,
              release_year,
              genre,
              game_type,
              edition,
              developer,
              publisher,
              media_type,
              media_format,
              case_format,
              custom_case_width,
              custom_case_height,
              disc_count
            `,
          )
          .eq("item_id", editItemId)
          .maybeSingle(),

        supabaseClient
          .from("item_images")
          .select(
            `
              id,
              item_id,
              image_type,
              storage_path,
              disc_number,
              sort_order
            `,
          )
          .eq("item_id", editItemId)
          .order("sort_order", {
            ascending: true,
          }),
      ]);

      if (itemResult.error) {
        throw itemResult.error;
      }

      if (gameResult.error) {
        throw gameResult.error;
      }

      if (imagesResult.error) {
        throw imagesResult.error;
      }

      if (!itemResult.data || !gameResult.data) {
        throw new Error("This game could not be found in your collection.");
      }

      editOriginalItem = itemResult.data;

      editOriginalGame = gameResult.data;

      editOriginalImages = await addEditSignedUrls(imagesResult.data || []);

      const item = editOriginalItem;

      const game = editOriginalGame;

      /* =================================================
       BASIC GAME DATA
    ================================================= */

      setInputValue(gameTitleInput, item.title);

      setInputValue(platformInput, game.platform);

      setInputValue(releaseYearInput, game.release_year);

      setInputValue(genreInput, game.genre);

      setInputValue(typeInput, game.game_type);

      setEditionValue(game.edition);

      setInputValue(developerInput, game.developer);

      setInputValue(publisherInput, game.publisher);

      /* =================================================
       PHYSICAL FORMAT
    ================================================= */

      setRadioGroupValue("mediaType", game.media_type || "");

      setRadioGroupValue("caseFormat", game.case_format || "");

      if (discCountInput) {
        discCountInput.value = String(game.disc_count || 1);
      }

      if (customWidth) {
        customWidth.value = game.custom_case_width ?? 1;
      }

      if (customHeight) {
        customHeight.value = game.custom_case_height ?? 1.4;
      }

      /*
      This also creates the correct
      dynamic Disc 1, Disc 2, etc.
      upload slots.
    */

      const resolvedMediaFormat = formatLibrary.resolveMediaFormat({
        mediaFormat: game.media_format || "",

        platform: game.platform || "",

        mediaType: game.media_type || "",

        region: item.region || "",
      });

      updateMediaType(resolvedMediaFormat);

      updateMediaFormat();

      updateCaseFormat();

      /* =================================================
       CONDITION
    ================================================= */

      setInputValue(conditionInput, item.condition);

      updateCompletenessOptions();

      ensureLegacyCompletenessOption(item.completeness);

      setInputValue(completenessInput, item.completeness);

      /* =================================================
       REGION / COUNTRY
    ================================================= */

      setInputValue(regionInput, item.region);

      updateCountryOptions();

      setInputValue(countryInput, item.country);

      /* =================================================
       PURCHASE
    ================================================= */

      setInputValue(purchaseDateInput, item.purchase_date);

      setInputValue(purchasePriceInput, item.purchase_price);

      if (item.estimated_value !== null && item.estimated_value !== undefined) {
        const estimated = Number(item.estimated_value);

        setEstimatedValueField(
          Number.isFinite(estimated) ? estimated.toFixed(2) : "",
        );
      } else {
        setEstimatedValueField("");
      }

      setInputValue(valueSourceInput, item.value_source);

      pendingValueCheckedAt = item.value_checked_at || null;

      valuationDirty = false;

      setValueCheckedPreview(item.value_checked_at);

      updateMarketResearchLinks();

      setInputValue(notesInput, item.notes);

      updateProfitLoss();

      /* =================================================
       EXISTING IMAGES
    ================================================= */

      editOriginalImages.forEach((imageRecord) => {
        const uploadBox = getUploadBoxForExistingImage(imageRecord);

        if (!uploadBox) {
          return;
        }

        const imageAlt =
          imageRecord.image_type === "disc"
            ? `Disc ${imageRecord.disc_number || 1} image`
            : `${imageRecord.image_type} image`;

        imageCropper.showExistingImage(uploadBox, imageRecord, {
          alt: imageAlt,
        });
      });

      updateUploadPreviewGeometry();

      /* =================================================
       INTERFACE
    ================================================= */

      setEditModeInterface(item);

      setFormSaveMessage("");

      if (item.estimated_value !== null && item.estimated_value !== undefined) {
        setValueStatus(
          "Saved manual market estimate. Use the research links below if you want to review it.",
          "success",
        );
      } else {
        setValueStatus(
          "Research the market below, then enter your own estimated value.",
        );
      }

      setSaveLoading(false);
    } catch (error) {
      console.error("Shelfmark edit load error:", error);

      setFormSaveMessage(
        error?.message || "The game could not be loaded for editing.",
        "error",
      );

      if (saveGameButton) {
        saveGameButton.disabled = true;

        saveGameButton.textContent = "Unavailable";
      }
    }
  }

  /* =====================================================
   WISHLIST → COLLECTION PREFILL
===================================================== */

  async function loadWishlistPrefill() {
    if (!isWishlistImportMode) {
      return;
    }

    if (!wishlistSourceId || !isValidUuid(wishlistSourceId)) {
      setFormSaveMessage(
        "This Wishlist link does not contain a valid item ID.",
        "error",
      );

      if (saveGameButton) {
        saveGameButton.disabled = true;
        saveGameButton.textContent = "Unavailable";
      }

      return;
    }

    if (!supabaseClient) {
      setFormSaveMessage("Shelfmark could not connect to Supabase.", "error");

      return;
    }

    setSaveLoading(true, "Loading wishlist item…");

    setFormSaveMessage("Loading wishlist information…", "loading");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "You must be logged in to add this Wishlist item to your collection.",
        );
      }

      const { data: item, error } = await supabaseClient
        .from("wishlist_items")
        .select(
          `
            id,
            user_id,
            title,
            platform,
            release_year,
            genre,
            game_type,
            edition,
            developer,
            publisher,
            region,
            country,
            media_type,
            media_format,
            case_format,
            custom_case_width,
            custom_case_height
          `,
        )
        .eq("id", wishlistSourceId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!item) {
        throw new Error("This Wishlist item could not be found.");
      }

      sourceWishlistItem = item;

      /* =================================================
       RELEASE INFORMATION
    ================================================= */

      setInputValue(gameTitleInput, item.title);

      setInputValue(platformInput, item.platform);

      setInputValue(releaseYearInput, item.release_year);

      setInputValue(genreInput, item.genre);

      setInputValue(typeInput, item.game_type);

      setEditionValue(item.edition);

      setInputValue(developerInput, item.developer);

      setInputValue(publisherInput, item.publisher);

      /* =================================================
       REGION / COUNTRY
    ================================================= */

      setInputValue(regionInput, item.region);

      updateCountryOptions();

      setInputValue(countryInput, item.country);

      /* =================================================
       PHYSICAL FORMAT
    ================================================= */

      setRadioGroupValue("mediaType", item.media_type || "");

      setRadioGroupValue("caseFormat", item.case_format || "");

      if (customWidth) {
        customWidth.value = item.custom_case_width ?? 1;
      }

      if (customHeight) {
        customHeight.value = item.custom_case_height ?? 1.4;
      }

      const resolvedMediaFormat = formatLibrary.resolveMediaFormat({
        mediaFormat: item.media_format || "",

        platform: item.platform || "",

        mediaType: item.media_type || "",

        region: item.region || "",
      });

      updateMediaType(resolvedMediaFormat);

      updateCaseFormat();

      /* =================================================
       OWNED-COPY INFORMATION

       Deliberately NOT copied:
       - condition
       - completeness
       - purchase information
       - valuation
       - notes
       - Wishlist reference images
    ================================================= */

      setInputValue(conditionInput, "");

      updateCompletenessOptions();

      setInputValue(completenessInput, "");

      setInputValue(purchaseDateInput, "");

      setInputValue(purchasePriceInput, "");

      setEstimatedValueField("");

      setInputValue(valueSourceInput, "");

      setInputValue(notesInput, "");

      pendingValueCheckedAt = null;
      valuationDirty = false;

      setValueCheckedPreview(null);

      updateProfitLoss();

      setValueStatus(
        "Research the market below, then enter your own estimated value.",
      );

      updateMarketResearchLinks();

      /* =================================================
       INTERFACE
    ================================================= */

      setWishlistImportInterface(item);

      setFormSaveMessage("");

      setSaveLoading(false);

      /*
      The user starts at the copy-specific
      part of the form rather than having
      to inspect all prefilled fields.
    */

      conditionInput?.scrollIntoView({
        block: "center",
      });
    } catch (error) {
      console.error("Shelfmark Wishlist prefill error:", error);

      setFormSaveMessage(
        error?.message || "The Wishlist item could not be loaded.",
        "error",
      );

      if (saveGameButton) {
        saveGameButton.disabled = true;
        saveGameButton.textContent = "Unavailable";
      }
    }
  }

  /* =====================================================
     DATABASE PAYLOAD
  ===================================================== */

  function getGameFormData(userId) {
    const mediaType = getSelectedMediaType();

    const caseFormat = getSelectedCaseFormat();

    const mediaFormat = getSelectedMediaFormat();

    const estimatedValueRaw = estimatedValueInput?.value.trim() || "";

    const estimatedValue = estimatedValueRaw
      ? optionalNumber(estimatedValueRaw)
      : null;

    let valueCheckedAt = null;

    if (estimatedValue !== null) {
      if (isEditMode && !valuationDirty) {
        valueCheckedAt = editOriginalItem?.value_checked_at ?? null;
      } else {
        valueCheckedAt = pendingValueCheckedAt || new Date().toISOString();
      }
    }

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
        estimated_value: estimatedValue,

        value_source:
          estimatedValue !== null
            ? optionalString(valueSourceInput?.value)
            : null,

        value_checked_at: valueCheckedAt,
        notes: optionalString(notesInput?.value),
      },

      game: {
        platform: platformInput?.value || "",
        release_year: optionalInteger(releaseYearInput?.value),
        genre: optionalString(genreInput?.value),
        game_type: optionalString(typeInput?.value),
        edition: getEditionValue(),
        developer: optionalString(developerInput?.value),
        publisher: optionalString(publisherInput?.value),

        media_type: mediaType,
        media_format: mediaFormat,
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
   EDIT IMAGE PLAN
===================================================== */

  function getEditImagePlan(mediaType) {
    const keepExistingIds = new Set();

    const newImages = [];

    document
      .querySelectorAll(".image-upload[data-image-role]")
      .forEach((uploadBox) => {
        const role = uploadBox.dataset.imageRole;

        const discNumber =
          role === "disc" ? Number(uploadBox.dataset.discNumber) || null : null;

        /*
          Ignore the media format that
          is no longer active.

          For example, changing Disc to
          Cartridge removes the old disc
          images when changes are saved.
        */

        if (role === "disc" && mediaType !== "disc") {
          return;
        }

        if (role === "cartridge" && mediaType !== "cartridge") {
          return;
        }

        const state = imageCropper.getState(uploadBox);

        if (!state?.hasImage) {
          return;
        }

        /*
          A newly cropped File means this
          slot is new or replacing its old
          stored image.
        */

        if (state.file) {
          newImages.push({
            role,
            discNumber,
            file: state.file,

            sortOrder: getImageSortOrder(role, discNumber),
          });

          return;
        }

        /*
          No local File + existingImage
          means the stored image should
          remain untouched.
        */

        if (state.existingImage?.id) {
          keepExistingIds.add(state.existingImage.id);
        }
      });

    /*
    Anything that existed in Supabase but
    is no longer represented as a kept
    image should be removed.

    This naturally handles:
    - clicking Remove image
    - replacing an image
    - reducing disc count
    - switching Disc -> Cartridge
    - switching Cartridge -> Disc
  */

    const oldImagesToDelete = editOriginalImages.filter(
      (image) => !keepExistingIds.has(image.id),
    );

    return {
      newImages,
      oldImagesToDelete,
    };
  }

  function createEditStoragePath(userId, itemId, image, index) {
    const extension = getFileExtension(image.file);

    const baseName =
      image.role === "disc" ? `disc-${image.discNumber}` : image.role;

    const token = `${Date.now()}-${index}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;

    return `${userId}/` + `${itemId}/` + `${baseName}-${token}.${extension}`;
  }

  function getOriginalItemPayload() {
    return {
      title: editOriginalItem.title,

      condition: editOriginalItem.condition,

      completeness: editOriginalItem.completeness,

      region: editOriginalItem.region,

      country: editOriginalItem.country,

      purchase_date: editOriginalItem.purchase_date,

      purchase_price: editOriginalItem.purchase_price,

      estimated_value: editOriginalItem.estimated_value,

      value_source: editOriginalItem.value_source,

      value_checked_at: editOriginalItem.value_checked_at,

      notes: editOriginalItem.notes,
    };
  }

  function getOriginalGamePayload() {
    return {
      platform: editOriginalGame.platform,

      release_year: editOriginalGame.release_year,

      genre: editOriginalGame.genre,

      game_type: editOriginalGame.game_type,

      edition: editOriginalGame.edition,

      developer: editOriginalGame.developer,

      publisher: editOriginalGame.publisher,

      media_type: editOriginalGame.media_type,

      media_format: editOriginalGame.media_format,

      case_format: editOriginalGame.case_format,

      custom_case_width: editOriginalGame.custom_case_width,

      custom_case_height: editOriginalGame.custom_case_height,

      disc_count: editOriginalGame.disc_count,
    };
  }

  async function updateExistingGame() {
    if (
      !supabaseClient ||
      !editOriginalItem ||
      !editOriginalGame ||
      !editItemId
    ) {
      throw new Error("The game is not ready to be edited.");
    }

    setFormSaveMessage("Checking your account…", "loading");

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error("You must be logged in to save changes.");
    }

    if (editOriginalItem.user_id !== user.id) {
      throw new Error("This game does not belong to the current account.");
    }

    const { collectionItem, game, mediaType } = getGameFormData(user.id);

    const itemUpdate = {
      title: collectionItem.title,

      condition: collectionItem.condition,

      completeness: collectionItem.completeness,

      region: collectionItem.region,

      country: collectionItem.country,

      purchase_date: collectionItem.purchase_date,

      purchase_price: collectionItem.purchase_price,

      estimated_value: collectionItem.estimated_value,

      value_source: collectionItem.value_source,

      value_checked_at: collectionItem.value_checked_at,

      notes: collectionItem.notes,
    };

    const gameUpdate = {
      ...game,
    };

    const { newImages, oldImagesToDelete } = getEditImagePlan(mediaType);

    const uploadedPaths = [];

    const insertedImageIds = [];

    let itemUpdated = false;
    let gameUpdated = false;

    try {
      /* =================================================
       UPLOAD NEW / REPLACEMENT IMAGES FIRST
    ================================================= */

      const newImageRows = [];

      for (let index = 0; index < newImages.length; index += 1) {
        const image = newImages[index];

        setFormSaveMessage(
          `Uploading image ${index + 1} of ${newImages.length}…`,
          "loading",
        );

        const storagePath = createEditStoragePath(
          user.id,
          editItemId,
          image,
          index,
        );

        const { error: uploadError } = await supabaseClient.storage
          .from("item-images")
          .upload(storagePath, image.file, {
            cacheControl: window.ShelfmarkStorage.UPLOAD_CACHE_CONTROL,

            contentType: image.file.type || "image/png",

            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        uploadedPaths.push(storagePath);

        newImageRows.push({
          item_id: editItemId,

          image_type: image.role,

          storage_path: storagePath,

          disc_number: image.role === "disc" ? image.discNumber : null,

          sort_order: image.sortOrder,
        });
      }

      /* =================================================
       CREATE NEW IMAGE DB ROWS
    ================================================= */

      if (newImageRows.length > 0) {
        setFormSaveMessage("Saving replacement images…", "loading");

        const { data: insertedImages, error: insertError } =
          await supabaseClient
            .from("item_images")
            .insert(newImageRows)
            .select("id");

        if (insertError) {
          throw insertError;
        }

        (insertedImages || []).forEach((image) => {
          if (image.id) {
            insertedImageIds.push(image.id);
          }
        });
      }

      /* =================================================
       UPDATE COLLECTION ITEM
    ================================================= */

      setFormSaveMessage("Updating game information…", "loading");

      const { error: itemError } = await supabaseClient
        .from("collection_items")
        .update(itemUpdate)
        .eq("id", editItemId)
        .eq("user_id", user.id);

      if (itemError) {
        throw itemError;
      }

      itemUpdated = true;

      /* =================================================
       UPDATE GAME DETAILS
    ================================================= */

      const { error: gameError } = await supabaseClient
        .from("games")
        .update(gameUpdate)
        .eq("item_id", editItemId);

      if (gameError) {
        throw gameError;
      }

      gameUpdated = true;

      /* =================================================
       REMOVE SUPERSEDED DB IMAGE ROWS
    ================================================= */

      const oldImageIds = oldImagesToDelete
        .map((image) => image.id)
        .filter(Boolean);

      if (oldImageIds.length > 0) {
        setFormSaveMessage("Removing old image records…", "loading");

        const { error: imageDeleteError } = await supabaseClient
          .from("item_images")
          .delete()
          .in("id", oldImageIds);

        if (imageDeleteError) {
          throw imageDeleteError;
        }
      }

      /* =================================================
       REMOVE OLD STORAGE FILES
    ================================================= */

      const oldStoragePaths = oldImagesToDelete
        .map((image) => image.storage_path)
        .filter(Boolean);

      if (oldStoragePaths.length > 0) {
        const { error: storageDeleteError } = await supabaseClient.storage
          .from("item-images")
          .remove(oldStoragePaths);

        /*
        At this point the database save
        succeeded, so a Storage cleanup
        failure should not undo the edit.

        It would only leave an orphaned
        file, which can be cleaned later.
      */

        if (storageDeleteError) {
          console.warn(
            "Shelfmark: Changes were saved, but some old image files could not be removed:",
            storageDeleteError,
          );
        }
      }

      setFormSaveMessage("Changes saved successfully.", "success");

      return editItemId;
    } catch (error) {
      console.error("Shelfmark edit save error:", error);

      /*
      Best-effort rollback of any newly
      created image rows/files.
    */

      if (insertedImageIds.length > 0) {
        const { error: imageRollbackError } = await supabaseClient
          .from("item_images")
          .delete()
          .in("id", insertedImageIds);

        if (imageRollbackError) {
          console.warn(
            "Shelfmark edit rollback: New image records could not be removed:",
            imageRollbackError,
          );
        }
      }

      if (uploadedPaths.length > 0) {
        const { error: storageRollbackError } = await supabaseClient.storage
          .from("item-images")
          .remove(uploadedPaths);

        if (storageRollbackError) {
          console.warn(
            "Shelfmark edit rollback: New Storage files could not be removed:",
            storageRollbackError,
          );
        }
      }

      /*
      Restore text/game information if
      one of the UPDATE operations already
      completed before another operation
      failed.
    */

      if (itemUpdated) {
        const { error: itemRollbackError } = await supabaseClient
          .from("collection_items")
          .update(getOriginalItemPayload())
          .eq("id", editItemId)
          .eq("user_id", user.id);

        if (itemRollbackError) {
          console.warn(
            "Shelfmark edit rollback: Collection item could not be restored:",
            itemRollbackError,
          );
        }
      }

      if (gameUpdated) {
        const { error: gameRollbackError } = await supabaseClient
          .from("games")
          .update(getOriginalGamePayload())
          .eq("item_id", editItemId);

        if (gameRollbackError) {
          console.warn(
            "Shelfmark edit rollback: Game details could not be restored:",
            gameRollbackError,
          );
        }
      }

      throw error;
    }
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
            cacheControl: window.ShelfmarkStorage.UPLOAD_CACHE_CONTROL,
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

  /* =====================================================
   WISHLIST SOURCE CLEANUP
===================================================== */

  async function removeSourceWishlistItem() {
    if (!isWishlistImportMode || !wishlistSourceId || !supabaseClient) {
      return;
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser();

      if (userError || !user) {
        console.warn(
          "Shelfmark: Collection item was saved, but the source Wishlist item could not be removed because the session was unavailable.",
        );

        return;
      }

      /*
      Get Storage paths before deleting
      the Wishlist database record.

      wishlist_images rows are removed by
      ON DELETE CASCADE.
    */

      const { data: imageRecords, error: imageError } = await supabaseClient
        .from("wishlist_images")
        .select("storage_path")
        .eq("wishlist_item_id", wishlistSourceId);

      if (imageError) {
        console.warn(
          "Shelfmark: Could not retrieve Wishlist reference images for cleanup:",
          imageError,
        );
      }

      const storagePaths = (imageRecords || [])
        .map((image) => image.storage_path)
        .filter(Boolean);

      /*
      Delete the Wishlist entry.

      Its wishlist_images database rows
      cascade automatically.
    */

      const { error: deleteError } = await supabaseClient
        .from("wishlist_items")
        .delete()
        .eq("id", wishlistSourceId)
        .eq("user_id", user.id);

      if (deleteError) {
        console.warn(
          "Shelfmark: The game was added to the Collection, but its Wishlist entry could not be removed:",
          deleteError,
        );

        return;
      }

      /*
      Remove the Wishlist-only reference
      artwork after the DB item is gone.

      Failure here must NOT undo the newly
      created Collection item.
    */

      if (storagePaths.length > 0) {
        const { error: storageError } = await supabaseClient.storage
          .from("item-images")
          .remove(storagePaths);

        if (storageError) {
          console.warn(
            "Shelfmark: Wishlist entry was removed, but some old reference image files could not be deleted:",
            storageError,
          );
        }
      }
    } catch (error) {
      console.warn(
        "Shelfmark: The game was added to the Collection, but Wishlist cleanup failed:",
        error,
      );
    }
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (saveGameButton?.disabled || !validateGameForm()) {
      return;
    }

    const loadingMessage = isEditMode ? "Saving changes…" : "Saving game…";

    setSaveLoading(true, loadingMessage);

    setFormSaveMessage(loadingMessage, "loading");

    try {
      const itemId = isEditMode ? await updateExistingGame() : await saveGame();

      if (!isEditMode && isWishlistImportMode) {
        setFormSaveMessage(
          "Game saved. Removing it from your Wishlist…",
          "loading",
        );

        await removeSourceWishlistItem();
      }

      window.location.href = `game.html?id=${encodeURIComponent(itemId)}`;
    } catch (error) {
      console.error(
        isEditMode
          ? "Shelfmark edit game error:"
          : "Shelfmark save game error:",
        error,
      );

      const sessionExpired =
        error?.message === "You must be logged in to save a game." ||
        error?.message === "You must be logged in to save changes.";

      const message = sessionExpired
        ? "Your session has expired. Log in again before saving."
        : isEditMode
          ? "The changes could not be saved. Please try again."
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
  updateCustomEditionField();
  updateCountryOptions();
  updateCompletenessOptions();
  updateMediaType();
  updateCaseFormat();

  setValueCheckedPreview(null);

  setValueStatus(
    "Research the market below, then enter your own estimated value.",
  );

  updateMarketResearchLinks();

  requestAnimationFrame(() => {
    updateUploadPreviewGeometry();
  });

  if (isEditMode) {
    loadEditMode();
  } else if (isWishlistImportMode) {
    loadWishlistPrefill();
  }
});
