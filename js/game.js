document.addEventListener("DOMContentLoaded", () => {
  /* ========================================
     Shelfmark
     Dynamic Game Details
  ======================================== */

  const supabaseClient = window.shelfmarkSupabase;

  const gameState = document.getElementById("game-state");

  const gameStateTitle = document.getElementById("game-state-title");

  const gameStateMessage = document.getElementById("game-state-message");

  const gameContent = document.getElementById("game-content");

  const cover = document.getElementById("game-cover");

  const coverImage = document.getElementById("game-cover-image");

  const coverPlaceholder = document.getElementById("game-cover-placeholder");

  const platformElement = document.getElementById("game-platform");

  const titleElement = document.getElementById("game-title");

  const releaseElement = document.getElementById("game-release");

  const genreElement = document.getElementById("game-genre");

  const regionElement = document.getElementById("game-region");

  const countryElement = document.getElementById("game-country");

  const typeElement = document.getElementById("game-type");

  const editionElement = document.getElementById("game-edition");

  const developerElement = document.getElementById("game-developer");

  const publisherElement = document.getElementById("game-publisher");

  const conditionElement = document.getElementById("game-condition");

  const completenessElement = document.getElementById("game-completeness");

  const physicalFormatElement = document.getElementById("game-physical-format");

  const packagingGallery = document.getElementById("packaging-gallery");

  const mediaGallery = document.getElementById("media-gallery");

  const mediaGalleryStatus = document.getElementById("media-gallery-status");

  const purchaseDateElement = document.getElementById("game-purchase-date");

  const purchasePriceElement = document.getElementById("game-purchase-price");

  const estimatedValueElement = document.getElementById("game-estimated-value");

  const valueSourceElement = document.getElementById("game-value-source");

  const valueCheckedElement = document.getElementById("game-value-checked");

  const marketResearchLinks = document.querySelectorAll(
    ".game-market-research-link",
  );

  const profitLossElement = document.getElementById("game-profit-loss");

  const notesElement = document.getElementById("game-notes-text");

  const editButton = document.getElementById("edit-game");

  const deleteButton = document.getElementById("delete-game");

  const deleteModal = document.getElementById("delete-modal");

  const deleteDialogClose = document.getElementById("delete-dialog-close");

  const deleteDialogCancel = document.getElementById("delete-dialog-cancel");

  const deleteDialogConfirm = document.getElementById("delete-dialog-confirm");

  const deleteDialogGameTitle = document.getElementById(
    "delete-dialog-game-title",
  );

  let deleteModalPreviousFocus = null;

  const actionStatus = document.getElementById("game-action-status");

  const lightbox = document.getElementById("lightbox");

  const lightboxImage = document.getElementById("lightbox-image");

  const lightboxLabel = document.getElementById("lightbox-label");

  const lightboxClose = document.getElementById("lightbox-close");

  let currentUser = null;
  let currentItem = null;
  let currentGame = null;
  let currentImages = [];

  /* ========================================
     GENERAL HELPERS
  ======================================== */

  function setText(element, value, fallback = "N/D") {
    if (!element) {
      return;
    }

    const text = String(value ?? "").trim();

    element.textContent = text || fallback;
  }

  function isValidUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  function formatDate(value) {
    if (!value) {
      return "N/D";
    }

    const date = new Date(`${value}T00:00:00Z`);

    if (Number.isNaN(date.getTime())) {
      return "N/D";
    }

    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  }

  function formatDateTime(value) {
    if (!value) {
      return "N/D";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "N/D";
    }

    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
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

  function formatPhysicalFormat(game) {
    if (!game) {
      return "N/D";
    }

    if (game.media_type === "disc") {
      const count = Number(game.disc_count);

      if (Number.isInteger(count) && count > 0) {
        return `Disc · ${count} ${count === 1 ? "disc" : "discs"}`;
      }

      return "Disc";
    }

    if (game.media_type === "cartridge") {
      return "Cartridge";
    }

    return "N/D";
  }

  function getCoverRatio(game) {
    if (!game) {
      return 135 / 190;
    }

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

    if (game.case_format === "custom") {
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

    return ratios[game.case_format] || 135 / 190;
  }

  function getImageByRole(role) {
    return (
      currentImages.find(
        (image) => image.image_type === role && image.signedUrl,
      ) || null
    );
  }

  function getDiscImage(discNumber) {
    return (
      currentImages.find(
        (image) =>
          image.image_type === "disc" &&
          Number(image.disc_number) === discNumber &&
          image.signedUrl,
      ) || null
    );
  }

  function getResearchEdition() {
    const edition = currentGame?.edition || "";

    if (!edition || edition === "Standard Edition" || edition === "Other") {
      return "";
    }

    return edition;
  }

  function getResearchRegionLabel(provider) {
    const region = currentItem?.region || "";

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
    if (!currentItem || !currentGame) {
      return "";
    }

    const title = currentItem.title || "";

    const platform = currentGame.platform || "";

    if (!title || !platform) {
      return "";
    }

    return [
      title,
      getResearchRegionLabel(provider),
      platform,
      getResearchEdition(),
    ]
      .filter(Boolean)
      .join(" ");
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

  /* ========================================
     PAGE STATES
  ======================================== */

  function showState(title, message, type = "") {
    if (gameContent) {
      gameContent.hidden = true;
    }

    if (gameState) {
      gameState.hidden = false;

      gameState.classList.remove("error", "not-found");

      if (type) {
        gameState.classList.add(type);
      }
    }

    setText(gameStateTitle, title, "");

    setText(gameStateMessage, message, "");
  }

  function showContent() {
    if (gameState) {
      gameState.hidden = true;
    }

    if (gameContent) {
      gameContent.hidden = false;
    }
  }

  /* ========================================
     PRIVATE STORAGE URLS
  ======================================== */

  async function addSignedUrls(images) {
    if (!images.length) {
      return [];
    }

    const paths = images.map((image) => image.storage_path);

    const { data, error } = await supabaseClient.storage
      .from("item-images")
      .createSignedUrls(paths, 3600);

    if (error) {
      console.warn("Shelfmark signed URL error:", error);

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

  /* ========================================
     GALLERY BUILDERS
  ======================================== */

  function createGalleryCard({ image, label, alt, large = false, kind = "" }) {
    const classNames = ["gallery-image"];

    if (large) {
      classNames.push("gallery-image-large");
    }

    if (kind) {
      classNames.push(`gallery-image-${kind}`);
    }

    /* ====================================
       NO IMAGE
    ==================================== */

    if (!image?.signedUrl) {
      const placeholder = document.createElement("div");

      placeholder.className = classNames
        .map((className) =>
          className === "gallery-image"
            ? "gallery-placeholder"
            : className.replace("gallery-image", "gallery-placeholder"),
        )
        .join(" ");

      const empty = document.createElement("div");

      empty.className = "gallery-placeholder-content";

      const emptyLabel = document.createElement("strong");

      emptyLabel.textContent = label;

      const emptyText = document.createElement("small");

      emptyText.textContent = "No image";

      empty.append(emptyLabel, emptyText);

      const caption = document.createElement("span");

      caption.className = "gallery-label";

      caption.textContent = label;

      placeholder.append(empty, caption);

      return placeholder;
    }

    /* ====================================
       IMAGE
    ==================================== */

    const button = document.createElement("button");

    button.type = "button";

    button.className = classNames.join(" ");

    button.dataset.imageUrl = image.signedUrl;

    button.dataset.imageAlt = alt;

    button.dataset.imageLabel = label;

    const visual = document.createElement("div");

    visual.className = "gallery-image-visual";

    const img = document.createElement("img");

    img.src = image.signedUrl;

    img.alt = alt;

    visual.appendChild(img);

    const caption = document.createElement("span");

    caption.className = "gallery-label";

    caption.textContent = label;

    button.append(visual, caption);

    return button;
  }

  function renderPackagingGallery() {
    if (!packagingGallery) {
      return;
    }

    packagingGallery.innerHTML = "";

    const title = currentItem.title;

    const definitions = [
      {
        role: "front",
        label: "Front",
        large: true,
        kind: "front",
      },
      {
        role: "back",
        label: "Back",
        kind: "back",
      },
      {
        role: "side",
        label: "Side",
        kind: "side",
      },
      {
        role: "manual",
        label: "Manual",
        kind: "manual",
      },
    ];

    definitions.forEach((definition) => {
      packagingGallery.appendChild(
        createGalleryCard({
          image: getImageByRole(definition.role),

          label: definition.label,

          alt: `${title} ${definition.label.toLowerCase()} image`,

          large: Boolean(definition.large),

          kind: definition.kind,
        }),
      );
    });
  }

  function renderMediaGallery() {
    if (!mediaGallery) {
      return;
    }

    mediaGallery.innerHTML = "";

    const title = currentItem.title;

    const mediaType = currentGame.media_type;

    /* ====================================
       DISC
    ==================================== */

    if (mediaType === "disc") {
      const storedDiscNumbers = currentImages
        .filter((image) => image.image_type === "disc")
        .map((image) => Number(image.disc_number))
        .filter((number) => Number.isInteger(number) && number > 0);

      const storedMax =
        storedDiscNumbers.length > 0 ? Math.max(...storedDiscNumbers) : 0;

      const declaredCount = Number(currentGame.disc_count);

      const discCount =
        Number.isInteger(declaredCount) && declaredCount > 0
          ? Math.max(declaredCount, storedMax)
          : Math.max(storedMax, 1);

      if (mediaGalleryStatus) {
        mediaGalleryStatus.textContent = `${discCount} ${
          discCount === 1 ? "disc" : "discs"
        }`;
      }

      for (let discNumber = 1; discNumber <= discCount; discNumber += 1) {
        mediaGallery.appendChild(
          createGalleryCard({
            image: getDiscImage(discNumber),

            label: `Disc ${discNumber}`,

            alt: `${title} disc ${discNumber}`,

            kind: "disc",
          }),
        );
      }

      return;
    }

    /* ====================================
       CARTRIDGE
    ==================================== */

    if (mediaType === "cartridge") {
      if (mediaGalleryStatus) {
        mediaGalleryStatus.textContent = "Cartridge";
      }

      mediaGallery.appendChild(
        createGalleryCard({
          image: getImageByRole("cartridge"),

          label: "Cartridge",

          alt: `${title} cartridge`,

          kind: "cartridge",
        }),
      );

      return;
    }

    /* ====================================
       UNKNOWN
    ==================================== */

    if (mediaGalleryStatus) {
      mediaGalleryStatus.textContent = "Unknown";
    }

    const empty = document.createElement("div");

    empty.className = "game-gallery-empty";

    empty.textContent = "No physical media information has been recorded.";

    mediaGallery.appendChild(empty);
  }

  /* ========================================
     RENDER GAME
  ======================================== */

  function renderGame() {
    const item = currentItem;

    const game = currentGame;

    document.title = `${item.title} - Shelfmark`;

    setText(platformElement, game.platform);

    setText(titleElement, item.title);

    setText(releaseElement, game.release_year);

    setText(genreElement, game.genre);

    setText(regionElement, item.region);

    setText(countryElement, item.country);

    setText(typeElement, game.game_type);

    setText(editionElement, game.edition);

    setText(developerElement, game.developer);

    setText(publisherElement, game.publisher);

    setText(conditionElement, item.condition);

    setText(completenessElement, item.completeness);

    setText(physicalFormatElement, formatPhysicalFormat(game));

    /* ====================================
       COVER
    ==================================== */

    const frontImage = getImageByRole("front");

    if (cover) {
      cover.style.aspectRatio = String(getCoverRatio(game));
    }

    if (frontImage?.signedUrl && coverImage) {
      coverImage.src = frontImage.signedUrl;

      coverImage.alt = `${item.title} cover`;

      coverImage.hidden = false;

      if (coverPlaceholder) {
        coverPlaceholder.hidden = true;
      }
    } else {
      if (coverImage) {
        coverImage.removeAttribute("src");

        coverImage.alt = "";

        coverImage.hidden = true;
      }

      if (coverPlaceholder) {
        coverPlaceholder.hidden = false;
      }
    }

    /* ====================================
       PHYSICAL COPY
    ==================================== */

    renderPackagingGallery();
    renderMediaGallery();

    /* ====================================
       PURCHASE
    ==================================== */

    setText(purchaseDateElement, formatDate(item.purchase_date));

    setText(purchasePriceElement, formatCurrency(item.purchase_price));

    setText(estimatedValueElement, formatCurrency(item.estimated_value));

    setText(valueSourceElement, item.value_source);

    setText(valueCheckedElement, formatDateTime(item.value_checked_at));

    updateMarketResearchLinks();

    /* ====================================
       PROFIT / LOSS
    ==================================== */

    if (profitLossElement) {
      profitLossElement.classList.remove("positive", "negative", "neutral");

      const purchasePrice = Number(item.purchase_price);

      const estimatedValue = Number(item.estimated_value);

      const hasPurchasePrice =
        item.purchase_price !== null &&
        item.purchase_price !== undefined &&
        item.purchase_price !== "" &&
        Number.isFinite(purchasePrice);

      const hasEstimatedValue =
        item.estimated_value !== null &&
        item.estimated_value !== undefined &&
        item.estimated_value !== "" &&
        Number.isFinite(estimatedValue);

      if (hasPurchasePrice && hasEstimatedValue) {
        const difference = estimatedValue - purchasePrice;

        const sign = difference >= 0 ? "+" : "-";

        profitLossElement.textContent = `${sign}${formatCurrency(
          Math.abs(difference),
        )}`;

        if (difference > 0) {
          profitLossElement.classList.add("positive");
        } else if (difference < 0) {
          profitLossElement.classList.add("negative");
        } else {
          profitLossElement.classList.add("neutral");
        }
      } else {
        profitLossElement.textContent = "N/D";
      }
    }

    /* ====================================
       NOTES
    ==================================== */

    if (notesElement) {
      if (item.notes?.trim()) {
        notesElement.textContent = item.notes.trim();

        notesElement.classList.remove("empty");
      } else {
        notesElement.textContent = "No notes have been recorded for this copy.";

        notesElement.classList.add("empty");
      }
    }

    /* ====================================
       EDIT
    ==================================== */

    if (editButton) {
      editButton.disabled = false;

      editButton.removeAttribute("aria-disabled");

      editButton.title = "Edit this game";
    }

    showContent();
  }

  /* ========================================
     LOAD DATA
  ======================================== */

  async function loadGame() {
    if (!supabaseClient) {
      showState(
        "Unable to load game",
        "Shelfmark could not connect to Supabase.",
        "error",
      );

      return;
    }

    const itemId = new URLSearchParams(window.location.search).get("id");

    if (!itemId || !isValidUuid(itemId)) {
      showState(
        "Game not found",
        "This game link is missing a valid collection ID.",
        "not-found",
      );

      return;
    }

    try {
      showState("Loading game…", "Retrieving this copy from your collection.");

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
        showState("Sign in required", "Log in to view this item.", "error");

        return;
      }

      currentUser = user;

      /* ==================================
         COLLECTION ITEM
      ================================== */

      const { data: item, error: itemError } = await supabaseClient
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
              notes,
              created_at,
              updated_at
            `,
        )
        .eq("id", itemId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (itemError) {
        throw itemError;
      }

      if (!item || item.category !== "game") {
        showState(
          "Game not found",
          "This item does not exist or is not available in your collection.",
          "not-found",
        );

        return;
      }

      /* ==================================
         GAME + IMAGES
      ================================== */

      const [gameResult, imagesResult] = await Promise.all([
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
          .eq("item_id", itemId)
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
                sort_order,
                created_at
              `,
          )
          .eq("item_id", itemId)
          .order("sort_order", {
            ascending: true,
          }),
      ]);

      if (gameResult.error) {
        throw gameResult.error;
      }

      if (!gameResult.data) {
        throw new Error("The linked game details are missing.");
      }

      if (imagesResult.error) {
        throw imagesResult.error;
      }

      currentItem = item;

      currentGame = gameResult.data;

      currentImages = await addSignedUrls(imagesResult.data || []);

      renderGame();
    } catch (error) {
      console.error("Shelfmark game load error:", error);

      showState(
        "Unable to load game",
        "Shelfmark could not load this item. Refresh the page and try again.",
        "error",
      );
    }
  }

  /* ========================================
     EDIT GAME
  ======================================== */

  editButton?.addEventListener("click", () => {
    if (!currentItem?.id) {
      return;
    }

    window.location.href = `add-game.html?edit=${encodeURIComponent(currentItem.id)}`;
  });

  /* ========================================
     DELETE GAME
  ======================================== */

  function openDeleteModal() {
    if (!deleteModal || !currentItem) {
      return;
    }

    deleteModalPreviousFocus = document.activeElement;

    if (deleteDialogGameTitle) {
      deleteDialogGameTitle.textContent = currentItem.title;
    }

    deleteModal.classList.add("visible");

    deleteModal.setAttribute("aria-hidden", "false");

    document.body.classList.add("delete-modal-open");

    deleteDialogCancel?.focus();
  }

  function closeDeleteModal() {
    if (!deleteModal) {
      return;
    }

    deleteModal.classList.remove("visible");

    deleteModal.setAttribute("aria-hidden", "true");

    document.body.classList.remove("delete-modal-open");

    if (deleteModalPreviousFocus instanceof HTMLElement) {
      deleteModalPreviousFocus.focus();
    }

    deleteModalPreviousFocus = null;
  }

  async function deleteCurrentGame() {
    if (!currentItem || !currentUser || !supabaseClient) {
      return;
    }

    if (deleteDialogConfirm) {
      deleteDialogConfirm.disabled = true;

      deleteDialogConfirm.textContent = "Deleting…";
    }

    if (deleteDialogCancel) {
      deleteDialogCancel.disabled = true;
    }

    if (deleteDialogClose) {
      deleteDialogClose.disabled = true;
    }

    if (actionStatus) {
      actionStatus.textContent = "Deleting game…";

      actionStatus.classList.remove("error");

      actionStatus.classList.add("visible");
    }

    try {
      const storagePaths = [
        ...new Set(
          currentImages.map((image) => image.storage_path).filter(Boolean),
        ),
      ];

      /* ==================================
       DATABASE DELETE
    ================================== */

      const { error: deleteError } = await supabaseClient
        .from("collection_items")
        .delete()
        .eq("id", currentItem.id)
        .eq("user_id", currentUser.id);

      if (deleteError) {
        throw deleteError;
      }

      /*
      games + item_images database rows
      are removed through ON DELETE CASCADE.

      Storage files have to be removed
      separately.
    */

      if (storagePaths.length > 0) {
        const { error: storageError } = await supabaseClient.storage
          .from("item-images")
          .remove(storagePaths);

        if (storageError) {
          console.warn(
            "Shelfmark: Game was deleted, but some image files could not be cleaned up:",
            storageError,
          );
        }
      }

      window.location.href = "collection.html";
    } catch (error) {
      console.error("Shelfmark delete game error:", error);

      if (deleteDialogConfirm) {
        deleteDialogConfirm.disabled = false;

        deleteDialogConfirm.textContent = "Delete game";
      }

      if (deleteDialogCancel) {
        deleteDialogCancel.disabled = false;
      }

      if (deleteDialogClose) {
        deleteDialogClose.disabled = false;
      }

      if (actionStatus) {
        actionStatus.textContent =
          "The game could not be deleted. Please try again.";

        actionStatus.classList.add("visible", "error");
      }

      closeDeleteModal();
    }
  }

  deleteButton?.addEventListener("click", openDeleteModal);

  deleteDialogCancel?.addEventListener("click", closeDeleteModal);

  deleteDialogClose?.addEventListener("click", closeDeleteModal);

  deleteDialogConfirm?.addEventListener("click", deleteCurrentGame);

  deleteModal?.addEventListener("click", (event) => {
    if (event.target === deleteModal) {
      closeDeleteModal();
    }
  });

  /* ========================================
     IMAGE LIGHTBOX
  ======================================== */

  function openLightbox(url, alt, label) {
    if (!lightbox || !lightboxImage || !lightboxLabel || !url) {
      return;
    }

    lightboxImage.src = url;

    lightboxImage.alt = alt || "";

    lightboxLabel.textContent = label || "";

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

      lightboxImage.alt = "";
    }

    if (lightboxLabel) {
      lightboxLabel.textContent = "";
    }
  }

  gameContent?.addEventListener("click", (event) => {
    const galleryItem = event.target.closest(".gallery-image");

    if (!galleryItem || !gameContent.contains(galleryItem)) {
      return;
    }

    openLightbox(
      galleryItem.dataset.imageUrl,
      galleryItem.dataset.imageAlt,
      galleryItem.dataset.imageLabel,
    );
  });

  lightboxClose?.addEventListener("click", closeLightbox);

  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (deleteModal?.classList.contains("visible")) {
      closeDeleteModal();
      return;
    }

    if (lightbox?.classList.contains("visible")) {
      closeLightbox();
    }
  });

  /* ========================================
     START
  ======================================== */

  loadGame();
});
