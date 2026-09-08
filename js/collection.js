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

  /* ========================================
     Page State
  ======================================== */

  function setControlsDisabled(disabled) {
    [searchInput, platformFilter, genreFilter, sortSelect].forEach(
      (control) => {
        if (control) {
          control.disabled = disabled;
        }
      },
    );
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

  function setCollectionCount(visibleCount = collectionRecords.length) {
    if (!collectionCount) {
      return;
    }

    const total = collectionRecords.length;

    if (total === 0) {
      collectionCount.textContent = "0 items in your collection";

      return;
    }

    if (visibleCount !== total) {
      collectionCount.textContent = `${visibleCount} of ${total} items`;

      return;
    }

    collectionCount.textContent = `${total} ${
      total === 1 ? "item" : "items"
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
      emptyTitle.textContent = "Nothing found.";
    }

    if (emptyMessage) {
      emptyMessage.textContent = "Try changing your search or filters.";
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

    infoMain.append(title, subline);

    const condition = document.createElement("span");

    condition.className = "game-condition";

    condition.textContent = item.condition || item.completeness || "N/D";

    info.append(infoMain, condition);

    link.append(visual, info);

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
     Filter Collection
  ======================================== */

  function filterCollection() {
    const searchTerm = searchInput?.value.trim().toLowerCase() || "";

    const selectedPlatform = platformFilter?.value || "all";

    const selectedGenre = genreFilter?.value || "all";

    let visibleGames = 0;

    gameCards.forEach((card) => {
      const matchesSearch = card.dataset.search.includes(searchTerm);

      const matchesPlatform =
        selectedPlatform === "all" ||
        card.dataset.platform === selectedPlatform;

      const matchesGenre =
        selectedGenre === "all" || card.dataset.genre === selectedGenre;

      const visible = matchesSearch && matchesPlatform && matchesGenre;

      card.hidden = !visible;

      if (visible) {
        visibleGames += 1;
      } else {
        const state = discStates.get(card);

        if (state?.stopTimer) {
          clearTimeout(state.stopTimer);

          state.stopTimer = null;
        }

        stopDiscSpin(card);
      }
    });

    setCollectionCount(visibleGames);

    updateEmptyState(visibleGames);
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

        hideCollectionState();

        setControlsDisabled(false);

        setCollectionCount(0);

        updateEmptyState(0);

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

      renderCollectionCards();

      hideCollectionState();

      setControlsDisabled(false);
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

  searchInput?.addEventListener("input", filterCollection);

  platformFilter?.addEventListener("change", filterCollection);

  genreFilter?.addEventListener("change", filterCollection);

  sortSelect?.addEventListener("change", () => {
    sortCollection();

    filterCollection();
  });

  collectionRetry?.addEventListener("click", loadCollection);

  /* ========================================
     Start
  ======================================== */

  loadCollection();
});
