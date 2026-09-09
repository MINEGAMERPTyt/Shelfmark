document.addEventListener("DOMContentLoaded", () => {
  /* ========================================
     Shelfmark
     Dynamic Collection
  ======================================== */

  const supabaseClient = window.shelfmarkSupabase;

  const searchInput = document.getElementById("game-search");

  const platformFilter = document.getElementById("platform-filter");

  const genreFilter = document.getElementById("genre-filter");

  const sortSelect = document.getElementById("sort-games");

  const pageSizeSelect = document.getElementById("games-per-page");

  const viewButtons = document.querySelectorAll("[data-collection-view]");

  const collectionResults = document.getElementById("collection-results");

  const collectionRange = document.getElementById("collection-range");

  const collectionPagination = document.getElementById("collection-pagination");

  const paginationPages = document.getElementById("pagination-pages");

  const paginationPrevious = document.getElementById("pagination-previous");

  const paginationNext = document.getElementById("pagination-next");

  const collectionGrid = document.getElementById("collection-grid");

  const collectionCount = document.getElementById("collection-count");

  const collectionState = document.getElementById("collection-state");

  const collectionStateTitle = document.getElementById(
    "collection-state-title",
  );

  const collectionStateMessage = document.getElementById(
    "collection-state-message",
  );

  const collectionRetry = document.getElementById("collection-retry");

  const emptyState = document.getElementById("collection-empty");

  const emptyTitle = document.getElementById("collection-empty-title");

  const emptyMessage = document.getElementById("collection-empty-message");

  const emptyAddButton = document.getElementById("collection-empty-add");

  let collectionRecords = [];
  let gameCards = [];

  let currentPage = 1;
  let currentUserId = null;
  let currentView = "grid";

  const DEFAULT_PAGE_SIZE = "12";

  const ALLOWED_PAGE_SIZES = new Set(["12", "24", "48", "all"]);

  const DEFAULT_VIEW = "grid";

  const ALLOWED_VIEWS = new Set(["grid", "list"]);

  /* ========================================
   Collection Preferences
======================================== */

  function getPreferenceKey(name) {
    if (!currentUserId) {
      return null;
    }

    return `shelfmark.collection.${currentUserId}.${name}`;
  }

  function selectHasValue(select, value) {
    if (!select) {
      return false;
    }

    return Array.from(select.options).some((option) => option.value === value);
  }

  function applyCollectionView(view) {
    currentView = ALLOWED_VIEWS.has(view) ? view : DEFAULT_VIEW;

    if (collectionGrid) {
      collectionGrid.classList.toggle("list-view", currentView === "list");
    }

    viewButtons.forEach((button) => {
      const isActive = button.dataset.collectionView === currentView;

      button.classList.toggle("active", isActive);

      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function restoreCollectionPreferences() {
    if (!currentUserId) {
      return;
    }

    /* ---------- Page size ---------- */

    const storedPageSize = localStorage.getItem(getPreferenceKey("pageSize"));

    if (pageSizeSelect && ALLOWED_PAGE_SIZES.has(storedPageSize)) {
      pageSizeSelect.value = storedPageSize;
    } else if (pageSizeSelect) {
      pageSizeSelect.value = DEFAULT_PAGE_SIZE;
    }

    /* ---------- View ---------- */

    const storedView = localStorage.getItem(getPreferenceKey("view"));

    if (storedView && ALLOWED_VIEWS.has(storedView)) {
      applyCollectionView(storedView);
    } else {
      applyCollectionView(DEFAULT_VIEW);
    }

    /* ---------- Sort ---------- */

    const storedSort = localStorage.getItem(getPreferenceKey("sort"));

    if (sortSelect && selectHasValue(sortSelect, storedSort)) {
      sortSelect.value = storedSort;
    }

    /* ---------- Platform ---------- */

    const storedPlatform = localStorage.getItem(getPreferenceKey("platform"));

    if (platformFilter && selectHasValue(platformFilter, storedPlatform)) {
      platformFilter.value = storedPlatform;
    }

    /* ---------- Genre ---------- */

    const storedGenre = localStorage.getItem(getPreferenceKey("genre"));

    if (genreFilter && selectHasValue(genreFilter, storedGenre)) {
      genreFilter.value = storedGenre;
    }

    /* ---------- Search ---------- */

    const storedSearch = sessionStorage.getItem(getPreferenceKey("search"));

    if (searchInput && storedSearch !== null) {
      searchInput.value = storedSearch;
    }

    /* ---------- Page ---------- */

    const storedPage = Number(sessionStorage.getItem(getPreferenceKey("page")));

    if (Number.isInteger(storedPage) && storedPage > 0) {
      currentPage = storedPage;
    } else {
      currentPage = 1;
    }
  }

  function saveCollectionPreferences() {
    if (!currentUserId) {
      return;
    }

    if (pageSizeSelect) {
      localStorage.setItem(getPreferenceKey("pageSize"), pageSizeSelect.value);
    }

    localStorage.setItem(getPreferenceKey("view"), currentView);

    if (sortSelect) {
      localStorage.setItem(getPreferenceKey("sort"), sortSelect.value);
    }

    if (platformFilter) {
      localStorage.setItem(getPreferenceKey("platform"), platformFilter.value);
    }

    if (genreFilter) {
      localStorage.setItem(getPreferenceKey("genre"), genreFilter.value);
    }

    if (searchInput) {
      sessionStorage.setItem(getPreferenceKey("search"), searchInput.value);
    }

    sessionStorage.setItem(getPreferenceKey("page"), String(currentPage));
  }

  function saveCollectionPosition() {
    if (!currentUserId) {
      return;
    }

    saveCollectionPreferences();

    sessionStorage.setItem(getPreferenceKey("scrollY"), String(window.scrollY));

    sessionStorage.setItem(getPreferenceKey("restoreScroll"), "true");
  }

  function restoreCollectionPosition() {
    if (!currentUserId) {
      return;
    }

    const shouldRestore =
      sessionStorage.getItem(getPreferenceKey("restoreScroll")) === "true";

    if (!shouldRestore) {
      return;
    }

    const scrollY = Number(sessionStorage.getItem(getPreferenceKey("scrollY")));

    sessionStorage.removeItem(getPreferenceKey("restoreScroll"));

    sessionStorage.removeItem(getPreferenceKey("scrollY"));

    if (!Number.isFinite(scrollY)) {
      return;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({
          top: scrollY,
          left: 0,
          behavior: "auto",
        });
      });
    });
  }

  /* ========================================
     Page State
  ======================================== */

  function setControlsDisabled(disabled) {
    [
      searchInput,
      platformFilter,
      genreFilter,
      sortSelect,
      pageSizeSelect,
    ].forEach((control) => {
      if (control) {
        control.disabled = disabled;
      }
    });

    viewButtons.forEach((button) => {
      button.disabled = disabled;
    });
  }

  function showCollectionState(title, message, { error = false } = {}) {
    if (!collectionState) {
      return;
    }

    collectionState.hidden = false;

    collectionState.classList.toggle("error", error);

    if (collectionStateTitle) {
      collectionStateTitle.textContent = title;
    }

    if (collectionStateMessage) {
      collectionStateMessage.textContent = message;
    }

    if (collectionRetry) {
      collectionRetry.hidden = !error;
    }
  }

  function hideCollectionState() {
    if (collectionState) {
      collectionState.hidden = true;

      collectionState.classList.remove("error");
    }

    if (collectionRetry) {
      collectionRetry.hidden = true;
    }
  }

  function setCollectionCount(matchingCount = collectionRecords.length) {
    if (!collectionCount) {
      return;
    }

    const total = collectionRecords.length;

    if (total === 0) {
      collectionCount.textContent = "0 games in your collection";

      return;
    }

    if (matchingCount !== total) {
      collectionCount.textContent = `${matchingCount} of ${total} games`;

      return;
    }

    collectionCount.textContent = `${total} ${
      total === 1 ? "game" : "games"
    } in your collection`;
  }

  function updateEmptyState(visibleCount) {
    if (!emptyState) {
      return;
    }

    const total = collectionRecords.length;

    const shouldShow = visibleCount === 0;

    emptyState.classList.toggle("visible", shouldShow);

    if (!shouldShow) {
      return;
    }

    /* ====================================
       COMPLETELY EMPTY COLLECTION
    ==================================== */

    if (total === 0) {
      if (emptyTitle) {
        emptyTitle.textContent = "Your collection is empty.";
      }

      if (emptyMessage) {
        emptyMessage.textContent =
          "Add your first physical game to start building your Shelfmark archive.";
      }

      if (emptyAddButton) {
        emptyAddButton.hidden = false;
      }

      return;
    }

    /* ====================================
       FILTERS RETURNED NOTHING
    ==================================== */

    if (emptyTitle) {
      emptyTitle.textContent = "No games found.";
    }

    if (emptyMessage) {
      emptyMessage.textContent =
        "No games match your current search or filters.";
    }

    if (emptyAddButton) {
      emptyAddButton.hidden = true;
    }
  }

  /* ========================================
     Data Helpers
  ======================================== */

  function getCaseRatio(game) {
    const ratios = {
      dvd: 135 / 190,

      "blu-ray": 135 / 171.5,

      ps1: 125 / 142,

      gamecube: 107 / 149,

      psp: 99 / 168,

      vita: 105 / 135,

      ds: 122 / 135,

      switch: 104 / 170,
    };

    if (game?.case_format === "custom") {
      const width = Number(game.custom_case_width);

      const height = Number(game.custom_case_height);

      if (
        Number.isFinite(width) &&
        Number.isFinite(height) &&
        width > 0 &&
        height > 0
      ) {
        return width / height;
      }
    }

    return ratios[game?.case_format] || 0.76;
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

    if (words.length === 1) {
      return words[0].slice(0, 6).toUpperCase();
    }

    return words
      .map((word) => word[0])
      .join("")
      .slice(0, 5)
      .toUpperCase();
  }

  function getSubline(game) {
    const parts = [];

    if (game?.platform) {
      parts.push(game.platform);
    }

    if (game?.release_year) {
      parts.push(String(game.release_year));
    }

    return parts.join(" · ") || "Game details unavailable";
  }

  function chooseFrontImage(images) {
    return images.find(
      (image) => image.image_type === "front" && image.signedUrl,
    );
  }

  function chooseMediaImage(images, mediaType) {
    /* ====================================
       CARTRIDGE
    ==================================== */

    if (mediaType === "cartridge") {
      return images.find(
        (image) => image.image_type === "cartridge" && image.signedUrl,
      );
    }

    /* ====================================
       DISC

       For multi-disc games, use the first
       photographed disc on the card.
    ==================================== */

    if (mediaType === "disc") {
      return [...images]
        .filter((image) => image.image_type === "disc" && image.signedUrl)
        .sort((a, b) => {
          const discA = Number(a.disc_number) || 999;

          const discB = Number(b.disc_number) || 999;

          if (discA !== discB) {
            return discA - discB;
          }

          return (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);
        })[0];
    }

    return null;
  }

  /* ========================================
     Signed Image URLs
  ======================================== */

  async function addSignedUrls(images) {
    if (!images.length || !supabaseClient) {
      return images;
    }

    const paths = [
      ...new Set(images.map((image) => image.storage_path).filter(Boolean)),
    ];

    if (!paths.length) {
      return images;
    }

    const { data, error } = await supabaseClient.storage
      .from("item-images")
      .createSignedUrls(paths, 3600);

    if (error) {
      console.warn("Shelfmark collection signed URL error:", error);

      return images.map((image) => ({
        ...image,

        signedUrl: null,
      }));
    }

    const signedUrlByPath = new Map();

    (data || []).forEach((entry, index) => {
      const path = entry?.path || paths[index];

      const signedUrl = entry?.signedUrl || entry?.signedURL || null;

      if (path) {
        signedUrlByPath.set(path, signedUrl);
      }
    });

    return images.map((image) => ({
      ...image,

      signedUrl: signedUrlByPath.get(image.storage_path) || null,
    }));
  }

  /* ========================================
     Filter Options
  ======================================== */

  function populateSelect(select, values, allLabel) {
    if (!select) {
      return;
    }

    const previousValue = select.value;

    select.innerHTML = "";

    const allOption = document.createElement("option");

    allOption.value = "all";

    allOption.textContent = allLabel;

    select.appendChild(allOption);

    values.forEach((value) => {
      const option = document.createElement("option");

      option.value = value;

      option.textContent = value;

      select.appendChild(option);
    });

    if (values.includes(previousValue)) {
      select.value = previousValue;
    } else {
      select.value = "all";
    }
  }

  function populateFilters() {
    const platforms = [
      ...new Set(
        collectionRecords
          .map((record) => record.game?.platform)
          .filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b));

    const genres = [
      ...new Set(
        collectionRecords.map((record) => record.game?.genre).filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b));

    populateSelect(platformFilter, platforms, "All platforms");

    populateSelect(genreFilter, genres, "All genres");
  }

  /* ========================================
     Card Creation
  ======================================== */

  function createCasePlaceholder(title) {
    const placeholder = document.createElement("div");

    placeholder.className = "game-case-placeholder";

    const mark = document.createElement("span");

    mark.className = "game-case-placeholder-mark";

    mark.textContent = "S";

    const text = document.createElement("small");

    text.textContent = "No cover image";

    placeholder.append(mark, text);

    placeholder.setAttribute("aria-label", `${title}: no cover image`);

    return placeholder;
  }

  function createDiscVisual(record, mediaImage) {
    const disc = document.createElement("div");

    disc.className = "game-disc";

    /* ====================================
       REAL DISC PHOTO
    ==================================== */

    if (mediaImage?.signedUrl) {
      const image = document.createElement("img");

      image.src = mediaImage.signedUrl;

      image.alt = "";

      image.loading = "lazy";

      image.decoding = "async";

      disc.appendChild(image);

      return disc;
    }

    /* ====================================
       GENERIC DISC PLACEHOLDER
    ==================================== */

    disc.classList.add("game-media-placeholder");

    const hole = document.createElement("div");

    hole.className = "disc-hole";

    const label = document.createElement("span");

    label.textContent = getPlatformShortLabel(record.game?.platform);

    disc.append(hole, label);

    return disc;
  }

  function createCartridgeVisual(record, mediaImage) {
    const cartridge = document.createElement("div");

    cartridge.className = "game-cartridge";

    /* ====================================
       REAL CARTRIDGE PHOTO
    ==================================== */

    if (mediaImage?.signedUrl) {
      const image = document.createElement("img");

      image.src = mediaImage.signedUrl;

      image.alt = "";

      image.loading = "lazy";

      image.decoding = "async";

      cartridge.appendChild(image);

      return cartridge;
    }

    /* ====================================
       GENERIC CARTRIDGE PLACEHOLDER
    ==================================== */

    cartridge.classList.add("game-media-placeholder");

    const label = document.createElement("span");

    label.textContent = getPlatformShortLabel(record.game?.platform);

    cartridge.appendChild(label);

    return cartridge;
  }

  function createGameCard(record) {
    const { item, game, images } = record;

    const frontImage = chooseFrontImage(images);

    const mediaImage = chooseMediaImage(images, game?.media_type);

    /* ====================================
       ARTICLE
    ==================================== */

    const card = document.createElement("article");

    card.className = "game-card";

    card.dataset.title = item.title || "";

    card.dataset.platform = game?.platform || "";

    card.dataset.genre = game?.genre || "";

    card.dataset.year = game?.release_year || "";

    card.dataset.createdAt = item.created_at || "";

    card.dataset.purchasePrice =
      item.purchase_price === null || item.purchase_price === undefined
        ? ""
        : String(item.purchase_price);

    card.dataset.search = [
      item.title,
      game?.platform,
      game?.genre,
      game?.edition,
      game?.developer,
      game?.publisher,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    /* ====================================
       LINK
    ==================================== */

    const link = document.createElement("a");

    link.className = "game-card-link";

    link.href = `game.html?id=${encodeURIComponent(item.id)}`;

    /* ====================================
       VISUAL
    ==================================== */

    const visual = document.createElement("div");

    visual.className = "game-card-visual";

    visual.style.setProperty("--case-ratio", String(getCaseRatio(game)));

    /* ====================================
       CASE
    ==================================== */

    const gameCase = document.createElement("div");

    gameCase.className = "game-case";

    if (frontImage?.signedUrl) {
      const coverImage = document.createElement("img");

      coverImage.src = frontImage.signedUrl;

      coverImage.alt = `${item.title} front cover`;

      coverImage.loading = "lazy";

      coverImage.decoding = "async";

      gameCase.appendChild(coverImage);
    } else {
      gameCase.appendChild(createCasePlaceholder(item.title));
    }

    visual.appendChild(gameCase);

    /* ====================================
       MEDIA
    ==================================== */

    if (game?.media_type === "disc") {
      visual.appendChild(createDiscVisual(record, mediaImage));
    } else if (game?.media_type === "cartridge") {
      visual.appendChild(createCartridgeVisual(record, mediaImage));
    }

    /* ====================================
       INFORMATION
    ==================================== */

    const info = document.createElement("div");

    info.className = "game-card-info";

    const infoMain = document.createElement("div");

    const title = document.createElement("h2");

    title.textContent = item.title || "Untitled game";

    const subline = document.createElement("p");

    subline.textContent = getSubline(game);

    /* ---------- List metadata ---------- */

    const listMeta = document.createElement("p");

    listMeta.className = "game-card-list-meta";

    const listMetaParts = [
      game?.genre,
      game?.edition && game.edition !== "Standard Edition"
        ? game.edition
        : null,
    ].filter(Boolean);

    listMeta.textContent = listMetaParts.join(" · ");

    if (!listMeta.textContent) {
      listMeta.textContent = "No additional details";
    }

    infoMain.append(title, subline, listMeta);

    const condition = document.createElement("span");

    condition.className = "game-condition";

    condition.textContent = item.condition || item.completeness || "N/D";

    info.append(infoMain, condition);

    /* ====================================
   LIST PRICE
==================================== */

    const price = document.createElement("div");

    price.className = "game-card-list-price";

    const priceLabel = document.createElement("span");

    priceLabel.textContent = "Purchase price";

    const priceValue = document.createElement("strong");

    priceValue.textContent = formatCurrency(item.purchase_price);

    price.append(priceLabel, priceValue);

    link.append(visual, info, price);

    card.appendChild(link);

    return card;
  }

  function renderCollectionCards() {
    cleanupDiscStates();

    if (!collectionGrid) {
      return;
    }

    collectionGrid.innerHTML = "";

    const fragment = document.createDocumentFragment();

    collectionRecords.forEach((record) => {
      fragment.appendChild(createGameCard(record));
    });

    collectionGrid.appendChild(fragment);

    gameCards = Array.from(collectionGrid.querySelectorAll(".game-card"));

    setupDiscStates();

    sortCollection();

    filterCollection();
  }

  /* ========================================
   Pagination
======================================== */

  function getPageSize() {
    const value = pageSizeSelect?.value || DEFAULT_PAGE_SIZE;

    if (value === "all") {
      return null;
    }

    const number = Number(value);

    return Number.isInteger(number) && number > 0 ? number : 12;
  }

  function getPaginationItems(totalPages, page) {
    if (totalPages <= 7) {
      return Array.from(
        {
          length: totalPages,
        },
        (_, index) => index + 1,
      );
    }

    if (page <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (page >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [1, "...", page - 1, page, page + 1, "...", totalPages];
  }

  function renderPagination(totalPages) {
    if (!collectionPagination || !paginationPages) {
      return;
    }

    if (totalPages <= 1) {
      collectionPagination.hidden = true;

      paginationPages.innerHTML = "";

      return;
    }

    collectionPagination.hidden = false;

    if (paginationPrevious) {
      paginationPrevious.disabled = currentPage <= 1;
    }

    if (paginationNext) {
      paginationNext.disabled = currentPage >= totalPages;
    }

    paginationPages.innerHTML = "";

    const fragment = document.createDocumentFragment();

    getPaginationItems(totalPages, currentPage).forEach((entry) => {
      if (entry === "...") {
        const ellipsis = document.createElement("span");

        ellipsis.className = "pagination-ellipsis";

        ellipsis.textContent = "…";

        fragment.appendChild(ellipsis);

        return;
      }

      const button = document.createElement("button");

      button.type = "button";

      button.className = "pagination-page";

      button.textContent = String(entry);

      button.setAttribute("aria-label", `Page ${entry}`);

      if (entry === currentPage) {
        button.classList.add("active");

        button.setAttribute("aria-current", "page");
      }

      button.addEventListener("click", () => {
        goToPage(entry);
      });

      fragment.appendChild(button);
    });

    paginationPages.appendChild(fragment);
  }

  function updateCollectionRange(matchingCount, startIndex, endIndex) {
    if (!collectionResults || !collectionRange) {
      return;
    }

    if (matchingCount === 0) {
      collectionResults.hidden = true;

      return;
    }

    collectionResults.hidden = false;

    if (matchingCount === 1) {
      collectionRange.textContent = "Showing 1 of 1 game";

      return;
    }

    collectionRange.textContent = `Showing ${startIndex + 1}–${endIndex} of ${
      matchingCount
    } games`;
  }

  function goToPage(page) {
    currentPage = Math.max(1, Number(page) || 1);

    filterCollection();

    const target = collectionResults || collectionGrid;

    target?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  /* ========================================
     Filter Collection
  ======================================== */

  function filterCollection() {
    const searchTerm = searchInput?.value.trim().toLowerCase() || "";

    const selectedPlatform = platformFilter?.value || "all";

    const selectedGenre = genreFilter?.value || "all";

    const matchingCards = gameCards.filter((card) => {
      const matchesSearch = card.dataset.search.includes(searchTerm);

      const matchesPlatform =
        selectedPlatform === "all" ||
        card.dataset.platform === selectedPlatform;

      const matchesGenre =
        selectedGenre === "all" || card.dataset.genre === selectedGenre;

      return matchesSearch && matchesPlatform && matchesGenre;
    });

    const matchingCount = matchingCards.length;

    const pageSize = getPageSize();

    const totalPages =
      matchingCount === 0
        ? 1
        : pageSize === null
          ? 1
          : Math.ceil(matchingCount / pageSize);

    currentPage = Math.min(Math.max(currentPage, 1), totalPages);

    const startIndex = pageSize === null ? 0 : (currentPage - 1) * pageSize;

    const endIndex =
      pageSize === null
        ? matchingCount
        : Math.min(startIndex + pageSize, matchingCount);

    const visibleCards = new Set(matchingCards.slice(startIndex, endIndex));

    gameCards.forEach((card) => {
      const visible = visibleCards.has(card);

      card.hidden = !visible;

      if (!visible) {
        const state = discStates.get(card);

        if (state?.stopTimer) {
          clearTimeout(state.stopTimer);

          state.stopTimer = null;
        }

        stopDiscSpin(card);
      }
    });

    setCollectionCount(matchingCount);

    updateEmptyState(matchingCount);

    updateCollectionRange(matchingCount, startIndex, endIndex);

    renderPagination(totalPages);

    saveCollectionPreferences();
  }

  /* ========================================
     Sort Collection
  ======================================== */

  function compareNullableNumbers(a, b, direction) {
    const numberA = a === "" ? null : Number(a);

    const numberB = b === "" ? null : Number(b);

    const validA = Number.isFinite(numberA);

    const validB = Number.isFinite(numberB);

    if (!validA && !validB) {
      return 0;
    }

    if (!validA) {
      return 1;
    }

    if (!validB) {
      return -1;
    }

    return direction === "asc" ? numberA - numberB : numberB - numberA;
  }

  function sortCollection() {
    if (!collectionGrid) {
      return;
    }

    const sortValue = sortSelect?.value || "title";

    const sortedCards = [...gameCards];

    sortedCards.sort((a, b) => {
      const titleA = a.dataset.title.toLowerCase();

      const titleB = b.dataset.title.toLowerCase();

      switch (sortValue) {
        /* ===============================
             NEWEST ADDED
          =============================== */

        case "newest":
          return (
            new Date(b.dataset.createdAt || 0).getTime() -
            new Date(a.dataset.createdAt || 0).getTime()
          );

        /* ===============================
             OLDEST ADDED
          =============================== */

        case "oldest":
          return (
            new Date(a.dataset.createdAt || 0).getTime() -
            new Date(b.dataset.createdAt || 0).getTime()
          );

        /* ===============================
             PRICE LOW
          =============================== */

        case "price-low":
          return compareNullableNumbers(
            a.dataset.purchasePrice,
            b.dataset.purchasePrice,
            "asc",
          );

        /* ===============================
             PRICE HIGH
          =============================== */

        case "price-high":
          return compareNullableNumbers(
            a.dataset.purchasePrice,
            b.dataset.purchasePrice,
            "desc",
          );

        /* ===============================
             TITLE
          =============================== */

        case "title":

        default:
          return titleA.localeCompare(titleB);
      }
    });

    sortedCards.forEach((card) => {
      collectionGrid.appendChild(card);
    });

    gameCards = sortedCards;
  }

  /* ========================================
     Disc Rotation
  ======================================== */

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

      state.angle += DISC_SPEED * (deltaTime / 1000);

      state.angle %= 360;

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
    gameCards.forEach((card) => {
      const disc = card.querySelector(".game-disc");

      const discImage = disc?.querySelector("img");

      /*
          A generic disc placeholder
          still slides out with CSS,
          but only real disc photos spin.
        */
      if (!disc || !discImage) {
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

      /* ===============================
           ENTER
        =============================== */

      card.addEventListener("mouseenter", () => {
        if (state.stopTimer) {
          clearTimeout(state.stopTimer);

          state.stopTimer = null;
        }

        startDiscSpin(card);
      });

      /* ===============================
           LEAVE
        =============================== */

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

  /* ========================================
     Load Collection
  ======================================== */

  async function loadCollection() {
    if (!supabaseClient) {
      showCollectionState(
        "Unable to load collection",
        "Shelfmark could not connect to Supabase.",
        {
          error: true,
        },
      );

      setControlsDisabled(true);

      return;
    }

    setControlsDisabled(true);

    if (emptyState) {
      emptyState.classList.remove("visible");
    }

    if (collectionGrid) {
      collectionGrid.innerHTML = "";
    }

    if (collectionResults) {
      collectionResults.hidden = true;
    }

    if (collectionPagination) {
      collectionPagination.hidden = true;
    }

    if (collectionCount) {
      collectionCount.textContent = "Loading collection…";
    }

    showCollectionState(
      "Loading collection…",
      "Retrieving the games in your Shelfmark archive.",
    );

    try {
      /* ==================================
         USER
      ================================== */

      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("You must be logged in to view your collection.");
      }

      currentUserId = user.id;

      /* ==================================
         COLLECTION ITEMS
      ================================== */

      const { data: items, error: itemsError } = await supabaseClient
        .from("collection_items")
        .select(
          `
              id,
              user_id,
              category,
              title,
              condition,
              completeness,
              purchase_price,
              created_at,
              updated_at
            `,
        )
        .eq("user_id", user.id)
        .eq("category", "game")
        .order("created_at", {
          ascending: false,
        });

      if (itemsError) {
        throw itemsError;
      }

      const safeItems = items || [];

      /* ==================================
         EMPTY COLLECTION
      ================================== */

      if (safeItems.length === 0) {
        collectionRecords = [];

        gameCards = [];

        populateFilters();

        restoreCollectionPreferences();

        hideCollectionState();

        setControlsDisabled(false);

        setCollectionCount(0);

        updateEmptyState(0);

        if (collectionResults) {
          collectionResults.hidden = true;
        }

        if (collectionPagination) {
          collectionPagination.hidden = true;
        }

        return;
      }

      const itemIds = safeItems.map((item) => item.id);

      /* ==================================
         GAME DETAILS + CARD IMAGES
      ================================== */

      const [gamesResult, imagesResult] = await Promise.all([
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
                case_format,
                custom_case_width,
                custom_case_height,
                disc_count
              `,
          )
          .in("item_id", itemIds),

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
          .in("item_id", itemIds)
          .in("image_type", ["front", "disc", "cartridge"])
          .order("sort_order", {
            ascending: true,
          }),
      ]);

      if (gamesResult.error) {
        throw gamesResult.error;
      }

      if (imagesResult.error) {
        throw imagesResult.error;
      }

      /* ==================================
         SIGN PRIVATE IMAGES
      ================================== */

      const signedImages = await addSignedUrls(imagesResult.data || []);

      /* ==================================
         GROUP DATA BY ITEM
      ================================== */

      const gamesByItemId = new Map();

      const imagesByItemId = new Map();

      (gamesResult.data || []).forEach((game) => {
        gamesByItemId.set(game.item_id, game);
      });

      signedImages.forEach((image) => {
        if (!imagesByItemId.has(image.item_id)) {
          imagesByItemId.set(image.item_id, []);
        }

        imagesByItemId.get(image.item_id).push(image);
      });

      collectionRecords = safeItems.map((item) => ({
        item,

        game: gamesByItemId.get(item.id) || null,

        images: imagesByItemId.get(item.id) || [],
      }));

      /* ==================================
         RENDER
      ================================== */

      populateFilters();

      restoreCollectionPreferences();

      renderCollectionCards();

      hideCollectionState();

      setControlsDisabled(false);

      restoreCollectionPosition();
    } catch (error) {
      console.error("Shelfmark collection load error:", error);

      collectionRecords = [];

      gameCards = [];

      if (collectionGrid) {
        collectionGrid.innerHTML = "";
      }

      if (emptyState) {
        emptyState.classList.remove("visible");
      }

      if (collectionCount) {
        collectionCount.textContent = "Collection unavailable";
      }

      setControlsDisabled(true);

      showCollectionState(
        "Unable to load collection",
        "Shelfmark could not load your games. Check your connection and try again.",
        {
          error: true,
        },
      );
    }
  }

  /* ========================================
     Events
  ======================================== */

  searchInput?.addEventListener("input", () => {
    currentPage = 1;

    filterCollection();
  });

  platformFilter?.addEventListener("change", () => {
    currentPage = 1;

    filterCollection();
  });

  genreFilter?.addEventListener("change", () => {
    currentPage = 1;

    filterCollection();
  });

  sortSelect?.addEventListener("change", () => {
    currentPage = 1;

    sortCollection();

    filterCollection();
  });

  pageSizeSelect?.addEventListener("change", () => {
    currentPage = 1;

    filterCollection();
  });

  collectionRetry?.addEventListener("click", loadCollection);

  paginationPrevious?.addEventListener("click", () => {
    if (currentPage <= 1) {
      return;
    }

    goToPage(currentPage - 1);
  });

  paginationNext?.addEventListener("click", () => {
    goToPage(currentPage + 1);
  });

  collectionGrid?.addEventListener("click", (event) => {
    const link = event.target.closest(".game-card-link");

    if (!link) {
      return;
    }

    saveCollectionPosition();
  });

  viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const view = button.dataset.collectionView;

      if (!ALLOWED_VIEWS.has(view)) {
        return;
      }

      applyCollectionView(view);

      saveCollectionPreferences();
    });
  });

  /* ========================================
     Start
  ======================================== */

  loadCollection();
});
