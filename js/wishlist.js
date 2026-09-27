document.addEventListener("DOMContentLoaded", () => {
  /* =====================================================
     ELEMENTS
  ===================================================== */

  const supabaseClient = window.shelfmarkSupabase;
  const formatLibrary = window.ShelfmarkFormats;

  const wishlistCount = document.getElementById("wishlist-count");

  const addItemButton = document.getElementById("wishlist-add-item");

  const controls = document.getElementById("wishlist-controls");

  const searchInput = document.getElementById("wishlist-search");

  const platformFilter = document.getElementById("wishlist-platform-filter");

  const priorityFilter = document.getElementById("wishlist-priority-filter");

  const sortInput = document.getElementById("wishlist-sort");

  const results = document.getElementById("wishlist-results");

  const rangeText = document.getElementById("wishlist-range");

  const pageSizeInput = document.getElementById("wishlist-items-per-page");

  const state = document.getElementById("wishlist-state");

  const stateTitle = document.getElementById("wishlist-state-title");

  const stateMessage = document.getElementById("wishlist-state-message");

  const retryButton = document.getElementById("wishlist-retry");

  const grid = document.getElementById("wishlist-grid");

  const empty = document.getElementById("wishlist-empty");

  const emptyTitle = document.getElementById("wishlist-empty-title");

  const emptyMessage = document.getElementById("wishlist-empty-message");

  const emptyAdd = document.getElementById("wishlist-empty-add");

  const pagination = document.getElementById("wishlist-pagination");

  const paginationPages = document.getElementById("wishlist-pagination-pages");

  const previousButton = document.getElementById(
    "wishlist-pagination-previous",
  );

  const nextButton = document.getElementById("wishlist-pagination-next");

  /* =====================================================
     STATE
  ===================================================== */

  let wishlistItems = [];

  let currentPage = 1;

  let currentUser = null;

  /* =====================================================
     FORMATTERS
  ===================================================== */

  const currencyFormatter = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
  });

  function formatCurrency(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return null;
    }

    return currencyFormatter.format(number);
  }

  function formatPriority(value) {
    const priority = String(value || "")
      .trim()
      .toLowerCase();

    if (priority === "high") {
      return "High";
    }

    if (priority === "low") {
      return "Low";
    }

    return "Medium";
  }

  function formatDate(value) {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  /* =====================================================
     STATE DISPLAY
  ===================================================== */

  function showLoadingState() {
    if (state) {
      state.hidden = false;
    }

    if (stateTitle) {
      stateTitle.textContent = "Loading wishlist…";
    }

    if (stateMessage) {
      stateMessage.textContent = "Retrieving the games you want to acquire.";
    }

    if (retryButton) {
      retryButton.hidden = true;
    }

    if (grid) {
      grid.innerHTML = "";
    }

    if (controls) {
      controls.hidden = true;
    }

    if (results) {
      results.hidden = true;
    }

    if (pagination) {
      pagination.hidden = true;
    }

    if (empty) {
      empty.hidden = true;
    }
  }

  function showErrorState(message) {
    if (state) {
      state.hidden = false;
    }

    if (stateTitle) {
      stateTitle.textContent = "Wishlist unavailable";
    }

    if (stateMessage) {
      stateMessage.textContent =
        message || "Shelfmark could not load your wishlist.";
    }

    if (retryButton) {
      retryButton.hidden = false;
    }

    if (controls) {
      controls.hidden = true;
    }

    if (results) {
      results.hidden = true;
    }

    if (pagination) {
      pagination.hidden = true;
    }

    if (empty) {
      empty.hidden = true;
    }
  }

  function hideState() {
    if (state) {
      state.hidden = true;
    }

    if (retryButton) {
      retryButton.hidden = true;
    }
  }

  /* =====================================================
     IMAGES
  ===================================================== */

  async function addSignedUrls(images) {
    return window.ShelfmarkStorage.addSignedUrls(images);
  }

  function getDisplayImage(item) {
    const images = item.images || [];

    const front = images.find(
      (image) => image.image_type === "front" && image.signedUrl,
    );

    if (front) {
      return {
        ...front,
        kind: "front",
      };
    }

    const desiredMediaRole =
      item.media_type === "cartridge" ? "cartridge" : "disc";

    const media = images.find(
      (image) => image.image_type === desiredMediaRole && image.signedUrl,
    );

    if (media) {
      return {
        ...media,
        kind: "media",
      };
    }

    return null;
  }

  /* =====================================================
     LOAD
  ===================================================== */

  async function loadWishlist() {
    if (!supabaseClient) {
      showErrorState("Shelfmark could not connect to Supabase.");

      return;
    }

    showLoadingState();

    try {
      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser();

      if (userError || !user) {
        throw new Error("You must be logged in to view your wishlist.");
      }

      currentUser = user;

      const { data: items, error: itemError } = await supabaseClient
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
              notes,
              created_at,
              updated_at
            `,
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (itemError) {
        throw itemError;
      }

      const loadedItems = items || [];

      let images = [];

      if (loadedItems.length > 0) {
        const itemIds = loadedItems.map((item) => item.id);

        const { data, error } = await supabaseClient
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
          .in("wishlist_item_id", itemIds)
          .order("created_at", {
            ascending: true,
          });

        if (error) {
          throw error;
        }

        images = await addSignedUrls(data || []);
      }

      const imagesByItem = new Map();

      images.forEach((image) => {
        if (!imagesByItem.has(image.wishlist_item_id)) {
          imagesByItem.set(image.wishlist_item_id, []);
        }

        imagesByItem.get(image.wishlist_item_id).push(image);
      });

      wishlistItems = loadedItems.map((item) => ({
        ...item,

        images: imagesByItem.get(item.id) || [],
      }));

      currentPage = 1;

      populatePlatformFilter();
      renderWishlist();
    } catch (error) {
      console.error("Shelfmark wishlist load error:", error);

      showErrorState(
        error?.message || "Shelfmark could not load your wishlist.",
      );
    }
  }

  /* =====================================================
     FILTERS
  ===================================================== */

  function populatePlatformFilter() {
    if (!platformFilter) {
      return;
    }

    const previousValue = platformFilter.value;

    const platforms = [
      ...new Set(wishlistItems.map((item) => item.platform).filter(Boolean)),
    ].sort((a, b) =>
      a.localeCompare(b, undefined, {
        sensitivity: "base",
      }),
    );

    platformFilter.innerHTML = '<option value="all">All platforms</option>';

    platforms.forEach((platform) => {
      const option = document.createElement("option");

      option.value = platform;
      option.textContent = platform;

      platformFilter.appendChild(option);
    });

    if (platforms.includes(previousValue)) {
      platformFilter.value = previousValue;
    }
  }

  function getFilteredItems() {
    const search = searchInput?.value.trim().toLowerCase() || "";

    const selectedPlatform = platformFilter?.value || "all";

    const selectedPriority = priorityFilter?.value || "all";

    return wishlistItems.filter((item) => {
      if (selectedPlatform !== "all" && item.platform !== selectedPlatform) {
        return false;
      }

      if (selectedPriority !== "all" && item.priority !== selectedPriority) {
        return false;
      }

      if (!search) {
        return true;
      }

      const searchableText = [
        item.title,
        item.platform,
        item.genre,
        item.edition,
        item.developer,
        item.publisher,
        item.region,
        item.country,
        item.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });
  }

  /* =====================================================
     SORT
  ===================================================== */

  function getPriorityWeight(priority) {
    if (priority === "high") {
      return 3;
    }

    if (priority === "medium") {
      return 2;
    }

    if (priority === "low") {
      return 1;
    }

    return 0;
  }

  function sortItems(items) {
    const sorted = [...items];

    const sort = sortInput?.value || "newest";

    if (sort === "title") {
      sorted.sort((a, b) =>
        a.title.localeCompare(b.title, undefined, {
          sensitivity: "base",
        }),
      );

      return sorted;
    }

    if (sort === "oldest") {
      sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      return sorted;
    }

    if (sort === "target-low") {
      sorted.sort((a, b) => {
        const aPrice =
          a.target_price === null
            ? Number.POSITIVE_INFINITY
            : Number(a.target_price);

        const bPrice =
          b.target_price === null
            ? Number.POSITIVE_INFINITY
            : Number(b.target_price);

        return aPrice - bPrice;
      });

      return sorted;
    }

    if (sort === "target-high") {
      sorted.sort((a, b) => {
        const aHasPrice = a.target_price !== null;

        const bHasPrice = b.target_price !== null;

        if (aHasPrice && !bHasPrice) {
          return -1;
        }

        if (!aHasPrice && bHasPrice) {
          return 1;
        }

        return Number(b.target_price || 0) - Number(a.target_price || 0);
      });

      return sorted;
    }

    if (sort === "priority") {
      sorted.sort((a, b) => {
        const difference =
          getPriorityWeight(b.priority) - getPriorityWeight(a.priority);

        if (difference !== 0) {
          return difference;
        }

        return a.title.localeCompare(b.title, undefined, {
          sensitivity: "base",
        });
      });

      return sorted;
    }

    sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return sorted;
  }

  /* =====================================================
     PAGINATION
  ===================================================== */

  function getPageSize() {
    const value = pageSizeInput?.value || "12";

    if (value === "all") {
      return null;
    }

    const number = Number(value);

    return Number.isInteger(number) && number > 0 ? number : 12;
  }

  function getPageSequence(current, total) {
    if (total <= 7) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }

    const pages = new Set([
      1,
      total,
      current - 2,
      current - 1,
      current,
      current + 1,
      current + 2,
    ]);

    const valid = [...pages]
      .filter((page) => page >= 1 && page <= total)
      .sort((a, b) => a - b);

    const result = [];

    valid.forEach((page, index) => {
      const previous = valid[index - 1];

      if (previous && page - previous > 1) {
        result.push("ellipsis");
      }

      result.push(page);
    });

    return result;
  }

  function renderPagination(totalItems, pageSize) {
    if (!pagination || !paginationPages || !previousButton || !nextButton) {
      return;
    }

    paginationPages.innerHTML = "";

    if (!pageSize || totalItems <= pageSize) {
      pagination.hidden = true;

      return;
    }

    const totalPages = Math.ceil(totalItems / pageSize);

    currentPage = Math.min(Math.max(currentPage, 1), totalPages);

    previousButton.disabled = currentPage <= 1;

    nextButton.disabled = currentPage >= totalPages;

    const sequence = getPageSequence(currentPage, totalPages);

    sequence.forEach((entry) => {
      if (entry === "ellipsis") {
        const ellipsis = document.createElement("span");

        ellipsis.className = "wishlist-pagination-ellipsis";

        ellipsis.textContent = "…";

        paginationPages.appendChild(ellipsis);

        return;
      }

      const button = document.createElement("button");

      button.type = "button";

      button.className = "wishlist-pagination-page";

      button.textContent = String(entry);

      button.setAttribute("aria-label", `Page ${entry}`);

      if (entry === currentPage) {
        button.classList.add("active");

        button.setAttribute("aria-current", "page");
      }

      button.addEventListener("click", () => {
        currentPage = entry;

        renderWishlist();

        document.querySelector(".wishlist-controls")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });

      paginationPages.appendChild(button);
    });

    pagination.hidden = false;
  }

  /* =====================================================
     CARD HELPERS
  ===================================================== */

  function createMetaText(item) {
    return [item.platform, item.region, item.edition]
      .filter(Boolean)
      .join(" · ");
  }

  function getMediaLabel(item) {
    if (!formatLibrary) {
      return item.media_type === "cartridge" ? "Cartridge" : "Disc";
    }

    const definition = formatLibrary.getMediaDefinition({
      mediaFormat: item.media_format || "",

      platform: item.platform || "",

      mediaType: item.media_type || "",

      region: item.region || "",
    });

    return (
      definition?.shortLabel ||
      (item.media_type === "cartridge" ? "Cartridge" : "Disc")
    );
  }

  function addDetailRow(container, label, value) {
    if (!value) {
      return;
    }

    const row = document.createElement("div");

    row.className = "wishlist-card-detail";

    const term = document.createElement("span");

    term.className = "wishlist-card-detail-label";

    term.textContent = label;

    const result = document.createElement("span");

    result.className = "wishlist-card-detail-value";

    result.textContent = value;

    row.append(term, result);

    container.appendChild(row);
  }

  /* =====================================================
     REMOVE
  ===================================================== */

  async function removeWishlistItem(item, button) {
    if (!supabaseClient || !currentUser) {
      return;
    }

    const confirmed = window.confirm(
      `Remove "${item.title}" from your wishlist?`,
    );

    if (!confirmed) {
      return;
    }

    const originalText = button.textContent;

    button.disabled = true;
    button.textContent = "Removing…";

    try {
      /*
        Delete the database item first.

        wishlist_images rows are removed
        automatically through ON DELETE CASCADE.
      */

      const { error } = await supabaseClient
        .from("wishlist_items")
        .delete()
        .eq("id", item.id)
        .eq("user_id", currentUser.id);

      if (error) {
        throw error;
      }

      /*
        Storage is separate from PostgreSQL,
        so clean the actual files afterwards.

        A failure here leaves only orphaned
        Storage files; the wishlist entry
        itself has still been deleted.
      */

      const storagePaths = (item.images || [])
        .map((image) => image.storage_path)
        .filter(Boolean);

      if (storagePaths.length > 0) {
        const { error: storageError } = await supabaseClient.storage
          .from("item-images")
          .remove(storagePaths);

        if (storageError) {
          console.warn(
            "Shelfmark: Wishlist item was removed, but some reference image files could not be deleted:",
            storageError,
          );
        }
      }

      wishlistItems = wishlistItems.filter(
        (existingItem) => existingItem.id !== item.id,
      );

      populatePlatformFilter();

      const filtered = getFilteredItems();

      const pageSize = getPageSize();

      if (
        pageSize &&
        currentPage > 1 &&
        filtered.length <= (currentPage - 1) * pageSize
      ) {
        currentPage -= 1;
      }

      renderWishlist();
    } catch (error) {
      console.error("Shelfmark wishlist delete error:", error);

      window.alert("The wishlist item could not be removed. Please try again.");

      button.disabled = false;
      button.textContent = originalText;
    }
  }

  /* =====================================================
     CREATE CARD
  ===================================================== */

  function createWishlistCard(item) {
    const card = document.createElement("article");

    card.className = "wishlist-card";

    card.dataset.itemId = item.id;

    /* ---------- Visual ---------- */

    const visual = document.createElement("div");

    visual.className = "wishlist-card-visual";

    const displayImage = getDisplayImage(item);

    if (displayImage) {
      const image = document.createElement("img");

      image.src = displayImage.signedUrl;

      image.alt =
        displayImage.kind === "front"
          ? `${item.title} reference cover`
          : `${item.title} media reference`;

      image.loading = "lazy";

      image.className =
        displayImage.kind === "front"
          ? "wishlist-card-image wishlist-card-cover"
          : "wishlist-card-image wishlist-card-media";

      visual.appendChild(image);
    } else {
      const placeholder = document.createElement("div");

      placeholder.className = "wishlist-card-placeholder";

      const mark = document.createElement("span");

      mark.className = "wishlist-card-placeholder-mark";

      mark.textContent = "S";

      const text = document.createElement("span");

      text.textContent = "No reference image";

      placeholder.append(mark, text);

      visual.appendChild(placeholder);
    }

    /* ---------- Content ---------- */

    const content = document.createElement("div");

    content.className = "wishlist-card-content";

    const heading = document.createElement("div");

    heading.className = "wishlist-card-heading";

    const headingMain = document.createElement("div");

    const title = document.createElement("h2");

    const titleLink = document.createElement("a");

    titleLink.href = `add-wishlist.html?edit=${encodeURIComponent(item.id)}`;

    titleLink.textContent = item.title;

    title.appendChild(titleLink);

    const meta = document.createElement("p");

    meta.className = "wishlist-card-meta";

    meta.textContent = createMetaText(item) || item.platform;

    headingMain.append(title, meta);

    const priority = document.createElement("span");

    priority.className = `wishlist-priority wishlist-priority-${item.priority || "medium"}`;

    priority.textContent = `${formatPriority(item.priority)} priority`;

    heading.append(headingMain, priority);

    content.appendChild(heading);

    /* ---------- Details ---------- */

    const details = document.createElement("div");

    details.className = "wishlist-card-details";

    const targetPrice = formatCurrency(item.target_price);

    addDetailRow(details, "Target price", targetPrice || "Not set");

    addDetailRow(
      details,
      "Wanted",
      item.desired_completeness || "Any completeness",
    );

    addDetailRow(
      details,
      "Condition",
      item.desired_condition || "Any condition",
    );

    addDetailRow(details, "Media", getMediaLabel(item));

    content.appendChild(details);

    /* ---------- Notes ---------- */

    if (item.notes) {
      const notes = document.createElement("p");

      notes.className = "wishlist-card-notes";

      notes.textContent = item.notes;

      content.appendChild(notes);
    }

    /* ---------- Footer ---------- */

    const footer = document.createElement("div");

    footer.className = "wishlist-card-footer";

    const added = document.createElement("span");

    added.className = "wishlist-card-added";

    const date = formatDate(item.created_at);

    added.textContent = date ? `Added ${date}` : "Wishlist item";

    const actions = document.createElement("div");

    actions.className = "wishlist-card-actions";

    const addToCollectionLink = document.createElement("a");

    addToCollectionLink.className = "wishlist-card-action wishlist-card-add";

    addToCollectionLink.href = `add-game.html?wishlist=${encodeURIComponent(
      item.id,
    )}`;

    addToCollectionLink.textContent = "Add to Collection";

    const editLink = document.createElement("a");

    editLink.className = "wishlist-card-action";

    editLink.href = `add-wishlist.html?edit=${encodeURIComponent(item.id)}`;

    editLink.textContent = "Edit";

    const removeButton = document.createElement("button");

    removeButton.type = "button";

    removeButton.className = "wishlist-card-action wishlist-card-remove";

    removeButton.textContent = "Remove";

    removeButton.addEventListener("click", () => {
      removeWishlistItem(item, removeButton);
    });

    actions.append(addToCollectionLink, editLink, removeButton);

    footer.append(added, actions);

    content.appendChild(footer);

    card.append(visual, content);

    return card;
  }

  /* =====================================================
     RENDER
  ===================================================== */

  function renderWishlist() {
    hideState();

    if (!grid) {
      return;
    }

    grid.innerHTML = "";

    const total = wishlistItems.length;

    if (wishlistCount) {
      wishlistCount.textContent =
        total === 1
          ? "1 game on your wishlist"
          : `${total} games on your wishlist`;
    }

    /*
      Same duplicate-action rule as Collection:

      empty wishlist -> empty-state action
      populated wishlist -> header action
    */

    if (addItemButton) {
      addItemButton.hidden = total === 0;
    }

    if (total === 0) {
      if (controls) {
        controls.hidden = true;
      }

      if (results) {
        results.hidden = true;
      }

      if (pagination) {
        pagination.hidden = true;
      }

      if (empty) {
        empty.hidden = false;
      }

      if (emptyTitle) {
        emptyTitle.textContent = "Your wishlist is empty.";
      }

      if (emptyMessage) {
        emptyMessage.textContent =
          "Save physical games you would like to add to your collection.";
      }

      if (emptyAdd) {
        emptyAdd.hidden = false;
      }

      return;
    }

    if (controls) {
      controls.hidden = false;
    }

    const filteredItems = sortItems(getFilteredItems());

    if (filteredItems.length === 0) {
      if (results) {
        results.hidden = true;
      }

      if (pagination) {
        pagination.hidden = true;
      }

      if (empty) {
        empty.hidden = false;
      }

      if (emptyTitle) {
        emptyTitle.textContent = "Nothing found.";
      }

      if (emptyMessage) {
        emptyMessage.textContent = "Try changing your search or filters.";
      }

      if (emptyAdd) {
        emptyAdd.hidden = true;
      }

      return;
    }

    if (empty) {
      empty.hidden = true;
    }

    const pageSize = getPageSize();

    let visibleItems = filteredItems;

    let startIndex = 0;
    let endIndex = filteredItems.length;

    if (pageSize) {
      const totalPages = Math.max(
        1,
        Math.ceil(filteredItems.length / pageSize),
      );

      currentPage = Math.min(Math.max(currentPage, 1), totalPages);

      startIndex = (currentPage - 1) * pageSize;

      endIndex = Math.min(startIndex + pageSize, filteredItems.length);

      visibleItems = filteredItems.slice(startIndex, endIndex);
    } else {
      currentPage = 1;
    }

    visibleItems.forEach((item) => {
      grid.appendChild(createWishlistCard(item));
    });

    if (results) {
      results.hidden = false;
    }

    if (rangeText) {
      if (filteredItems.length === 1) {
        rangeText.textContent = "Showing 1 item";
      } else if (!pageSize) {
        rangeText.textContent = `Showing all ${filteredItems.length} items`;
      } else {
        rangeText.textContent = `Showing ${startIndex + 1}–${endIndex} of ${filteredItems.length}`;
      }
    }

    renderPagination(filteredItems.length, pageSize);
  }

  /* =====================================================
     EVENTS
  ===================================================== */

  searchInput?.addEventListener("input", () => {
    currentPage = 1;

    renderWishlist();
  });

  platformFilter?.addEventListener("change", () => {
    currentPage = 1;

    renderWishlist();
  });

  priorityFilter?.addEventListener("change", () => {
    currentPage = 1;

    renderWishlist();
  });

  sortInput?.addEventListener("change", () => {
    currentPage = 1;

    renderWishlist();
  });

  pageSizeInput?.addEventListener("change", () => {
    currentPage = 1;

    renderWishlist();
  });

  previousButton?.addEventListener("click", () => {
    if (currentPage <= 1) {
      return;
    }

    currentPage -= 1;

    renderWishlist();
  });

  nextButton?.addEventListener("click", () => {
    const pageSize = getPageSize();

    if (!pageSize) {
      return;
    }

    const total = getFilteredItems().length;

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    if (currentPage >= totalPages) {
      return;
    }

    currentPage += 1;

    renderWishlist();
  });

  retryButton?.addEventListener("click", loadWishlist);

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  loadWishlist();
});
