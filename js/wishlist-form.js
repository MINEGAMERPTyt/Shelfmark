document.addEventListener("DOMContentLoaded", () => {
  /* =====================================================
     ELEMENTS
  ===================================================== */

  const form = document.getElementById("wishlist-form");

  if (!form) {
    return;
  }

  const saveButton = document.getElementById("save-wishlist-item");

  const supabaseClient = window.shelfmarkSupabase;
  const formatLibrary = window.ShelfmarkFormats;
  const imageCropperLibrary = window.ShelfmarkImageCropper;

  if (!formatLibrary) {
    throw new Error(
      "Shelfmark format library is missing. Make sure js/formats.js loads before wishlist-form.js.",
    );
  }

  if (!imageCropperLibrary) {
    throw new Error(
      "Shelfmark image cropper is missing. Make sure js/image-cropper.js loads before wishlist-form.js.",
    );
  }

  const { MEDIA_FORMATS, PLATFORM_DEFAULTS } = formatLibrary;

  /* =====================================================
     MODE
  ===================================================== */

  const urlParams = new URLSearchParams(window.location.search);

  const editItemId = urlParams.get("edit");

  const isEditMode = Boolean(editItemId);

  let editOriginalItem = null;
  let editOriginalImages = [];

  /* =====================================================
     HEADER
  ===================================================== */

  const formHeading = document.querySelector(".form-header h1");
  const formIntro = document.querySelector(".form-intro");
  const formEyebrow = document.querySelector(".form-eyebrow");
  const cancelButton = document.querySelector(".form-button-secondary");

  /* =====================================================
     GAME INFORMATION
  ===================================================== */

  const titleInput = document.getElementById("wishlist-title");

  const platformInput = document.getElementById("wishlist-platform");

  const releaseYearInput = document.getElementById("wishlist-release-year");

  const genreInput = document.getElementById("wishlist-genre");

  const regionInput = document.getElementById("wishlist-region");

  const countryInput = document.getElementById("wishlist-country");

  const gameTypeInput = document.getElementById("wishlist-game-type");

  const editionInput = document.getElementById("wishlist-edition");

  const developerInput = document.getElementById("wishlist-developer");

  const publisherInput = document.getElementById("wishlist-publisher");

  /* =====================================================
     PHYSICAL FORMAT
  ===================================================== */

  const mediaTypeInputs = document.querySelectorAll('input[name="mediaType"]');

  const mediaSelector = document.getElementById("wishlist-media-selector");

  const mediaFormatSettings = document.getElementById(
    "wishlist-media-format-settings",
  );

  const mediaFormatInput = document.getElementById("wishlist-media-format");

  const caseFormatInputs = document.querySelectorAll(
    'input[name="caseFormat"]',
  );

  const caseFormatSelector = document.getElementById(
    "wishlist-case-format-selector",
  );

  const customCaseSettings = document.getElementById(
    "wishlist-custom-case-settings",
  );

  const customWidthInput = document.getElementById("wishlist-custom-width");

  const customHeightInput = document.getElementById("wishlist-custom-height");

  /* =====================================================
     WISHLIST PREFERENCES
  ===================================================== */

  const priorityInput = document.getElementById("wishlist-priority");

  const targetPriceInput = document.getElementById("wishlist-target-price");

  const desiredConditionInput = document.getElementById("wishlist-condition");

  const desiredCompletenessInput = document.getElementById(
    "wishlist-completeness",
  );

  const notesInput = document.getElementById("wishlist-notes");

  /* =====================================================
     IMAGE AREA
  ===================================================== */

  const discUpload = document.getElementById("wishlist-disc-upload");

  const cartridgeUpload = document.getElementById("wishlist-cartridge-upload");

  const mediaPhotoStatus = document.getElementById(
    "wishlist-media-photo-status",
  );

  const mediaUploadEmpty = document.getElementById(
    "wishlist-media-upload-empty",
  );

  const saveMessage = document.getElementById("wishlist-save-message");

  /* =====================================================
     OPTIONS
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
     HELPERS
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

  function isValidUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  function setInputValue(input, value) {
    if (!input) {
      return;
    }

    input.value = value ?? "";
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

  /* =====================================================
     REGION / COUNTRY
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
    if (!desiredCompletenessInput) {
      return;
    }

    const mediaType = getSelectedMediaType();

    const previousValue = desiredCompletenessInput.value;

    const options = getCompletenessOptions(mediaType);

    desiredCompletenessInput.innerHTML = "";

    const placeholder = document.createElement("option");

    placeholder.value = "";

    placeholder.textContent = mediaType
      ? "Any completeness"
      : "Select media first";

    desiredCompletenessInput.appendChild(placeholder);

    if (!mediaType) {
      desiredCompletenessInput.disabled = true;
      desiredCompletenessInput.value = "";

      return;
    }

    options.forEach((value) => {
      const option = document.createElement("option");

      option.value = value;
      option.textContent = value;

      desiredCompletenessInput.appendChild(option);
    });

    desiredCompletenessInput.disabled = false;

    if (options.includes(previousValue)) {
      desiredCompletenessInput.value = previousValue;
    }
  }

  function ensureLegacyCompletenessOption(value) {
    if (!desiredCompletenessInput || !value) {
      return;
    }

    const exists = Array.from(desiredCompletenessInput.options).some(
      (option) => option.value === value,
    );

    if (exists) {
      return;
    }

    const option = document.createElement("option");

    option.value = value;

    option.textContent = `${value} (legacy)`;

    desiredCompletenessInput.appendChild(option);
  }

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

  /* =====================================================
     CASE GEOMETRY
  ===================================================== */

  function getCaseGeometry(role) {
    const caseFormat = getSelectedCaseFormat() || "dvd";

    let geometryRole = role;

    if (role === "front" || role === "back") {
      geometryRole = "cover";
    }

    const ratio = formatLibrary.getCaseRatio({
      caseFormat,
      role: geometryRole,

      customWidth: customWidthInput?.value,

      customHeight: customHeightInput?.value,
    });

    return {
      ratio,
    };
  }

  /* =====================================================
     IMAGE PREVIEW GEOMETRY
  ===================================================== */

  function updateUploadPreviewGeometry() {
    const uploadBoxes = document.querySelectorAll(
      ".image-upload[data-image-role]",
    );

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

      preview.style.aspectRatio = String(getCaseGeometry(role).ratio);
    });
  }

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

  function getCropTitle({ role, definition }) {
    if (role === "disc") {
      return definition?.shape === "umd"
        ? "Crop UMD reference"
        : "Crop disc reference";
    }

    if (role === "cartridge") {
      return "Crop cartridge reference";
    }

    if (role === "front") {
      return "Crop front reference";
    }

    return "Crop reference image";
  }

  const imageCropper = imageCropperLibrary.create({
    getCropDefinition,
    getCropTitle,
  });

  imageCropper.initializeAll();

  /* =====================================================
     CASE FORMAT
  ===================================================== */

  function updateCaseFormat() {
    const selected = getSelectedCaseFormat();

    customCaseSettings?.classList.toggle("visible", selected === "custom");

    updateUploadPreviewGeometry();

    imageCropper.refreshCropper();
  }

  caseFormatInputs.forEach((input) => {
    input.addEventListener("change", () => {
      caseFormatSelector?.classList.remove("is-invalid");

      updateCaseFormat();
    });
  });

  customWidthInput?.addEventListener("input", updateCaseFormat);

  customHeightInput?.addEventListener("input", updateCaseFormat);

  /* =====================================================
     MEDIA TYPE
  ===================================================== */

  function updateMediaType(preferredMediaFormat = "") {
    const selected = getSelectedMediaType();

    populateMediaFormatOptions(preferredMediaFormat);

    discUpload?.classList.toggle("is-hidden", selected !== "disc");

    cartridgeUpload?.classList.toggle("is-hidden", selected !== "cartridge");

    if (selected === "disc") {
      if (mediaPhotoStatus) {
        const definition = formatLibrary.getMediaDefinition({
          mediaFormat: getSelectedMediaFormat(),

          platform: platformInput?.value || "",

          mediaType: selected,

          region: regionInput?.value || "",
        });

        mediaPhotoStatus.textContent = definition?.shortLabel || "Disc";
      }

      mediaUploadEmpty?.classList.remove("visible");
    } else if (selected === "cartridge") {
      if (mediaPhotoStatus) {
        const definition = formatLibrary.getMediaDefinition({
          mediaFormat: getSelectedMediaFormat(),

          platform: platformInput?.value || "",

          mediaType: selected,

          region: regionInput?.value || "",
        });

        mediaPhotoStatus.textContent = definition?.shortLabel || "Cartridge";
      }

      mediaUploadEmpty?.classList.remove("visible");
    } else {
      if (mediaPhotoStatus) {
        mediaPhotoStatus.textContent = "Select media above";
      }

      mediaUploadEmpty?.classList.add("visible");
    }

    updateCompletenessOptions();
    updateUploadPreviewGeometry();

    imageCropper.refreshCropper();
  }

  mediaTypeInputs.forEach((input) => {
    input.addEventListener("change", () => {
      mediaSelector?.classList.remove("is-invalid");

      updateMediaType();
    });
  });

  mediaFormatInput?.addEventListener("change", () => {
    mediaFormatInput.classList.remove("is-invalid");

    mediaFormatInput.removeAttribute("aria-invalid");

    updateMediaType(mediaFormatInput.value);
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

    setRadioGroupValue("mediaType", preset.mediaType);

    setRadioGroupValue("caseFormat", preset.caseFormat);

    const mediaFormat = formatLibrary.inferMediaFormat({
      platform,

      mediaType: preset.mediaType,

      region: regionInput?.value || "",
    });

    updateMediaType(mediaFormat);
    updateCaseFormat();
  }

  platformInput?.addEventListener("change", applyPlatformDefaults);

  regionInput?.addEventListener("change", () => {
    updateCountryOptions();

    if (platformInput?.value === "Super Nintendo") {
      const mediaFormat = formatLibrary.inferMediaFormat({
        platform: platformInput.value,

        mediaType: getSelectedMediaType(),

        region: regionInput.value,
      });

      populateMediaFormatOptions(mediaFormat);

      updateMediaType(mediaFormat);
    }
  });

  /* =====================================================
     SAVE MESSAGE
  ===================================================== */

  function setSaveMessage(message, type = "") {
    if (!saveMessage) {
      return;
    }

    saveMessage.textContent = message;

    saveMessage.classList.remove("visible", "error", "success", "loading");

    if (!message) {
      return;
    }

    saveMessage.classList.add("visible");

    if (type) {
      saveMessage.classList.add(type);
    }
  }

  function setSaveLoading(loading, text = "Saving wishlist item…") {
    if (!saveButton) {
      return;
    }

    if (loading) {
      if (!saveButton.dataset.originalText) {
        saveButton.dataset.originalText = saveButton.textContent.trim();
      }

      saveButton.textContent = text;
      saveButton.disabled = true;

      return;
    }

    saveButton.textContent =
      saveButton.dataset.originalText || "Save to wishlist";

    saveButton.disabled = false;
  }

  /* =====================================================
     VALIDATION
  ===================================================== */

  function clearValidation() {
    form.querySelectorAll(".is-invalid").forEach((element) => {
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

    field.focus({
      preventScroll: true,
    });

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

  function validateForm() {
    clearValidation();
    setSaveMessage("");

    if (!titleInput?.value.trim()) {
      setSaveMessage("Enter the game title.", "error");

      focusInvalidField(titleInput);

      return false;
    }

    if (!platformInput?.value) {
      setSaveMessage("Select the game's platform.", "error");

      focusInvalidField(platformInput);

      return false;
    }

    const mediaType = getSelectedMediaType();

    if (!mediaType) {
      setSaveMessage("Select the physical media type.", "error");

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
      setSaveMessage("Select the physical media format.", "error");

      focusInvalidField(mediaFormatInput);

      return false;
    }

    if (releaseYearInput?.value !== "") {
      const year = Number(releaseYearInput.value);

      if (!Number.isInteger(year) || year < 1970 || year > 2100) {
        setSaveMessage(
          "Enter a valid release year between 1970 and 2100.",
          "error",
        );

        focusInvalidField(releaseYearInput);

        return false;
      }
    }

    if (targetPriceInput?.value !== "") {
      const targetPrice = Number(targetPriceInput.value);

      if (!Number.isFinite(targetPrice) || targetPrice < 0) {
        setSaveMessage("Enter a valid target price.", "error");

        focusInvalidField(targetPriceInput);

        return false;
      }
    }

    const priority = priorityInput?.value;

    if (!["low", "medium", "high"].includes(priority)) {
      setSaveMessage("Select a valid priority.", "error");

      focusInvalidField(priorityInput);

      return false;
    }

    const caseFormat = getSelectedCaseFormat();

    if (caseFormat === "custom") {
      const width = Number(customWidthInput?.value);

      const height = Number(customHeightInput?.value);

      if (!Number.isFinite(width) || width <= 0) {
        setSaveMessage("Enter a valid custom case width.", "error");

        focusInvalidField(customWidthInput);

        return false;
      }

      if (!Number.isFinite(height) || height <= 0) {
        setSaveMessage("Enter a valid custom case height.", "error");

        focusInvalidField(customHeightInput);

        return false;
      }
    }

    return true;
  }

  form.querySelectorAll("input, select, textarea").forEach((field) => {
    const clearInvalidState = () => {
      field.classList.remove("is-invalid");

      field.removeAttribute("aria-invalid");
    };

    field.addEventListener("input", clearInvalidState);

    field.addEventListener("change", clearInvalidState);
  });

  /* =====================================================
     PAYLOAD
  ===================================================== */

  function getWishlistData(userId) {
    const mediaType = getSelectedMediaType();

    const mediaFormat = getSelectedMediaFormat();

    const caseFormat = getSelectedCaseFormat();

    return {
      user_id: userId,

      title: titleInput?.value.trim() || "",

      platform: platformInput?.value || "",

      release_year: optionalInteger(releaseYearInput?.value),

      genre: optionalString(genreInput?.value),

      game_type: optionalString(gameTypeInput?.value),

      edition: optionalString(editionInput?.value),

      developer: optionalString(developerInput?.value),

      publisher: optionalString(publisherInput?.value),

      region: optionalString(regionInput?.value),

      country: optionalString(countryInput?.value),

      media_type: mediaType,

      media_format: mediaFormat,

      case_format: caseFormat || null,

      custom_case_width:
        caseFormat === "custom"
          ? optionalNumber(customWidthInput?.value)
          : null,

      custom_case_height:
        caseFormat === "custom"
          ? optionalNumber(customHeightInput?.value)
          : null,

      priority: priorityInput?.value || "medium",

      target_price: optionalNumber(targetPriceInput?.value),

      desired_condition: optionalString(desiredConditionInput?.value),

      desired_completeness: optionalString(desiredCompletenessInput?.value),

      notes: optionalString(notesInput?.value),
    };
  }

  /* =====================================================
     IMAGE HELPERS
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

  function isImageRoleActive(role, mediaType) {
    if (role === "front") {
      return true;
    }

    if (role === "disc") {
      return mediaType === "disc";
    }

    if (role === "cartridge") {
      return mediaType === "cartridge";
    }

    return false;
  }

  function getSelectedImages(mediaType) {
    return Array.from(
      document.querySelectorAll(".image-upload[data-image-role]"),
    )
      .map((uploadBox) => {
        const role = uploadBox.dataset.imageRole;

        const state = imageCropper.getState(uploadBox);

        return {
          role,
          file: state?.file || null,
        };
      })
      .filter(
        (image) => image.file && isImageRoleActive(image.role, mediaType),
      );
  }

  function createStoragePath(userId, itemId, image, index) {
    const extension = getFileExtension(image.file);

    const token = `${Date.now()}-${index}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;

    return (
      `${userId}/wishlist/` +
      `${itemId}/` +
      `${image.role}-${token}.${extension}`
    );
  }

  /* =====================================================
     CREATE
  ===================================================== */

  async function rollbackCreate(itemId, uploadedPaths) {
    if (!supabaseClient) {
      return;
    }

    if (uploadedPaths.length > 0) {
      const { error } = await supabaseClient.storage
        .from("item-images")
        .remove(uploadedPaths);

      if (error) {
        console.warn(
          "Shelfmark wishlist rollback: Some uploaded files could not be removed:",
          error,
        );
      }
    }

    if (itemId) {
      const { error } = await supabaseClient
        .from("wishlist_items")
        .delete()
        .eq("id", itemId);

      if (error) {
        console.warn(
          "Shelfmark wishlist rollback: Partial wishlist item could not be removed:",
          error,
        );
      }
    }
  }

  async function createWishlistItem() {
    if (!supabaseClient) {
      throw new Error("Supabase is not connected.");
    }

    setSaveMessage("Checking your account…", "loading");

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error("You must be logged in to save a wishlist item.");
    }

    const item = getWishlistData(user.id);

    const mediaType = item.media_type;

    let createdItemId = null;

    const uploadedPaths = [];

    try {
      setSaveMessage("Saving wishlist item…", "loading");

      const { data: createdItem, error: itemError } = await supabaseClient
        .from("wishlist_items")
        .insert(item)
        .select("id")
        .single();

      if (itemError) {
        throw itemError;
      }

      if (!createdItem?.id) {
        throw new Error("Supabase did not return the new wishlist item ID.");
      }

      createdItemId = createdItem.id;

      const selectedImages = getSelectedImages(mediaType);

      const imageRows = [];

      for (let index = 0; index < selectedImages.length; index += 1) {
        const image = selectedImages[index];

        setSaveMessage(
          `Uploading reference image ${index + 1} of ${selectedImages.length}…`,
          "loading",
        );

        const storagePath = createStoragePath(
          user.id,
          createdItemId,
          image,
          index,
        );

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
          wishlist_item_id: createdItemId,

          image_type: image.role,

          storage_path: storagePath,
        });
      }

      if (imageRows.length > 0) {
        setSaveMessage("Saving reference images…", "loading");

        const { error } = await supabaseClient
          .from("wishlist_images")
          .insert(imageRows);

        if (error) {
          throw error;
        }
      }

      setSaveMessage("Wishlist item saved successfully.", "success");

      return createdItemId;
    } catch (error) {
      await rollbackCreate(createdItemId, uploadedPaths);

      throw error;
    }
  }

  /* =====================================================
     EDIT — LOAD
  ===================================================== */

  async function addSignedUrls(images) {
    if (!images.length) {
      return [];
    }

    const paths = images.map((image) => image.storage_path);

    const { data, error } = await supabaseClient.storage
      .from("item-images")
      .createSignedUrls(paths, 3600);

    if (error) {
      console.warn("Shelfmark wishlist signed URL error:", error);

      return images.map((image) => ({
        ...image,
        signedUrl: null,
      }));
    }

    return images.map((image, index) => {
      const signedEntry =
        data?.find((entry) => entry.path === image.storage_path) ||
        data?.[index] ||
        null;

      return {
        ...image,

        signedUrl: signedEntry?.signedUrl || signedEntry?.signedURL || null,
      };
    });
  }

  function getUploadBoxForImage(image) {
    return (
      document.querySelector(
        `.image-upload[data-image-role="${image.image_type}"]`,
      ) || null
    );
  }

  function setEditInterface(item) {
    document.title = `Edit ${item.title} - Shelfmark`;

    if (formHeading) {
      formHeading.textContent = "Edit wishlist item";
    }

    if (formEyebrow) {
      formEyebrow.textContent = "Wishlist / Edit";
    }

    if (formIntro) {
      formIntro.textContent =
        "Update the game or physical copy you are looking for.";
    }

    if (saveButton) {
      saveButton.textContent = "Save changes";

      saveButton.dataset.originalText = "Save changes";
    }

    if (cancelButton) {
      cancelButton.href = "wishlist.html";
    }
  }

  async function loadEditMode() {
    if (!isEditMode) {
      return;
    }

    if (!editItemId || !isValidUuid(editItemId)) {
      setSaveMessage(
        "This edit link does not contain a valid wishlist item ID.",
        "error",
      );

      if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = "Unavailable";
      }

      return;
    }

    if (!supabaseClient) {
      setSaveMessage("Shelfmark could not connect to Supabase.", "error");

      return;
    }

    setSaveLoading(true, "Loading wishlist item…");

    setSaveMessage("Loading wishlist item…", "loading");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser();

      if (userError || !user) {
        throw new Error("You must be logged in to edit this wishlist item.");
      }

      const [itemResult, imagesResult] = await Promise.all([
        supabaseClient
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
              custom_case_height,
              priority,
              target_price,
              desired_condition,
              desired_completeness,
              notes
            `,
          )
          .eq("id", editItemId)
          .eq("user_id", user.id)
          .maybeSingle(),

        supabaseClient
          .from("wishlist_images")
          .select(
            `
              id,
              wishlist_item_id,
              image_type,
              storage_path,
              created_at
            `,
          )
          .eq("wishlist_item_id", editItemId)
          .order("created_at", {
            ascending: true,
          }),
      ]);

      if (itemResult.error) {
        throw itemResult.error;
      }

      if (imagesResult.error) {
        throw imagesResult.error;
      }

      if (!itemResult.data) {
        throw new Error("This wishlist item could not be found.");
      }

      editOriginalItem = itemResult.data;

      editOriginalImages = await addSignedUrls(imagesResult.data || []);

      const item = editOriginalItem;

      /* ---------- Basic data ---------- */

      setInputValue(titleInput, item.title);

      setInputValue(platformInput, item.platform);

      setInputValue(releaseYearInput, item.release_year);

      setInputValue(genreInput, item.genre);

      setInputValue(gameTypeInput, item.game_type);

      setInputValue(editionInput, item.edition);

      setInputValue(developerInput, item.developer);

      setInputValue(publisherInput, item.publisher);

      /* ---------- Region ---------- */

      setInputValue(regionInput, item.region);

      updateCountryOptions();

      setInputValue(countryInput, item.country);

      /* ---------- Format ---------- */

      setRadioGroupValue("mediaType", item.media_type || "");

      setRadioGroupValue("caseFormat", item.case_format || "");

      if (customWidthInput) {
        customWidthInput.value = item.custom_case_width ?? 1;
      }

      if (customHeightInput) {
        customHeightInput.value = item.custom_case_height ?? 1.4;
      }

      const resolvedMediaFormat = formatLibrary.resolveMediaFormat({
        mediaFormat: item.media_format || "",

        platform: item.platform || "",

        mediaType: item.media_type || "",

        region: item.region || "",
      });

      updateMediaType(resolvedMediaFormat);

      updateCaseFormat();

      /* ---------- Preferences ---------- */

      setInputValue(priorityInput, item.priority || "medium");

      setInputValue(targetPriceInput, item.target_price);

      setInputValue(desiredConditionInput, item.desired_condition);

      updateCompletenessOptions();

      ensureLegacyCompletenessOption(item.desired_completeness);

      setInputValue(desiredCompletenessInput, item.desired_completeness);

      setInputValue(notesInput, item.notes);

      /* ---------- Existing images ---------- */

      editOriginalImages.forEach((imageRecord) => {
        const uploadBox = getUploadBoxForImage(imageRecord);

        if (!uploadBox) {
          return;
        }

        const alt =
          imageRecord.image_type === "front"
            ? "Wishlist front reference image"
            : imageRecord.image_type === "disc"
              ? "Wishlist disc reference image"
              : "Wishlist cartridge reference image";

        imageCropper.showExistingImage(uploadBox, imageRecord, {
          alt,
        });
      });

      updateUploadPreviewGeometry();

      setEditInterface(item);

      setSaveMessage("");

      setSaveLoading(false);
    } catch (error) {
      console.error("Shelfmark wishlist edit load error:", error);

      setSaveMessage(
        error?.message || "The wishlist item could not be loaded.",
        "error",
      );

      if (saveButton) {
        saveButton.disabled = true;

        saveButton.textContent = "Unavailable";
      }
    }
  }

  /* =====================================================
     EDIT — IMAGE PLAN
  ===================================================== */

  function getEditImagePlan(mediaType) {
    const keepExistingIds = new Set();

    const newImages = [];

    document
      .querySelectorAll(".image-upload[data-image-role]")
      .forEach((uploadBox) => {
        const role = uploadBox.dataset.imageRole;

        if (!isImageRoleActive(role, mediaType)) {
          return;
        }

        const state = imageCropper.getState(uploadBox);

        if (!state?.hasImage) {
          return;
        }

        if (state.file) {
          newImages.push({
            role,
            file: state.file,
          });

          return;
        }

        if (state.existingImage?.id) {
          keepExistingIds.add(state.existingImage.id);
        }
      });

    const oldImagesToDelete = editOriginalImages.filter(
      (image) => !keepExistingIds.has(image.id),
    );

    return {
      newImages,
      oldImagesToDelete,
    };
  }

  function getOriginalPayload() {
    return {
      title: editOriginalItem.title,

      platform: editOriginalItem.platform,

      release_year: editOriginalItem.release_year,

      genre: editOriginalItem.genre,

      game_type: editOriginalItem.game_type,

      edition: editOriginalItem.edition,

      developer: editOriginalItem.developer,

      publisher: editOriginalItem.publisher,

      region: editOriginalItem.region,

      country: editOriginalItem.country,

      media_type: editOriginalItem.media_type,

      media_format: editOriginalItem.media_format,

      case_format: editOriginalItem.case_format,

      custom_case_width: editOriginalItem.custom_case_width,

      custom_case_height: editOriginalItem.custom_case_height,

      priority: editOriginalItem.priority,

      target_price: editOriginalItem.target_price,

      desired_condition: editOriginalItem.desired_condition,

      desired_completeness: editOriginalItem.desired_completeness,

      notes: editOriginalItem.notes,
    };
  }

  /* =====================================================
     EDIT — SAVE
  ===================================================== */

  async function updateWishlistItem() {
    if (!supabaseClient || !editOriginalItem || !editItemId) {
      throw new Error("The wishlist item is not ready to be edited.");
    }

    setSaveMessage("Checking your account…", "loading");

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error("You must be logged in to save changes.");
    }

    if (editOriginalItem.user_id !== user.id) {
      throw new Error(
        "This wishlist item does not belong to the current account.",
      );
    }

    const fullPayload = getWishlistData(user.id);

    const { user_id, ...itemUpdate } = fullPayload;

    const mediaType = fullPayload.media_type;

    const { newImages, oldImagesToDelete } = getEditImagePlan(mediaType);

    const uploadedPaths = [];
    const insertedImageIds = [];

    let itemUpdated = false;

    try {
      /* ---------- Upload replacements ---------- */

      const newImageRows = [];

      for (let index = 0; index < newImages.length; index += 1) {
        const image = newImages[index];

        setSaveMessage(
          `Uploading reference image ${index + 1} of ${newImages.length}…`,
          "loading",
        );

        const storagePath = createStoragePath(
          user.id,
          editItemId,
          image,
          index,
        );

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

        newImageRows.push({
          wishlist_item_id: editItemId,

          image_type: image.role,

          storage_path: storagePath,
        });
      }

      /* ---------- New DB image rows ---------- */

      if (newImageRows.length > 0) {
        setSaveMessage("Saving replacement images…", "loading");

        const { data: insertedImages, error } = await supabaseClient
          .from("wishlist_images")
          .insert(newImageRows)
          .select("id");

        if (error) {
          throw error;
        }

        (insertedImages || []).forEach((image) => {
          if (image.id) {
            insertedImageIds.push(image.id);
          }
        });
      }

      /* ---------- Update item ---------- */

      setSaveMessage("Updating wishlist item…", "loading");

      const { error: itemError } = await supabaseClient
        .from("wishlist_items")
        .update(itemUpdate)
        .eq("id", editItemId)
        .eq("user_id", user.id);

      if (itemError) {
        throw itemError;
      }

      itemUpdated = true;

      /* ---------- Delete old DB rows ---------- */

      const oldImageIds = oldImagesToDelete
        .map((image) => image.id)
        .filter(Boolean);

      if (oldImageIds.length > 0) {
        const { error } = await supabaseClient
          .from("wishlist_images")
          .delete()
          .in("id", oldImageIds);

        if (error) {
          throw error;
        }
      }

      /* ---------- Delete old files ---------- */

      const oldStoragePaths = oldImagesToDelete
        .map((image) => image.storage_path)
        .filter(Boolean);

      if (oldStoragePaths.length > 0) {
        const { error } = await supabaseClient.storage
          .from("item-images")
          .remove(oldStoragePaths);

        if (error) {
          console.warn(
            "Shelfmark: Wishlist changes were saved, but some old reference files could not be removed:",
            error,
          );
        }
      }

      setSaveMessage("Wishlist changes saved successfully.", "success");

      return editItemId;
    } catch (error) {
      console.error("Shelfmark wishlist edit save error:", error);

      /* ---------- Roll back new DB rows ---------- */

      if (insertedImageIds.length > 0) {
        const { error } = await supabaseClient
          .from("wishlist_images")
          .delete()
          .in("id", insertedImageIds);

        if (error) {
          console.warn(
            "Shelfmark wishlist rollback: New image records could not be removed:",
            error,
          );
        }
      }

      /* ---------- Roll back new files ---------- */

      if (uploadedPaths.length > 0) {
        const { error } = await supabaseClient.storage
          .from("item-images")
          .remove(uploadedPaths);

        if (error) {
          console.warn(
            "Shelfmark wishlist rollback: New Storage files could not be removed:",
            error,
          );
        }
      }

      /* ---------- Restore original fields ---------- */

      if (itemUpdated) {
        const { error } = await supabaseClient
          .from("wishlist_items")
          .update(getOriginalPayload())
          .eq("id", editItemId)
          .eq("user_id", user.id);

        if (error) {
          console.warn(
            "Shelfmark wishlist rollback: Original wishlist information could not be restored:",
            error,
          );
        }
      }

      throw error;
    }
  }

  /* =====================================================
     SUBMIT
  ===================================================== */

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (saveButton?.disabled || !validateForm()) {
      return;
    }

    const loadingMessage = isEditMode
      ? "Saving changes…"
      : "Saving wishlist item…";

    setSaveLoading(true, loadingMessage);

    setSaveMessage(loadingMessage, "loading");

    try {
      if (isEditMode) {
        await updateWishlistItem();
      } else {
        await createWishlistItem();
      }

      window.location.href = "wishlist.html";
    } catch (error) {
      console.error(
        isEditMode
          ? "Shelfmark wishlist edit error:"
          : "Shelfmark wishlist save error:",
        error,
      );

      const sessionExpired =
        error?.message === "You must be logged in to save a wishlist item." ||
        error?.message === "You must be logged in to save changes.";

      setSaveMessage(
        sessionExpired
          ? "Your session has expired. Log in again before saving."
          : isEditMode
            ? "The wishlist changes could not be saved. Please try again."
            : "The wishlist item could not be saved. Please try again.",
        "error",
      );

      setSaveLoading(false);
    }
  });

  /* =====================================================
     INITIAL STATE
  ===================================================== */

  updateCountryOptions();
  updateCompletenessOptions();
  updateMediaType();
  updateCaseFormat();

  requestAnimationFrame(() => {
    updateUploadPreviewGeometry();
  });

  if (isEditMode) {
    loadEditMode();
  }
});
