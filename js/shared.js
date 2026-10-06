document.addEventListener("DOMContentLoaded", () => {
  const supabaseClient = window.shelfmarkSupabase;
  const formatLibrary = window.ShelfmarkFormats;
  const caseViewer = window.ShelfmarkCaseViewer;
  const appSettings = window.ShelfmarkSettings;

  if (!formatLibrary) {
    throw new Error(
      "Shelfmark format library is missing. Make sure js/formats.js loads before shared.js.",
    );
  }

  if (!caseViewer) {
    throw new Error(
      "Shelfmark physical viewer is missing. Make sure js/case-viewer.js loads before shared.js.",
    );
  }

  const state = document.getElementById("shared-state");
  const stateTitle = document.getElementById("shared-state-title");
  const stateMessage = document.getElementById("shared-state-message");
  const content = document.getElementById("shared-content");

  const owner = document.getElementById("shared-owner");
  const title = document.getElementById("shared-title");
  const description = document.getElementById("shared-description");
  const count = document.getElementById("shared-count");

  const insightsGrid = document.getElementById("shared-insights-grid");
  const platformBreakdown = document.getElementById("shared-platforms");
  const genreBreakdown = document.getElementById("shared-genres");

  const searchInput = document.getElementById("shared-search");
  const platformFilter = document.getElementById("shared-platform-filter");
  const genreFilter = document.getElementById("shared-genre-filter");
  const sortSelect = document.getElementById("shared-sort");
  const resultsText = document.getElementById("shared-results");
  const grid = document.getElementById("shared-grid");
  const empty = document.getElementById("shared-empty");

  const pagination = document.getElementById("shared-pagination");
  const previousButton = document.getElementById("shared-previous");
  const nextButton = document.getElementById("shared-next");
  const pages = document.getElementById("shared-pages");

  const lightbox = document.getElementById("shared-lightbox");
  const lightboxClose = document.getElementById("shared-lightbox-close");
  const lightboxImage = document.getElementById("shared-lightbox-image");
  const lightboxCaption = document.getElementById("shared-lightbox-caption");

  const PAGE_SIZE = 12;

  let shareInfo = null;
  let items = [];
  let currentPage = 1;
  let renderSequence = 0;
  let shareToken = "";

  function showState(heading, message) {
    if (stateTitle) {
      stateTitle.textContent = heading;
    }

    if (stateMessage) {
      stateMessage.textContent = message;
    }

    if (state) {
      state.hidden = false;
    }

    if (content) {
      content.hidden = true;
    }
  }

  function showContent() {
    if (state) {
      state.hidden = true;
    }

    if (content) {
      content.hidden = false;
    }
  }

  function formatCurrency(value) {
    if (value === null || value === undefined || value === "") {
      return "N/D";
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "N/D";
    }

    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(number);
  }

  function formatDate(value) {
    if (!value) {
      return "N/D";
    }

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  }

  function getCaseRatio(game) {
    return formatLibrary.getCaseRatio({
      caseFormat: game?.case_format,
      role: "cover",
      customWidth: game?.custom_case_width,
      customHeight: game?.custom_case_height,
    });
  }

  function getCaseDisplayScale(game) {
    const referenceWidth = 142;
    const referenceHeight = 190;
    const caseFormat =
      formatLibrary.normalizeCaseFormat(game?.case_format) || "dvd";
    const definition =
      formatLibrary.CASE_FORMATS?.[caseFormat] ||
      formatLibrary.CASE_FORMATS?.dvd ||
      null;
    const physicalWidth = Number(definition?.coverWidthMm);
    const physicalHeight = Number(definition?.coverHeightMm);

    if (
      Number.isFinite(physicalWidth) &&
      Number.isFinite(physicalHeight) &&
      physicalWidth > 0 &&
      physicalHeight > 0
    ) {
      return {
        width: Math.min(1, physicalWidth / referenceWidth),
        height: Math.min(1, physicalHeight / referenceHeight),
      };
    }

    const ratio = getCaseRatio(game);
    const referenceRatio = referenceWidth / referenceHeight;

    if (!Number.isFinite(ratio) || ratio <= 0) {
      return { width: 135 / referenceWidth, height: 1 };
    }

    if (ratio >= referenceRatio) {
      return {
        width: 1,
        height: Math.min(1, referenceRatio / ratio),
      };
    }

    return {
      width: Math.min(1, ratio / referenceRatio),
      height: 1,
    };
  }

  function getMediaDefinition(item) {
    const game = item?.game;

    return formatLibrary.getMediaDefinition({
      mediaFormat: game?.media_format || "",
      platform: game?.platform || "",
      mediaType: game?.media_type || "",
    });
  }

  function getMediaDisplayScale(item) {
    const referenceWidth = 142;
    const referenceHeight = 190;
    const definition = getMediaDefinition(item);
    const mediaType = item?.game?.media_type || "";

    let physicalWidth = Number(definition?.widthMm);
    let physicalHeight = Number(definition?.heightMm);

    if (
      !Number.isFinite(physicalWidth) ||
      !Number.isFinite(physicalHeight) ||
      physicalWidth <= 0 ||
      physicalHeight <= 0
    ) {
      if (mediaType === "disc") {
        physicalWidth = 120;
        physicalHeight = 120;
      } else {
        physicalWidth = 70;
        physicalHeight = 90;
      }
    }

    return {
      width: Math.min(1, physicalWidth / referenceWidth),
      height: Math.min(1, physicalHeight / referenceHeight),
    };
  }

  function usesMediaAsPrimaryVisual(item) {
    const mediaType = item?.game?.media_type || "";

    if (mediaType !== "disc" && mediaType !== "cartridge") {
      return false;
    }

    const completeness = String(item?.completeness || "")
      .trim()
      .toLowerCase();

    return new Set([
      "disc only",
      "cartridge only",
      "missing case",
      "loose",
    ]).has(completeness);
  }

  function getPlatformShortLabel(platform) {
    const labels = {
      PlayStation: "PS1",
      "PlayStation 2": "PS2",
      "PlayStation 3": "PS3",
      "PlayStation 4": "PS4",
      "PlayStation 5": "PS5",
      Xbox: "XBOX",
      "Xbox 360": "X360",
      "Xbox One": "XB1",
      "Xbox Series X/S": "XSX",
      "Nintendo Entertainment System": "NES",
      "Super Nintendo": "SNES",
      "Nintendo 64": "N64",
      GameCube: "GC",
      Wii: "WII",
      "Wii U": "WII U",
      Switch: "NSW",
      "Game Boy": "GB",
      "Game Boy Color": "GBC",
      "Game Boy Advance": "GBA",
      "Nintendo DS": "DS",
      "Nintendo 3DS": "3DS",
      PSP: "PSP",
      "PS Vita": "VITA",
      PC: "PC",
    };

    if (labels[platform]) {
      return labels[platform];
    }

    const words = String(platform || "GAME")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    return words.length === 1
      ? words[0].slice(0, 6).toUpperCase()
      : words
          .map((word) => word[0])
          .join("")
          .slice(0, 5)
          .toUpperCase();
  }

  function chooseFrontImage(item) {
    return (item.images || []).find(
      (image) => image.image_type === "front" && image.signedUrl,
    );
  }

  function chooseMediaImage(item) {
    const role = item.game?.media_type === "cartridge" ? "cartridge" : "disc";

    return (item.images || [])
      .filter((image) => image.image_type === role && image.signedUrl)
      .sort((a, b) => {
        const discA = Number(a.disc_number) || 999;
        const discB = Number(b.disc_number) || 999;
        return discA - discB || (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);
      })[0];
  }

  function createCasePlaceholder(item) {
    const placeholder = document.createElement("div");
    placeholder.className = "game-case-placeholder";
    placeholder.setAttribute(
      "aria-label",
      shareInfo?.show_photos
        ? `${item.title}: no cover image`
        : `${item.title}: photographs hidden by the owner`,
    );

    const mark = document.createElement("span");
    mark.className = "game-case-placeholder-mark";
    mark.textContent = "S";

    const text = document.createElement("small");
    text.textContent = shareInfo?.show_photos ? "No cover image" : "Photos hidden";

    placeholder.append(mark, text);

    return placeholder;
  }

  function createMediaVisual(item, mediaImage) {
    const definition = getMediaDefinition(item);
    const mediaType = item.game?.media_type;
    const element = document.createElement("div");

    element.className = mediaType === "cartridge" ? "game-cartridge" : "game-disc";
    element.classList.add(`media-shape-${definition?.shape || (mediaType === "cartridge" ? "rounded" : "disc")}`);
    element.style.aspectRatio = String(definition?.ratio || (mediaType === "cartridge" ? 0.78 : 1));
    element.dataset.rotates = definition?.rotates ? "true" : "false";

    if (mediaImage?.signedUrl) {
      const image = document.createElement("img");
      element.classList.add("has-real-media");
      image.src = mediaImage.signedUrl;
      image.alt = "";
      image.loading = "lazy";
      image.decoding = "async";
      element.appendChild(image);
      return element;
    }

    element.classList.add("game-media-placeholder");

    if (mediaType === "disc") {
      const hole = document.createElement("div");
      hole.className = "disc-hole";
      element.appendChild(hole);
    }

    const label = document.createElement("span");
    label.textContent = getPlatformShortLabel(item.game?.platform);
    element.appendChild(label);

    return element;
  }

  const discStates = new Map();
  const DISC_SPEED = 144;

  function cleanupDiscStates() {
    discStates.forEach((state) => {
      state.spinning = false;

      if (state.frame) {
        cancelAnimationFrame(state.frame);
      }

      if (state.stopTimer) {
        clearTimeout(state.stopTimer);
      }
    });

    discStates.clear();
  }

  function startDiscSpin(card) {
    const state = discStates.get(card);

    if (!state || state.spinning) {
      return;
    }

    state.spinning = true;
    let lastTime = performance.now();

    function spin(currentTime) {
      if (!state.spinning) {
        return;
      }

      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      state.angle = (state.angle + DISC_SPEED * (deltaTime / 1000)) % 360;
      state.image.style.transform = `rotate(${state.angle}deg)`;
      state.frame = requestAnimationFrame(spin);
    }

    state.frame = requestAnimationFrame(spin);
  }

  function stopDiscSpin(card) {
    const state = discStates.get(card);

    if (!state) {
      return;
    }

    state.spinning = false;

    if (state.frame) {
      cancelAnimationFrame(state.frame);
      state.frame = null;
    }
  }

  function setupDiscStates() {
    grid?.querySelectorAll(".game-card").forEach((card) => {
      const disc = card.querySelector(".game-disc");
      const discImage = disc?.querySelector("img");

      if (
        card.classList.contains("media-primary") ||
        !disc ||
        !discImage ||
        disc.dataset.rotates === "false"
      ) {
        return;
      }

      const state = {
        image: discImage,
        angle: 0,
        spinning: false,
        frame: null,
        stopTimer: null,
      };

      discStates.set(card, state);

      card.addEventListener("mouseenter", () => {
        if (state.stopTimer) {
          clearTimeout(state.stopTimer);
          state.stopTimer = null;
        }

        startDiscSpin(card);
      });

      card.addEventListener("mouseleave", () => {
        if (state.stopTimer) {
          clearTimeout(state.stopTimer);
        }

        state.stopTimer = setTimeout(() => {
          stopDiscSpin(card);
          state.stopTimer = null;
        }, 500);
      });
    });
  }

  async function signImagesForItems(targetItems, full = false) {
    if (!shareInfo?.show_photos || !shareToken || !targetItems?.length) {
      return;
    }

    const targetLevel = full ? 2 : 1;
    const pending = targetItems.filter(
      (item) => Number(item._imageLoadLevel || 0) < targetLevel,
    );

    if (!pending.length) {
      return;
    }

    const itemIds = pending
      .map((item) => item.item_ref)
      .filter(Boolean);

    if (!itemIds.length) {
      return;
    }

    const { data, error } = await supabaseClient.functions.invoke(
      "shared-collection",
      {
        body: {
          token: shareToken,
          action: "images",
          item_ids: itemIds,
          full,
        },
      },
    );

    if (error) {
      throw error;
    }

    const grouped = new Map();

    (data?.images || []).forEach((image) => {
      if (!grouped.has(image.item_ref)) {
        grouped.set(image.item_ref, []);
      }

      grouped.get(image.item_ref).push({
        image_type: image.image_type,
        disc_number: image.disc_number,
        sort_order: image.sort_order,
        signedUrl: image.signedUrl,
      });
    });

    pending.forEach((item) => {
      item.images = grouped.get(item.item_ref) || [];
      item._imageLoadLevel = targetLevel;
    });
  }

  function addDetailRow(container, label, value) {
    if (value === null || value === undefined || value === "") {
      return;
    }

    const row = document.createElement("div");
    row.className = "shared-detail-row";

    const term = document.createElement("span");
    term.textContent = label;

    const result = document.createElement("span");
    result.textContent = value;

    row.append(term, result);
    container.appendChild(row);
  }

  function getImageLabel(image) {
    if (image.image_type === "disc") {
      return image.disc_number ? `Disc ${image.disc_number}` : "Disc";
    }

    const labels = {
      front: "Front",
      back: "Back",
      side: "Spine",
      manual: "Manual",
      cartridge: "Cartridge",
    };

    return labels[image.image_type] || image.image_type;
  }

  function openLightbox(image, item) {
    if (!image?.signedUrl || !lightbox || !lightboxImage) {
      return;
    }

    lightboxImage.src = image.signedUrl;
    lightboxImage.alt = `${item.title} — ${getImageLabel(image)}`;

    if (lightboxCaption) {
      lightboxCaption.textContent = `${item.title} · ${getImageLabel(image)}`;
    }

    lightbox.classList.add("visible");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lightbox) {
      return;
    }

    lightbox.classList.remove("visible");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    if (lightboxImage) {
      lightboxImage.removeAttribute("src");
    }
  }

  async function renderPhotoStrip(item, container) {
    if (!container || container.dataset.loaded === "true") {
      return;
    }

    await signImagesForItems([item], true);
    container.innerHTML = "";

    const availableImages = (item.images || []).filter((image) => image.signedUrl);

    if (availableImages.length === 0) {
      container.hidden = true;
      container.dataset.loaded = "true";
      return;
    }

    availableImages.forEach((image) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "shared-photo-button";

      const photo = document.createElement("img");
      photo.src = image.signedUrl;
      photo.alt = `${item.title} ${getImageLabel(image)}`;
      photo.loading = "lazy";
      photo.decoding = "async";

      const label = document.createElement("span");
      label.className = "shared-photo-label";
      label.textContent = getImageLabel(image);

      button.append(photo, label);
      button.addEventListener("click", () => openLightbox(image, item));
      container.appendChild(button);
    });

    container.dataset.loaded = "true";
  }

  function canViewPhysicalViewer(item) {
    const game = item?.game;

    if (!game) {
      return false;
    }

    const hasCase = Boolean(
      formatLibrary.normalizeCaseFormat(game.case_format),
    );

    const hasMedia =
      game.media_type === "disc" || game.media_type === "cartridge";

    return hasCase || hasMedia;
  }

  function createCard(item) {
    const game = item.game || {};
    const frontImage = chooseFrontImage(item);
    const mediaPrimary = usesMediaAsPrimaryVisual(item);
    const mediaImage =
      appSettings?.isDataSaver?.() && !mediaPrimary
        ? null
        : chooseMediaImage(item);

    const card = document.createElement("article");
    card.className = "game-card";

    if (mediaPrimary) {
      card.classList.add("media-primary");
    }

    const body = document.createElement("div");
    body.className = "game-card-link";

    const visual = document.createElement("div");
    visual.className = "game-card-visual";

    const caseScale = getCaseDisplayScale(game);
    const mediaScale = getMediaDisplayScale(item);

    visual.style.setProperty("--case-width-scale", String(caseScale.width));
    visual.style.setProperty("--case-height-scale", String(caseScale.height));
    visual.style.setProperty("--media-width-scale", String(mediaScale.width));
    visual.style.setProperty("--media-height-scale", String(mediaScale.height));

    if (!mediaPrimary) {
      const gameCase = document.createElement("div");
      gameCase.className = "game-case";

      if (frontImage?.signedUrl) {
        const image = document.createElement("img");
        image.src = frontImage.signedUrl;
        image.alt = `${item.title} front cover`;
        image.loading = "lazy";
        image.decoding = "async";
        gameCase.appendChild(image);
      } else {
        gameCase.appendChild(createCasePlaceholder(item));
      }

      visual.appendChild(gameCase);
    }

    if (game.media_type === "disc" || game.media_type === "cartridge") {
      visual.appendChild(createMediaVisual(item, mediaImage));
    }

    const info = document.createElement("div");
    info.className = "game-card-info";

    const infoMain = document.createElement("div");
    const gameTitle = document.createElement("h2");
    gameTitle.textContent = item.title || "Untitled game";

    const subline = document.createElement("p");
    subline.textContent = [game.platform, game.release_year]
      .filter(Boolean)
      .join(" · ") || "Game details unavailable";

    const listMeta = document.createElement("p");
    listMeta.className = "game-card-list-meta";
    listMeta.textContent = [
      game.genre,
      game.edition && game.edition !== "Standard Edition" ? game.edition : null,
    ]
      .filter(Boolean)
      .join(" · ") || "No additional details";

    infoMain.append(gameTitle, subline, listMeta);

    const condition = document.createElement("span");
    condition.className = "game-condition";
    condition.textContent = item.condition || item.completeness || "N/D";

    info.append(infoMain, condition);
    body.append(visual, info);

    const details = document.createElement("details");
    details.className = "shared-card-details";

    const summary = document.createElement("summary");
    summary.textContent = "View details";

    const detailList = document.createElement("div");
    detailList.className = "shared-detail-list";

    addDetailRow(detailList, "Edition", game.edition);
    addDetailRow(detailList, "Genre", game.genre);
    addDetailRow(detailList, "Developer", game.developer);
    addDetailRow(detailList, "Publisher", game.publisher);
    addDetailRow(detailList, "Region", item.region);
    addDetailRow(detailList, "Country", item.country);
    addDetailRow(detailList, "Condition", item.condition);
    addDetailRow(detailList, "Completeness", item.completeness);
    addDetailRow(
      detailList,
      "Purchase date",
      item.purchase_date ? formatDate(item.purchase_date) : null,
    );
    addDetailRow(
      detailList,
      "Purchase price",
      item.purchase_price !== null ? formatCurrency(item.purchase_price) : null,
    );
    addDetailRow(
      detailList,
      "Estimated value",
      item.estimated_value !== null ? formatCurrency(item.estimated_value) : null,
    );
    addDetailRow(
      detailList,
      "Value difference",
      item.value_difference !== null ? formatCurrency(item.value_difference) : null,
    );

    const photos = document.createElement("div");
    photos.className = "shared-photo-strip";
    photos.hidden = !shareInfo?.show_photos;

    details.append(summary, detailList, photos);

    details.addEventListener("toggle", () => {
      summary.textContent = details.open ? "Hide details" : "View details";

      if (details.open && shareInfo?.show_photos) {
        renderPhotoStrip(item, photos);
      }
    });

    body.appendChild(details);
    card.appendChild(body);

    if (canViewPhysicalViewer(item)) {
      const physicalViewButton = document.createElement("button");
      physicalViewButton.type = "button";
      physicalViewButton.className = "game-case-view-button";
      physicalViewButton.title = "View physical copy in 3D";
      physicalViewButton.setAttribute(
        "aria-label",
        `View ${item.title || "game"} physical copy in 3D`,
      );
      physicalViewButton.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"></path>
          <circle cx="12" cy="12" r="2.75"></circle>
        </svg>
      `;

      physicalViewButton.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (physicalViewButton.disabled) {
          return;
        }

        physicalViewButton.disabled = true;
        physicalViewButton.classList.add("is-loading");

        try {
          await signImagesForItems([item], true);
          caseViewer.open(item, { trigger: physicalViewButton });
        } catch (error) {
          console.error("Shelfmark shared physical viewer image load error:", error);
          window.alert("Shelfmark could not load the full-resolution shared images. Please try again.");
        } finally {
          physicalViewButton.disabled = false;
          physicalViewButton.classList.remove("is-loading");
        }
      });

      card.appendChild(physicalViewButton);
    }

    return card;
  }

  function getBreakdown(values) {
    const counts = new Map();

    values.filter(Boolean).forEach((value) => {
      counts.set(value, (counts.get(value) || 0) + 1);
    });

    return [...counts.entries()]
      .map(([label, amount]) => ({ label, amount }))
      .sort((a, b) => b.amount - a.amount || a.label.localeCompare(b.label))
      .slice(0, 6);
  }

  function renderBreakdown(container, entries) {
    if (!container) {
      return;
    }

    container.innerHTML = "";

    entries.forEach((entry) => {
      const row = document.createElement("div");
      row.className = "shared-breakdown-row";

      const label = document.createElement("span");
      label.textContent = entry.label;

      const amount = document.createElement("strong");
      amount.textContent = String(entry.amount);

      row.append(label, amount);
      container.appendChild(row);
    });
  }

  function addInsight(label, value) {
    const tile = document.createElement("div");
    tile.className = "shared-insight";

    const name = document.createElement("span");
    name.textContent = label;

    const result = document.createElement("strong");
    result.textContent = value;

    tile.append(name, result);
    insightsGrid.appendChild(tile);
  }

  function renderInsights() {
    if (!insightsGrid) {
      return;
    }

    insightsGrid.innerHTML = "";
    addInsight("Games", String(items.length));

    if (shareInfo?.show_purchase_price) {
      const priced = items.filter((item) => item.purchase_price !== null);
      const total = priced.reduce((sum, item) => sum + Number(item.purchase_price || 0), 0);
      addInsight("Total spent", priced.length ? formatCurrency(total) : "N/D");
    }

    if (shareInfo?.show_estimated_value) {
      const valued = items.filter((item) => item.estimated_value !== null);
      const total = valued.reduce((sum, item) => sum + Number(item.estimated_value || 0), 0);
      addInsight("Estimated value", valued.length ? formatCurrency(total) : "N/D");
    }

    if (shareInfo?.show_value_difference) {
      const comparable = items.filter((item) => item.value_difference !== null);
      const total = comparable.reduce((sum, item) => sum + Number(item.value_difference || 0), 0);
      addInsight("Value difference", comparable.length ? formatCurrency(total) : "N/D");
    }

    renderBreakdown(
      platformBreakdown,
      getBreakdown(items.map((item) => item.game?.platform)),
    );

    renderBreakdown(
      genreBreakdown,
      getBreakdown(items.map((item) => item.game?.genre)),
    );
  }

  function populateFilter(select, values, allLabel) {
    if (!select) {
      return;
    }

    select.innerHTML = "";

    const all = document.createElement("option");
    all.value = "all";
    all.textContent = allLabel;
    select.appendChild(all);

    [...new Set(values.filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
      .forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
      });
  }

  function getFilteredItems() {
    const search = searchInput?.value.trim().toLowerCase() || "";
    const platform = platformFilter?.value || "all";
    const genre = genreFilter?.value || "all";

    const filtered = items.filter((item) => {
      const haystack = [
        item.title,
        item.game?.platform,
        item.game?.genre,
        item.game?.edition,
        item.game?.developer,
        item.game?.publisher,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        haystack.includes(search) &&
        (platform === "all" || item.game?.platform === platform) &&
        (genre === "all" || item.game?.genre === genre)
      );
    });

    const sort = sortSelect?.value || "title";

    filtered.sort((a, b) => {
      if (sort === "year-new") {
        return (Number(b.game?.release_year) || 0) - (Number(a.game?.release_year) || 0);
      }

      if (sort === "year-old") {
        const yearA = Number(a.game?.release_year) || Number.MAX_SAFE_INTEGER;
        const yearB = Number(b.game?.release_year) || Number.MAX_SAFE_INTEGER;
        return yearA - yearB;
      }

      return String(a.title || "").localeCompare(String(b.title || ""));
    });

    return filtered;
  }

  function renderPagination(totalPages) {
    if (!pagination || !pages || !previousButton || !nextButton) {
      return;
    }

    pagination.hidden = totalPages <= 1;
    previousButton.disabled = currentPage <= 1;
    nextButton.disabled = currentPage >= totalPages;
    pages.innerHTML = "";

    for (let page = 1; page <= totalPages; page += 1) {
      if (
        totalPages > 7 &&
        page !== 1 &&
        page !== totalPages &&
        Math.abs(page - currentPage) > 1
      ) {
        if (page === 2 || page === totalPages - 1) {
          const dots = document.createElement("span");
          dots.className = "pagination-ellipsis";
          dots.textContent = "…";
          pages.appendChild(dots);
        }
        continue;
      }

      const button = document.createElement("button");
      button.type = "button";
      button.className = "pagination-page";
      button.textContent = String(page);
      button.classList.toggle("active", page === currentPage);
      button.setAttribute("aria-current", page === currentPage ? "page" : "false");
      button.addEventListener("click", () => {
        currentPage = page;
        render();
        document.querySelector(".shared-controls")?.scrollIntoView({
          behavior:
            window.ShelfmarkSettings?.getEffectiveMotion?.() === "full"
              ? "smooth"
              : "auto",
          block: "start",
        });
      });
      pages.appendChild(button);
    }
  }

  async function render() {
    const sequence = ++renderSequence;
    const filtered = getFilteredItems();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

    currentPage = Math.min(Math.max(currentPage, 1), totalPages);

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);

    await signImagesForItems(pageItems, false);

    if (sequence !== renderSequence) {
      return;
    }

    cleanupDiscStates();
    grid.innerHTML = "";
    const fragment = document.createDocumentFragment();

    pageItems.forEach((item) => fragment.appendChild(createCard(item)));
    grid.appendChild(fragment);
    setupDiscStates();

    if (resultsText) {
      resultsText.textContent = filtered.length
        ? `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, filtered.length)} of ${filtered.length} ${filtered.length === 1 ? "game" : "games"}`
        : "No matching games";
    }

    if (empty) {
      empty.hidden = filtered.length !== 0;
    }

    renderPagination(totalPages);
  }

  async function loadSharedCollection() {
    if (!supabaseClient || !formatLibrary) {
      showState(
        "Collection unavailable",
        "Shelfmark could not initialize this shared collection.",
      );
      return;
    }

    const token = new URLSearchParams(window.location.search).get("t") || "";
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(token)) {
      showState(
        "This share link is unavailable.",
        "The link may be incomplete, disabled or no longer valid.",
      );
      return;
    }

    shareToken = token;

    try {
      const { data, error } = await supabaseClient.functions.invoke(
        "shared-collection",
        {
          body: { token },
        },
      );

      if (error) {
        throw error;
      }

      if (!data?.share || !Array.isArray(data?.items)) {
        showState(
          "This share link is unavailable.",
          "The owner may have disabled sharing or generated a new link.",
        );
        return;
      }

      shareInfo = data.share;
      items = data.items.map((item) => ({
        ...item,
        images: Array.isArray(item.images) ? item.images : [],
        _imageLoadLevel: 0,
      }));

      document.title = `${shareInfo.name || "Shared Collection"} - Shelfmark`;

      if (owner) {
        owner.textContent = `Shared by ${shareInfo.owner_username || "Shelfmark collector"}`;
      }

      if (title) {
        title.textContent = shareInfo.name || "Collection";
      }

      if (description) {
        const value = String(shareInfo.description || "").trim();
        description.textContent = value;
        description.hidden = !value;
      }

      if (count) {
        count.textContent = `${items.length} ${items.length === 1 ? "game" : "games"}`;
      }

      populateFilter(
        platformFilter,
        items.map((item) => item.game?.platform),
        "All platforms",
      );
      populateFilter(
        genreFilter,
        items.map((item) => item.game?.genre),
        "All genres",
      );

      renderInsights();
      showContent();
      await render();
    } catch (error) {
      console.error("Shelfmark shared collection error:", error);
      showState(
        "Collection unavailable",
        "Shelfmark could not load this shared collection. Please try again later.",
      );
    }
  }

  [searchInput, platformFilter, genreFilter, sortSelect].forEach((control) => {
    control?.addEventListener(control === searchInput ? "input" : "change", () => {
      currentPage = 1;
      render();
    });
  });

  previousButton?.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage -= 1;
      render();
    }
  });

  nextButton?.addEventListener("click", () => {
    currentPage += 1;
    render();
  });

  lightboxClose?.addEventListener("click", closeLightbox);
  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox?.classList.contains("visible")) {
      closeLightbox();
    }
  });

  loadSharedCollection();
});
