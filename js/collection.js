document.addEventListener("DOMContentLoaded", () => {
  /* ========================================
     Shelfmark
     Dynamic Collection
  ======================================== */

  const supabaseClient = window.shelfmarkSupabase;

  const formatLibrary = window.ShelfmarkFormats;

  const caseViewer = window.ShelfmarkCaseViewer;
  const appSettings = window.ShelfmarkSettings;

  if (!formatLibrary) {
    throw new Error(
      "Shelfmark format library is missing. Make sure js/formats.js loads before collection.js.",
    );
  }

  if (!caseViewer) {
    throw new Error(
      "Shelfmark case viewer is missing. Make sure js/case-viewer.js loads before collection.js.",
    );
  }

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

  const collectionAddButton = document.getElementById("collection-add-game");

  const collectionShareButton = document.getElementById(
    "collection-share-button",
  );

  const collectionEyebrow = document.getElementById("collection-eyebrow");

  const collectionPageTitle = document.getElementById("collection-page-title");

  const collectionPageDescription = document.getElementById(
    "collection-page-description",
  );

  const customCollectionsSection = document.getElementById(
    "custom-collections",
  );

  const collectionScopeList = document.getElementById("collection-scope-list");

  const collectionScopeActions = document.getElementById(
    "collection-scope-actions",
  );

  const collectionCreateButton = document.getElementById(
    "collection-create-button",
  );

  const collectionManageButton = document.getElementById(
    "collection-manage-button",
  );

  const collectionEditButton = document.getElementById(
    "collection-edit-button",
  );

  const collectionDeleteButton = document.getElementById(
    "collection-delete-button",
  );

  const collectionEditorModal = document.getElementById(
    "collection-editor-modal",
  );

  const collectionEditorForm = document.getElementById(
    "collection-editor-form",
  );

  const collectionEditorTitle = document.getElementById(
    "collection-editor-title",
  );

  const collectionNameInput = document.getElementById("collection-name");

  const collectionDescriptionInput = document.getElementById(
    "collection-description",
  );

  const collectionEditorStatus = document.getElementById(
    "collection-editor-status",
  );

  const collectionEditorSave = document.getElementById(
    "collection-editor-save",
  );

  const collectionMembersModal = document.getElementById(
    "collection-members-modal",
  );

  const collectionMembersSubtitle = document.getElementById(
    "collection-members-subtitle",
  );

  const collectionMembersSearch = document.getElementById(
    "collection-members-search",
  );

  const collectionMembersCount = document.getElementById(
    "collection-members-count",
  );

  const collectionMembersList = document.getElementById(
    "collection-members-list",
  );

  const collectionMembersStatus = document.getElementById(
    "collection-members-status",
  );

  const collectionMembersSave = document.getElementById(
    "collection-members-save",
  );

  const collectionDeleteModal = document.getElementById(
    "collection-delete-modal",
  );

  const collectionDeleteCopy = document.getElementById(
    "collection-delete-copy",
  );

  const collectionDeleteStatus = document.getElementById(
    "collection-delete-status",
  );

  const collectionDeleteConfirm = document.getElementById(
    "collection-delete-confirm",
  );

  const collectionShareModal = document.getElementById(
    "collection-share-modal",
  );

  const collectionShareTitle = document.getElementById(
    "collection-share-title",
  );

  const collectionShareEnabled = document.getElementById(
    "collection-share-enabled",
  );

  const collectionShareLinkWrap = document.getElementById(
    "collection-share-link-wrap",
  );

  const collectionShareUrl = document.getElementById("collection-share-url");

  const collectionShareCopy = document.getElementById(
    "collection-share-copy",
  );

  const collectionShareRegenerate = document.getElementById(
    "collection-share-regenerate",
  );

  const collectionShareSave = document.getElementById(
    "collection-share-save",
  );

  const collectionShareStatus = document.getElementById(
    "collection-share-status",
  );

  const shareShowPhotos = document.getElementById("share-show-photos");

  const shareShowEstimatedValue = document.getElementById(
    "share-show-estimated-value",
  );

  const shareShowPurchasePrice = document.getElementById(
    "share-show-purchase-price",
  );

  const shareShowPurchaseDate = document.getElementById(
    "share-show-purchase-date",
  );

  const shareShowValueDifference = document.getElementById(
    "share-show-profit-loss",
  );

  const collectionInsights = document.getElementById("collection-insights");

  const collectionInsightsTitle = document.getElementById(
    "collection-insights-title",
  );

  const collectionInsightsNote = document.getElementById(
    "collection-insights-note",
  );

  const collectionInsightsToggle = document.getElementById(
    "collection-insights-toggle",
  );

  const collectionInsightsDetails = document.getElementById(
    "collection-insights-details",
  );

  const insightTotalSpent = document.getElementById("insight-total-spent");

  const insightTotalSpentNote = document.getElementById(
    "insight-total-spent-note",
  );

  const insightEstimatedValue = document.getElementById(
    "insight-estimated-value",
  );

  const insightEstimatedValueNote = document.getElementById(
    "insight-estimated-value-note",
  );

  const insightProfitLoss = document.getElementById("insight-profit-loss");

  const insightProfitLossNote = document.getElementById(
    "insight-profit-loss-note",
  );

  const insightPlatforms = document.getElementById("insight-platforms");

  const insightGenres = document.getElementById("insight-genres");

  const insightMedia = document.getElementById("insight-media");

  let archiveRecords = [];
  let collectionRecords = [];
  let gameCards = [];

  let customCollections = [];
  let collectionMemberships = new Map();
  let activeCollectionId = "all";
  let editingCollectionId = null;
  let memberDraft = new Set();
  let lastCollectionModalTrigger = null;
  let activeShare = null;

  let currentPage = 1;
  let currentUserId = null;
  let currentView = "grid";
  let cardImageLoadSequence = 0;
  const viewerImageCache = new Map();

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

    const configuredPageSize = appSettings?.get("collectionPageSize") || "remember";
    const storedPageSize = localStorage.getItem(getPreferenceKey("pageSize"));

    if (
      pageSizeSelect &&
      configuredPageSize !== "remember" &&
      ALLOWED_PAGE_SIZES.has(configuredPageSize)
    ) {
      pageSizeSelect.value = configuredPageSize;
    } else if (pageSizeSelect && ALLOWED_PAGE_SIZES.has(storedPageSize)) {
      pageSizeSelect.value = storedPageSize;
    } else if (pageSizeSelect) {
      pageSizeSelect.value = DEFAULT_PAGE_SIZE;
    }

    /* ---------- View ---------- */

    const configuredView = appSettings?.get("collectionView") || "remember";
    const storedView = localStorage.getItem(getPreferenceKey("view"));

    if (configuredView !== "remember" && ALLOWED_VIEWS.has(configuredView)) {
      applyCollectionView(configuredView);
    } else if (storedView && ALLOWED_VIEWS.has(storedView)) {
      applyCollectionView(storedView);
    } else {
      applyCollectionView(DEFAULT_VIEW);
    }

    /* ---------- Sort ---------- */

    const configuredSort = appSettings?.get("collectionSort") || "remember";
    const storedSort = localStorage.getItem(getPreferenceKey("sort"));

    if (
      sortSelect &&
      configuredSort !== "remember" &&
      selectHasValue(sortSelect, configuredSort)
    ) {
      sortSelect.value = configuredSort;
    } else if (sortSelect && selectHasValue(sortSelect, storedSort)) {
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
     Custom Collections
  ======================================== */

  function getActiveCustomCollection() {
    if (activeCollectionId === "all") {
      return null;
    }

    return (
      customCollections.find(
        (collection) => collection.id === activeCollectionId,
      ) || null
    );
  }

  function getCollectionMembers(collectionId) {
    return collectionMemberships.get(collectionId) || new Set();
  }

  function getRequestedCollectionId() {
    const value = new URL(window.location.href).searchParams.get("collection");

    return value || "all";
  }

  function updateCollectionUrl(collectionId) {
    const url = new URL(window.location.href);

    if (collectionId && collectionId !== "all") {
      url.searchParams.set("collection", collectionId);
    } else {
      url.searchParams.delete("collection");
    }

    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function buildShareUrl(token) {
    if (!token) {
      return "";
    }

    const url = new URL("shared.html", window.location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("t", token);

    return url.toString();
  }

  function setDialogStatus(element, message = "", type = "") {
    if (!element) {
      return;
    }

    element.textContent = message;
    element.classList.remove("error", "success");

    if (type) {
      element.classList.add(type);
    }
  }

  function openCollectionModal(modal, trigger, focusTarget) {
    if (!modal) {
      return;
    }

    lastCollectionModalTrigger = trigger || document.activeElement;

    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("collection-modal-open");

    requestAnimationFrame(() => {
      focusTarget?.focus();
    });
  }

  function closeCollectionModal(modal, { restoreFocus = true } = {}) {
    if (!modal || modal.hidden) {
      return;
    }

    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");

    const hasOpenModal = [
      collectionEditorModal,
      collectionMembersModal,
      collectionDeleteModal,
      collectionShareModal,
    ].some((candidate) => candidate && !candidate.hidden);

    if (!hasOpenModal) {
      document.body.classList.remove("collection-modal-open");
    }

    if (restoreFocus && lastCollectionModalTrigger instanceof HTMLElement) {
      lastCollectionModalTrigger.focus();
    }
  }

  function closeAllCollectionModals() {
    [
      collectionEditorModal,
      collectionMembersModal,
      collectionDeleteModal,
      collectionShareModal,
    ].forEach((modal) =>
      closeCollectionModal(modal, { restoreFocus: false }),
    );

    if (lastCollectionModalTrigger instanceof HTMLElement) {
      lastCollectionModalTrigger.focus();
    }
  }

  function updateCollectionHeader() {
    const activeCollection = getActiveCustomCollection();

    if (collectionEyebrow) {
      collectionEyebrow.textContent = activeCollection
        ? "CUSTOM COLLECTION"
        : "MY ARCHIVE";
    }

    if (collectionPageTitle) {
      collectionPageTitle.textContent = activeCollection?.name || "Collection";
    }

    if (collectionPageDescription) {
      const description = activeCollection?.description?.trim() || "";

      collectionPageDescription.textContent = description;
      collectionPageDescription.hidden = !description;
    }

    if (collectionScopeActions) {
      collectionScopeActions.hidden = !activeCollection;
    }

    document.title = activeCollection
      ? `${activeCollection.name} - Shelfmark`
      : "Collection - Shelfmark";
  }

  function createCollectionScopeButton({ id, name, count }) {
    const button = document.createElement("button");
    const label = document.createElement("span");
    const countElement = document.createElement("span");

    button.type = "button";
    button.className = "collection-scope-button";
    button.dataset.collectionId = id;
    button.setAttribute("role", "tab");

    const isActive = activeCollectionId === id;

    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));

    label.textContent = name;

    countElement.className = "collection-scope-button-count";
    countElement.textContent = String(count);

    button.append(label, countElement);

    button.addEventListener("click", () => {
      if (activeCollectionId === id) {
        return;
      }

      applyCollectionScope(id);
    });

    return button;
  }

  function renderCollectionScopes() {
    if (!collectionScopeList || !customCollectionsSection) {
      return;
    }

    customCollectionsSection.hidden = false;
    collectionScopeList.innerHTML = "";

    const fragment = document.createDocumentFragment();

    fragment.appendChild(
      createCollectionScopeButton({
        id: "all",
        name: "All games",
        count: archiveRecords.length,
      }),
    );

    customCollections.forEach((collection) => {
      fragment.appendChild(
        createCollectionScopeButton({
          id: collection.id,
          name: collection.name,
          count: getCollectionMembers(collection.id).size,
        }),
      );
    });

    collectionScopeList.appendChild(fragment);
  }

  function setActiveCollectionRecords(collectionId) {
    if (collectionId === "all") {
      collectionRecords = [...archiveRecords];
      return;
    }

    const memberIds = getCollectionMembers(collectionId);

    collectionRecords = archiveRecords.filter((record) =>
      memberIds.has(record.item?.id),
    );
  }

  function applyCollectionScope(
    collectionId,
    { updateUrl = true, restorePreferences = false } = {},
  ) {
    const validCollectionId =
      collectionId === "all" ||
      customCollections.some((collection) => collection.id === collectionId)
        ? collectionId
        : "all";

    activeCollectionId = validCollectionId;
    activeShare = null;
    currentPage = 1;

    setActiveCollectionRecords(activeCollectionId);
    updateCollectionHeader();
    renderCollectionScopes();
    populateFilters();

    if (restorePreferences) {
      restoreCollectionPreferences();
    }

    renderCollectionInsights();
    renderCollectionCards();

    if (updateUrl) {
      updateCollectionUrl(activeCollectionId);
    }
  }

  function applyCustomCollectionData(collections, members) {
    customCollections = [...(collections || [])].sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    collectionMemberships = new Map();

    customCollections.forEach((collection) => {
      collectionMemberships.set(collection.id, new Set());
    });

    (members || []).forEach((member) => {
      if (!collectionMemberships.has(member.collection_id)) {
        collectionMemberships.set(member.collection_id, new Set());
      }

      collectionMemberships.get(member.collection_id).add(member.item_id);
    });
  }

  async function refreshCustomCollectionData({ activateId = null } = {}) {
    const [collectionsResult, membersResult] = await Promise.all([
      supabaseClient
        .from("collections")
        .select("id,user_id,name,description,created_at,updated_at")
        .eq("user_id", currentUserId)
        .order("name", { ascending: true }),

      supabaseClient
        .from("collection_members")
        .select("collection_id,item_id,added_at"),
    ]);

    if (collectionsResult.error) {
      throw collectionsResult.error;
    }

    if (membersResult.error) {
      throw membersResult.error;
    }

    applyCustomCollectionData(collectionsResult.data, membersResult.data);

    const nextId = activateId || activeCollectionId;

    applyCollectionScope(nextId, {
      updateUrl: true,
      restorePreferences: false,
    });
  }

  function openCollectionEditor(collection = null, trigger = null) {
    editingCollectionId = collection?.id || null;

    if (collectionEditorTitle) {
      collectionEditorTitle.textContent = collection
        ? "Edit collection"
        : "Create collection";
    }

    if (collectionEditorSave) {
      collectionEditorSave.textContent = collection
        ? "Save changes"
        : "Create collection";
      collectionEditorSave.disabled = false;
    }

    if (collectionNameInput) {
      collectionNameInput.value = collection?.name || "";
    }

    if (collectionDescriptionInput) {
      collectionDescriptionInput.value = collection?.description || "";
    }

    setDialogStatus(collectionEditorStatus);

    openCollectionModal(collectionEditorModal, trigger, collectionNameInput);
  }

  async function saveCollectionEditor(event) {
    event.preventDefault();

    const name = collectionNameInput?.value.trim() || "";
    const description = collectionDescriptionInput?.value.trim() || "";

    if (!name) {
      setDialogStatus(
        collectionEditorStatus,
        "Enter a name for this collection.",
        "error",
      );
      collectionNameInput?.focus();
      return;
    }

    if (name.length > 80) {
      setDialogStatus(
        collectionEditorStatus,
        "Collection names can be up to 80 characters.",
        "error",
      );
      collectionNameInput?.focus();
      return;
    }

    if (description.length > 500) {
      setDialogStatus(
        collectionEditorStatus,
        "Descriptions can be up to 500 characters.",
        "error",
      );
      collectionDescriptionInput?.focus();
      return;
    }

    if (collectionEditorSave) {
      collectionEditorSave.disabled = true;
    }

    setDialogStatus(
      collectionEditorStatus,
      editingCollectionId ? "Saving changes…" : "Creating collection…",
    );

    try {
      let collectionId = editingCollectionId;

      if (editingCollectionId) {
        const { error } = await supabaseClient
          .from("collections")
          .update({
            name,
            description: description || null,
          })
          .eq("id", editingCollectionId);

        if (error) {
          throw error;
        }
      } else {
        const { data, error } = await supabaseClient
          .from("collections")
          .insert({
            user_id: currentUserId,
            name,
            description: description || null,
          })
          .select("id")
          .single();

        if (error) {
          throw error;
        }

        collectionId = data.id;
      }

      closeCollectionModal(collectionEditorModal, { restoreFocus: false });

      await refreshCustomCollectionData({ activateId: collectionId });
    } catch (error) {
      console.error("Shelfmark collection save error:", error);

      const duplicate = error?.code === "23505";

      setDialogStatus(
        collectionEditorStatus,
        duplicate
          ? "You already have a collection with that name."
          : "Shelfmark could not save this collection. Try again.",
        "error",
      );
    } finally {
      if (collectionEditorSave) {
        collectionEditorSave.disabled = false;
      }
    }
  }

  function updateMemberDraftCount() {
    if (!collectionMembersCount) {
      return;
    }

    const count = memberDraft.size;

    collectionMembersCount.textContent = `${count} ${
      count === 1 ? "game" : "games"
    } selected`;
  }

  function getMemberSearchText(record) {
    return [
      record.item?.title,
      record.game?.platform,
      record.game?.edition,
      record.game?.genre,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  function renderCollectionMemberList() {
    if (!collectionMembersList) {
      return;
    }

    const search = collectionMembersSearch?.value.trim().toLowerCase() || "";

    const records = [...archiveRecords]
      .filter((record) => getMemberSearchText(record).includes(search))
      .sort((a, b) =>
        (a.item?.title || "").localeCompare(b.item?.title || ""),
      );

    collectionMembersList.innerHTML = "";

    if (records.length === 0) {
      const empty = document.createElement("p");

      empty.className = "collection-members-empty";
      empty.textContent = archiveRecords.length
        ? "No games match that search."
        : "Your archive does not contain any games yet.";

      collectionMembersList.appendChild(empty);
      updateMemberDraftCount();
      return;
    }

    const fragment = document.createDocumentFragment();

    records.forEach((record) => {
      const itemId = record.item?.id;

      if (!itemId) {
        return;
      }

      const row = document.createElement("label");
      const checkbox = document.createElement("input");
      const copy = document.createElement("span");
      const title = document.createElement("span");
      const meta = document.createElement("span");

      row.className = "collection-member-row";

      checkbox.type = "checkbox";
      checkbox.value = itemId;
      checkbox.checked = memberDraft.has(itemId);

      copy.className = "collection-member-copy";
      title.className = "collection-member-title";
      meta.className = "collection-member-meta";

      title.textContent = record.item?.title || "Untitled game";

      const metaParts = [
        record.game?.platform,
        record.game?.edition && record.game.edition !== "Standard Edition"
          ? record.game.edition
          : null,
      ].filter(Boolean);

      meta.textContent = metaParts.join(" · ") || "No additional details";

      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          memberDraft.add(itemId);
        } else {
          memberDraft.delete(itemId);
        }

        updateMemberDraftCount();
      });

      copy.append(title, meta);
      row.append(checkbox, copy);
      fragment.appendChild(row);
    });

    collectionMembersList.appendChild(fragment);
    updateMemberDraftCount();
  }

  function openCollectionMembersManager(trigger = null) {
    const collection = getActiveCustomCollection();

    if (!collection) {
      return;
    }

    memberDraft = new Set(getCollectionMembers(collection.id));

    if (collectionMembersSubtitle) {
      collectionMembersSubtitle.textContent = `${collection.name} · choose games already in your archive`;
    }

    if (collectionMembersSearch) {
      collectionMembersSearch.value = "";
    }

    setDialogStatus(collectionMembersStatus);
    renderCollectionMemberList();

    openCollectionModal(
      collectionMembersModal,
      trigger,
      collectionMembersSearch,
    );
  }

  async function saveCollectionMembers() {
    const collection = getActiveCustomCollection();

    if (!collection) {
      return;
    }

    const existing = new Set(getCollectionMembers(collection.id));
    const toAdd = [...memberDraft].filter((itemId) => !existing.has(itemId));
    const toRemove = [...existing].filter((itemId) => !memberDraft.has(itemId));

    if (collectionMembersSave) {
      collectionMembersSave.disabled = true;
    }

    setDialogStatus(collectionMembersStatus, "Saving collection games…");

    try {
      if (toAdd.length > 0) {
        const { error } = await supabaseClient.from("collection_members").insert(
          toAdd.map((itemId) => ({
            collection_id: collection.id,
            item_id: itemId,
          })),
        );

        if (error) {
          throw error;
        }
      }

      if (toRemove.length > 0) {
        const { error } = await supabaseClient
          .from("collection_members")
          .delete()
          .eq("collection_id", collection.id)
          .in("item_id", toRemove);

        if (error) {
          throw error;
        }
      }

      closeCollectionModal(collectionMembersModal, { restoreFocus: false });

      await refreshCustomCollectionData({ activateId: collection.id });
    } catch (error) {
      console.error("Shelfmark membership save error:", error);

      setDialogStatus(
        collectionMembersStatus,
        "Shelfmark could not save all membership changes. Reload and try again.",
        "error",
      );
    } finally {
      if (collectionMembersSave) {
        collectionMembersSave.disabled = false;
      }
    }
  }

  function openCollectionDeleteConfirmation(trigger = null) {
    const collection = getActiveCustomCollection();

    if (!collection) {
      return;
    }

    if (collectionDeleteCopy) {
      collectionDeleteCopy.textContent = `Delete “${collection.name}”?`;
    }

    setDialogStatus(collectionDeleteStatus);

    if (collectionDeleteConfirm) {
      collectionDeleteConfirm.disabled = false;
    }

    openCollectionModal(collectionDeleteModal, trigger, collectionDeleteConfirm);
  }

  async function deleteActiveCollection() {
    const collection = getActiveCustomCollection();

    if (!collection) {
      return;
    }

    if (collectionDeleteConfirm) {
      collectionDeleteConfirm.disabled = true;
    }

    setDialogStatus(collectionDeleteStatus, "Deleting collection…");

    try {
      const { error } = await supabaseClient
        .from("collections")
        .delete()
        .eq("id", collection.id);

      if (error) {
        throw error;
      }

      closeCollectionModal(collectionDeleteModal, { restoreFocus: false });

      await refreshCustomCollectionData({ activateId: "all" });
    } catch (error) {
      console.error("Shelfmark collection delete error:", error);

      setDialogStatus(
        collectionDeleteStatus,
        "Shelfmark could not delete this collection. Try again.",
        "error",
      );
    } finally {
      if (collectionDeleteConfirm) {
        collectionDeleteConfirm.disabled = false;
      }
    }
  }

  /* ========================================
     Public Sharing
  ======================================== */

  async function loadActiveShare() {
    if (!supabaseClient || !currentUserId) {
      activeShare = null;
      return null;
    }

    const isArchive = activeCollectionId === "all";

    let query = supabaseClient
      .from("collection_shares")
      .select(
        "id,user_id,scope_type,collection_id,share_token,is_enabled,show_photos,show_estimated_value,show_purchase_price,show_purchase_date,show_value_difference,created_at,updated_at",
      )
      .eq("user_id", currentUserId)
      .eq("scope_type", isArchive ? "archive" : "collection");

    query = isArchive
      ? query.is("collection_id", null)
      : query.eq("collection_id", activeCollectionId);

    const { data, error } = await query.maybeSingle();

    if (error) {
      throw error;
    }

    activeShare = data || null;
    return activeShare;
  }

  function updateShareLinkUi() {
    const enabled = Boolean(collectionShareEnabled?.checked);
    const shareUrl = activeShare?.share_token
      ? buildShareUrl(activeShare.share_token)
      : "";

    if (collectionShareUrl) {
      collectionShareUrl.value = shareUrl;
    }

    if (collectionShareLinkWrap) {
      collectionShareLinkWrap.hidden = !enabled || !shareUrl;
    }

    if (collectionShareRegenerate) {
      collectionShareRegenerate.disabled = !activeShare?.id;
    }
  }

  function populateShareForm() {
    if (collectionShareEnabled) {
      collectionShareEnabled.checked = Boolean(activeShare?.is_enabled);
    }

    if (shareShowPhotos) {
      shareShowPhotos.checked = activeShare?.show_photos ?? true;
    }

    if (shareShowEstimatedValue) {
      shareShowEstimatedValue.checked =
        activeShare?.show_estimated_value ?? false;
    }

    if (shareShowPurchasePrice) {
      shareShowPurchasePrice.checked =
        activeShare?.show_purchase_price ?? false;
    }

    if (shareShowPurchaseDate) {
      shareShowPurchaseDate.checked =
        activeShare?.show_purchase_date ?? false;
    }

    if (shareShowValueDifference) {
      shareShowValueDifference.checked =
        activeShare?.show_value_difference ?? false;
    }

    updateShareLinkUi();
  }

  async function openShareManager(trigger = null) {
    const activeCollection = getActiveCustomCollection();

    if (collectionShareTitle) {
      collectionShareTitle.textContent = activeCollection
        ? `Share ${activeCollection.name}`
        : "Share archive";
    }

    setDialogStatus(collectionShareStatus, "Loading sharing settings…");
    openCollectionModal(
      collectionShareModal,
      trigger || collectionShareButton,
      collectionShareEnabled,
    );

    try {
      await loadActiveShare();
      populateShareForm();

      setDialogStatus(
        collectionShareStatus,
        activeShare?.is_enabled
          ? "Public sharing is enabled."
          : "Sharing is currently disabled.",
        activeShare?.is_enabled ? "success" : "",
      );
    } catch (error) {
      console.error("Shelfmark share load error:", error);
      setDialogStatus(
        collectionShareStatus,
        "Sharing settings could not be loaded. Make sure the Step 5 Supabase migration has been applied.",
        "error",
      );
    }
  }

  function getSharePayload() {
    const isArchive = activeCollectionId === "all";

    return {
      user_id: currentUserId,
      scope_type: isArchive ? "archive" : "collection",
      collection_id: isArchive ? null : activeCollectionId,
      is_enabled: Boolean(collectionShareEnabled?.checked),
      show_photos: Boolean(shareShowPhotos?.checked),
      show_estimated_value: Boolean(shareShowEstimatedValue?.checked),
      show_purchase_price: Boolean(shareShowPurchasePrice?.checked),
      show_purchase_date: Boolean(shareShowPurchaseDate?.checked),
      show_value_difference: Boolean(shareShowValueDifference?.checked),
    };
  }

  async function saveShareSettings() {
    if (!supabaseClient || !currentUserId || !collectionShareSave) {
      return;
    }

    const payload = getSharePayload();

    collectionShareSave.disabled = true;
    setDialogStatus(collectionShareStatus, "Saving sharing settings…");

    try {
      if (activeShare?.id) {
        const { data, error } = await supabaseClient
          .from("collection_shares")
          .update(payload)
          .eq("id", activeShare.id)
          .eq("user_id", currentUserId)
          .select(
            "id,user_id,scope_type,collection_id,share_token,is_enabled,show_photos,show_estimated_value,show_purchase_price,show_purchase_date,show_value_difference,created_at,updated_at",
          )
          .single();

        if (error) {
          throw error;
        }

        activeShare = data;
      } else {
        const { data, error } = await supabaseClient
          .from("collection_shares")
          .insert(payload)
          .select(
            "id,user_id,scope_type,collection_id,share_token,is_enabled,show_photos,show_estimated_value,show_purchase_price,show_purchase_date,show_value_difference,created_at,updated_at",
          )
          .single();

        if (error) {
          throw error;
        }

        activeShare = data;
      }

      populateShareForm();

      setDialogStatus(
        collectionShareStatus,
        payload.is_enabled
          ? "Sharing settings saved. The public link is ready."
          : "Sharing is disabled. Anyone opening the link will no longer be able to load the collection.",
        payload.is_enabled ? "success" : "",
      );
    } catch (error) {
      console.error("Shelfmark share save error:", error);
      setDialogStatus(
        collectionShareStatus,
        "Sharing settings could not be saved. Please try again.",
        "error",
      );
    } finally {
      collectionShareSave.disabled = false;
    }
  }

  async function regenerateShareLink() {
    if (!activeShare?.id || !supabaseClient || !currentUserId) {
      return;
    }

    if (collectionShareRegenerate) {
      collectionShareRegenerate.disabled = true;
    }

    setDialogStatus(collectionShareStatus, "Generating a new link…");

    try {
      const nextToken = crypto.randomUUID();

      const { data, error } = await supabaseClient
        .from("collection_shares")
        .update({ share_token: nextToken })
        .eq("id", activeShare.id)
        .eq("user_id", currentUserId)
        .select(
          "id,user_id,scope_type,collection_id,share_token,is_enabled,show_photos,show_estimated_value,show_purchase_price,show_purchase_date,show_value_difference,created_at,updated_at",
        )
        .single();

      if (error) {
        throw error;
      }

      activeShare = data;
      populateShareForm();

      setDialogStatus(
        collectionShareStatus,
        "A new public link was generated. The previous link is no longer valid.",
        "success",
      );
    } catch (error) {
      console.error("Shelfmark share regenerate error:", error);
      setDialogStatus(
        collectionShareStatus,
        "A new link could not be generated. Please try again.",
        "error",
      );
    } finally {
      if (collectionShareRegenerate) {
        collectionShareRegenerate.disabled = false;
      }
    }
  }

  async function copyShareLink() {
    const value = collectionShareUrl?.value || "";

    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setDialogStatus(collectionShareStatus, "Public link copied.", "success");
    } catch (error) {
      collectionShareUrl?.select();

      try {
        document.execCommand?.("copy");
      } catch (_) {
        // The selected URL can still be copied manually.
      }

      setDialogStatus(
        collectionShareStatus,
        "The link is selected. Copy it manually if your browser blocked clipboard access.",
      );
    }
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

    [
      collectionCreateButton,
      collectionManageButton,
      collectionEditButton,
      collectionDeleteButton,
      collectionShareButton,
    ].forEach((button) => {
      if (button) {
        button.disabled = disabled;
      }
    });

    collectionScopeList
      ?.querySelectorAll(".collection-scope-button")
      .forEach((button) => {
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
    const activeCollection = getActiveCustomCollection();
    const locationLabel = activeCollection
      ? ` in ${activeCollection.name}`
      : " in your collection";

    if (matchingCount !== total) {
      collectionCount.textContent = `${matchingCount} of ${total} ${
        total === 1 ? "game" : "games"
      }${locationLabel}`;
      return;
    }

    collectionCount.textContent = `${total} ${
      total === 1 ? "game" : "games"
    }${locationLabel}`;
  }

  function toFiniteNumber(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    const number = Number(value);

    return Number.isFinite(number) ? number : null;
  }

  function getBreakdownEntries(values) {
    const counts = new Map();

    values.filter(Boolean).forEach((value) => {
      counts.set(value, (counts.get(value) || 0) + 1);
    });

    return [...counts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }

  function renderBreakdown(container, entries, emptyMessage, limit = 6) {
    if (!container) {
      return;
    }

    container.innerHTML = "";

    if (!entries.length) {
      const empty = document.createElement("p");

      empty.className = "collection-breakdown-empty";
      empty.textContent = emptyMessage;

      container.appendChild(empty);

      return;
    }

    entries.slice(0, limit).forEach((entry) => {
      const row = document.createElement("div");
      const label = document.createElement("span");
      const count = document.createElement("span");

      row.className = "collection-breakdown-row";
      label.className = "collection-breakdown-label";
      count.className = "collection-breakdown-count";

      label.textContent = entry.label;
      label.title = entry.label;

      count.textContent = String(entry.count);

      row.append(label, count);
      container.appendChild(row);
    });
  }

  function setCollectionInsightsExpanded(expanded) {
    if (!collectionInsightsToggle || !collectionInsightsDetails) {
      return;
    }

    collectionInsightsToggle.setAttribute(
      "aria-expanded",
      expanded ? "true" : "false",
    );

    collectionInsightsDetails.hidden = !expanded;

    const label = collectionInsightsToggle.querySelector("span");

    if (label) {
      label.textContent = expanded ? "Hide details" : "View details";
    }
  }

  function renderCollectionInsights() {
    if (!collectionInsights) {
      return;
    }

    const activeCollection = getActiveCustomCollection();
    const totalGames = collectionRecords.length;

    if (collectionInsightsTitle) {
      collectionInsightsTitle.textContent = activeCollection
        ? `${activeCollection.name} summary`
        : "Archive summary";
    }

    collectionInsights.hidden = totalGames === 0;

    if (totalGames === 0) {
      return;
    }

    setCollectionInsightsExpanded(false);

    let totalSpent = 0;
    let spentCount = 0;

    let totalEstimatedValue = 0;
    let estimatedCount = 0;

    let trackedProfitLoss = 0;
    let trackedProfitLossCount = 0;

    collectionRecords.forEach((record) => {
      const purchasePrice = toFiniteNumber(record.item?.purchase_price);
      const estimatedValue = toFiniteNumber(record.item?.estimated_value);

      if (purchasePrice !== null) {
        totalSpent += purchasePrice;
        spentCount += 1;
      }

      if (estimatedValue !== null) {
        totalEstimatedValue += estimatedValue;
        estimatedCount += 1;
      }

      if (purchasePrice !== null && estimatedValue !== null) {
        trackedProfitLoss += estimatedValue - purchasePrice;
        trackedProfitLossCount += 1;
      }
    });

    if (insightTotalSpent) {
      insightTotalSpent.textContent = formatCurrency(totalSpent);
    }

    if (insightTotalSpentNote) {
      insightTotalSpentNote.textContent = spentCount
        ? `${spentCount} ${spentCount === 1 ? "game has" : "games have"} a purchase price`
        : "No purchase prices yet";
    }

    if (insightEstimatedValue) {
      insightEstimatedValue.textContent = formatCurrency(totalEstimatedValue);
    }

    if (insightEstimatedValueNote) {
      insightEstimatedValueNote.textContent = estimatedCount
        ? `${estimatedCount} of ${totalGames} ${totalGames === 1 ? "game" : "games"} valued`
        : "No estimates yet";
    }

    if (insightProfitLoss) {
      insightProfitLoss.textContent = formatCurrency(trackedProfitLoss);

      insightProfitLoss.classList.remove("positive", "negative");

      if (trackedProfitLossCount > 0 && trackedProfitLoss > 0) {
        insightProfitLoss.classList.add("positive");
      } else if (trackedProfitLossCount > 0 && trackedProfitLoss < 0) {
        insightProfitLoss.classList.add("negative");
      }
    }

    if (insightProfitLossNote) {
      insightProfitLossNote.textContent = trackedProfitLossCount
        ? `${trackedProfitLossCount} ${trackedProfitLossCount === 1 ? "game" : "games"} with both values`
        : "No comparable values yet";
    }

    if (collectionInsightsNote) {
      const scopeLabel = activeCollection
        ? `this collection`
        : `your archive`;

      collectionInsightsNote.textContent =
        estimatedCount === totalGames
          ? `Estimated value covers every catalogued game in ${scopeLabel}. Profit / loss compares games that also have a purchase price.`
          : `Estimated value currently covers ${estimatedCount} of ${totalGames} ${totalGames === 1 ? "game" : "games"} in ${scopeLabel}. Profit / loss compares only entries with both values.`;
    }

    renderBreakdown(
      insightPlatforms,
      getBreakdownEntries(
        collectionRecords.map((record) => record.game?.platform || ""),
      ),
      "No platform information recorded yet.",
    );

    renderBreakdown(
      insightGenres,
      getBreakdownEntries(
        collectionRecords.map((record) => record.game?.genre || ""),
      ),
      "No genre information recorded yet.",
    );

    const mediaLabels = {
      disc: "Disc",
      cartridge: "Cartridge",
    };

    renderBreakdown(
      insightMedia,
      getBreakdownEntries(
        collectionRecords.map((record) => {
          const mediaType = record.game?.media_type || "";
          return mediaLabels[mediaType] || mediaType;
        }),
      ),
      "No media information recorded yet.",
    );
  }

  function updateEmptyState(visibleCount) {
    if (!emptyState) {
      return;
    }

    const total = collectionRecords.length;
    const archiveTotal = archiveRecords.length;
    const activeCollection = getActiveCustomCollection();

    if (collectionAddButton) {
      collectionAddButton.hidden = archiveTotal === 0;
    }

    if (collectionShareButton) {
      collectionShareButton.hidden = archiveTotal === 0;
    }

    const shouldShow = visibleCount === 0;

    emptyState.classList.toggle("visible", shouldShow);

    if (!shouldShow) {
      if (emptyAddButton) {
        emptyAddButton.hidden = true;
      }
      return;
    }

    if (total === 0 && activeCollection) {
      if (emptyTitle) {
        emptyTitle.textContent = `No games in ${activeCollection.name} yet.`;
      }

      if (emptyMessage) {
        emptyMessage.textContent = archiveTotal
          ? "Use Manage games above to add existing games from your archive."
          : "Add your first physical game to the archive, then add it to this collection.";
      }

      if (emptyAddButton) {
        emptyAddButton.hidden = archiveTotal > 0;
      }

      return;
    }

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
    if (!game) {
      return 0.76;
    }

    return formatLibrary.getCaseRatio({
      caseFormat: game.case_format,

      role: "cover",

      customWidth: game.custom_case_width,

      customHeight: game.custom_case_height,
    });
  }

  function getCaseDisplayScale(game) {
    const REFERENCE_WIDTH = 142;
    const REFERENCE_HEIGHT = 190;

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
        width: Math.min(1, physicalWidth / REFERENCE_WIDTH),
        height: Math.min(1, physicalHeight / REFERENCE_HEIGHT),
      };
    }

    /*
      Custom cases do not have a reliable real-world
      size, only a ratio. Fit them inside the same visual
      stage without distorting their proportions.
    */

    const ratio = getCaseRatio(game);
    const referenceRatio = REFERENCE_WIDTH / REFERENCE_HEIGHT;

    if (!Number.isFinite(ratio) || ratio <= 0) {
      return { width: 135 / REFERENCE_WIDTH, height: 1 };
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

  function getMediaDefinition(record) {
    const game = record?.game;

    if (!game) {
      return null;
    }

    return formatLibrary.getMediaDefinition({
      mediaFormat: game.media_format || "",

      platform: game.platform || "",

      mediaType: game.media_type || "",
    });
  }

  function getMediaDisplayScale(record) {
    const REFERENCE_WIDTH = 142;
    const REFERENCE_HEIGHT = 190;

    const definition = getMediaDefinition(record);
    const mediaType = record?.game?.media_type || "";

    let physicalWidth = Number(definition?.widthMm);
    let physicalHeight = Number(definition?.heightMm);

    /*
      Generic cartridge formats do not have one universal
      physical size. Give them a conservative fallback while
      known formats use their approximate real dimensions.
    */
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
      width: Math.min(1, physicalWidth / REFERENCE_WIDTH),
      height: Math.min(1, physicalHeight / REFERENCE_HEIGHT),
    };
  }

  function usesMediaAsPrimaryVisual(item, game) {
    const mediaType = game?.media_type || "";

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
    return images.find((image) => image.image_type === "front") || null;
  }

  function canViewPhysicalViewer(record) {
    const item = record?.item;
    const game = record?.game;

    if (!item || !game) {
      return false;
    }

    const hasCase = Boolean(
      formatLibrary.normalizeCaseFormat(game.case_format),
    );

    const hasMedia =
      game.media_type === "disc" || game.media_type === "cartridge";

    return hasCase || hasMedia;
  }

  function chooseMediaImage(images, mediaType) {
    /* ====================================
       CARTRIDGE
    ==================================== */

    if (mediaType === "cartridge") {
      return images.find((image) => image.image_type === "cartridge") || null;
    }

    /* ====================================
       DISC

       For multi-disc games, use the first
       photographed disc on the card.
    ==================================== */

    if (mediaType === "disc") {
      return [...images]
        .filter((image) => image.image_type === "disc")
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

  async function addSignedUrls(images, options = {}) {
    return window.ShelfmarkStorage.addSignedUrls(images, options);
  }

  async function loadViewerImages(record) {
    const itemId = record?.item?.id;

    if (!itemId) {
      return [];
    }

    if (viewerImageCache.has(itemId)) {
      return viewerImageCache.get(itemId);
    }

    const request = (async () => {
      const { data, error } = await supabaseClient
        .from("item_images")
        .select(
          "id,item_id,image_type,storage_path,thumbnail_path,disc_number,sort_order,created_at",
        )
        .eq("item_id", itemId)
        .order("sort_order", { ascending: true });

      if (error) {
        throw error;
      }

      return addSignedUrls(data || []);
    })();

    viewerImageCache.set(itemId, request);

    try {
      const images = await request;
      viewerImageCache.set(itemId, images);
      return images;
    } catch (error) {
      viewerImageCache.delete(itemId);
      throw error;
    }
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

  function createDiscVisual(record, mediaImage, { isPrimary = false } = {}) {
    const disc = document.createElement("div");

    const mediaDefinition = getMediaDefinition(record);

    disc.className = "game-disc";

    disc.classList.add(`media-shape-${mediaDefinition?.shape || "disc"}`);

    disc.style.aspectRatio = String(mediaDefinition?.ratio || 1);

    disc.dataset.rotates = mediaDefinition?.rotates ? "true" : "false";

    /* ====================================
       REAL DISC PHOTO
    ==================================== */

    if (mediaImage?.storage_path) {
      const image = document.createElement("img");

      disc.classList.add("has-real-media");

      image.dataset.storagePath = mediaImage.storage_path;
      image.dataset.thumbnailPath = mediaImage.thumbnail_path || "";
      image.dataset.imageKind = isPrimary ? "primary" : "secondary";

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

  function createCartridgeVisual(record, mediaImage, { isPrimary = false } = {}) {
    const cartridge = document.createElement("div");

    const mediaDefinition = getMediaDefinition(record);

    cartridge.className = "game-cartridge";

    cartridge.classList.add(
      `media-shape-${mediaDefinition?.shape || "rounded"}`,
    );

    cartridge.style.aspectRatio = String(mediaDefinition?.ratio || 0.78);

    /* ====================================
       REAL CARTRIDGE PHOTO
    ==================================== */

    if (mediaImage?.storage_path) {
      const image = document.createElement("img");

      cartridge.classList.add("has-real-media");

      image.dataset.storagePath = mediaImage.storage_path;
      image.dataset.thumbnailPath = mediaImage.thumbnail_path || "";
      image.dataset.imageKind = isPrimary ? "primary" : "secondary";

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

    const mediaIsPrimary = usesMediaAsPrimaryVisual(item, game);

    /* ====================================
       ARTICLE
    ==================================== */

    const card = document.createElement("article");

    card.className = "game-card";

    if (mediaIsPrimary) {
      card.classList.add("media-primary");
      card.dataset.primaryVisual = game?.media_type || "media";
    }

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

    const caseDisplayScale = getCaseDisplayScale(game);
    const mediaDisplayScale = getMediaDisplayScale(record);

    visual.style.setProperty(
      "--case-width-scale",
      String(caseDisplayScale.width),
    );

    visual.style.setProperty(
      "--case-height-scale",
      String(caseDisplayScale.height),
    );

    visual.style.setProperty(
      "--media-width-scale",
      String(mediaDisplayScale.width),
    );

    visual.style.setProperty(
      "--media-height-scale",
      String(mediaDisplayScale.height),
    );

    /* ====================================
       CASE
    ==================================== */

    if (!mediaIsPrimary) {
      const gameCase = document.createElement("div");

      gameCase.className = "game-case";

      if (frontImage?.storage_path) {
        const coverImage = document.createElement("img");

        coverImage.dataset.storagePath = frontImage.storage_path;
        coverImage.dataset.thumbnailPath = frontImage.thumbnail_path || "";
        coverImage.dataset.imageKind = "primary";

        coverImage.alt = `${item.title} front cover`;

        coverImage.loading = "lazy";

        coverImage.decoding = "async";

        gameCase.appendChild(coverImage);
      } else {
        gameCase.appendChild(createCasePlaceholder(item.title));
      }

      visual.appendChild(gameCase);
    }

    /* ====================================
       MEDIA
    ==================================== */

    if (game?.media_type === "disc") {
      visual.appendChild(
        createDiscVisual(record, mediaImage, { isPrimary: mediaIsPrimary }),
      );
    } else if (game?.media_type === "cartridge") {
      visual.appendChild(
        createCartridgeVisual(record, mediaImage, { isPrimary: mediaIsPrimary }),
      );
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

    /* ====================================
       3D CASE VIEWER
    ==================================== */

    if (canViewPhysicalViewer(record)) {
      const caseViewButton = document.createElement("button");

      caseViewButton.type = "button";
      caseViewButton.className = "game-case-view-button";
      caseViewButton.title = "View physical copy in 3D";
      caseViewButton.setAttribute(
        "aria-label",
        `View ${item.title || "game"} physical copy in 3D`,
      );

      caseViewButton.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"></path>
          <circle cx="12" cy="12" r="2.75"></circle>
        </svg>
      `;

      caseViewButton.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (caseViewButton.disabled) {
          return;
        }

        caseViewButton.disabled = true;
        caseViewButton.classList.add("is-loading");

        try {
          const images = await loadViewerImages(record);

          caseViewer.open(
            {
              ...record,
              images,
            },
            {
              trigger: caseViewButton,
            },
          );
        } catch (error) {
          console.error("Shelfmark physical viewer image load error:", error);
          window.alert("Shelfmark could not load the full-resolution physical images. Please try again.");
        } finally {
          caseViewButton.disabled = false;
          caseViewButton.classList.remove("is-loading");
        }
      });

      card.appendChild(caseViewButton);
    }

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
      behavior:
        window.ShelfmarkSettings?.getEffectiveMotion?.() === "full"
          ? "smooth"
          : "auto",
      block: "start",
    });
  }

  /* ========================================
     Deferred Card Images

     Cards are created up front so existing filtering and sorting stay fast,
     but hidden pagination pages do not receive image src values. This avoids
     downloading covers and media that the user has not actually viewed.
  ======================================== */

  async function activateCardImages(cards) {
    const pending = [];

    cards.forEach((card) => {
      card.querySelectorAll("img[data-storage-path]:not([src])").forEach((image) => {
        const storagePath = image.dataset.storagePath;
        const isSecondaryImage = image.dataset.imageKind === "secondary";

        if (!storagePath) {
          return;
        }

        if (appSettings?.isDataSaver?.() && isSecondaryImage) {
          return;
        }

        pending.push({
          element: image,
          storage_path: storagePath,
          thumbnail_path: image.dataset.thumbnailPath || null,
        });
      });
    });

    if (!pending.length) {
      return;
    }

    const sequence = ++cardImageLoadSequence;

    try {
      const signed = await addSignedUrls(pending, { preferThumbnail: true });

      if (sequence !== cardImageLoadSequence) {
        return;
      }

      signed.forEach((entry, index) => {
        const element = pending[index]?.element;

        if (!element?.isConnected || !entry?.signedUrl || element.src) {
          return;
        }

        element.src = entry.signedUrl;
      });
    } catch (error) {
      console.warn("Shelfmark card image load error:", error);
    }
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

    if (currentView === "grid") {
      void activateCardImages([...visibleCards]);
    }

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

      state.image.style.transform = `translateZ(0) rotate(${state.angle}deg)`;

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

    /*
      Release the temporary compositor layer once the disc has slid back in.
      Chromium-based browsers can otherwise leave stale transparent rotation
      frames behind until the next full repaint.
    */
    if (state.disc && state.image) {
      state.disc.style.willChange = "auto";
      state.image.style.willChange = "auto";

      requestAnimationFrame(() => {
        if (state.spinning) {
          return;
        }

        // Force one clean paint before restoring hover acceleration hints.
        void state.disc.offsetWidth;
        state.disc.style.willChange = "";
        state.image.style.willChange = "";
      });
    }
  }

  function setupDiscStates() {
    gameCards.forEach((card) => {
      const disc = card.querySelector(".game-disc");

      const discImage = disc?.querySelector("img");

      /*
          A generic disc placeholder can still slide out with CSS,
          but only real disc photos spin. Media-only copies are
          presented as the primary object and stay still.
        */
      if (
        card.classList.contains("media-primary") ||
        !disc ||
        !discImage ||
        disc.dataset.rotates === "false"
      ) {
        return;
      }

      const state = {
        disc,
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
        state.disc.style.willChange = "transform, opacity";
        state.image.style.willChange = "transform";

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
        { error: true },
      );

      setControlsDisabled(true);
      return;
    }

    setControlsDisabled(true);

    if (customCollectionsSection) {
      customCollectionsSection.hidden = true;
    }

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

    if (collectionAddButton) {
      collectionAddButton.hidden = true;
    }

    if (collectionInsights) {
      collectionInsights.hidden = true;
    }

    showCollectionState(
      "Loading collection…",
      "Retrieving the games in your Shelfmark archive.",
    );

    try {
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
      viewerImageCache.clear();

      const [itemsResult, collectionsResult, membersResult] = await Promise.all([
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
              purchase_price,
              estimated_value,
              created_at,
              updated_at
            `,
          )
          .eq("user_id", user.id)
          .eq("category", "game")
          .order("created_at", { ascending: false }),

        supabaseClient
          .from("collections")
          .select("id,user_id,name,description,created_at,updated_at")
          .eq("user_id", user.id)
          .order("name", { ascending: true }),

        supabaseClient
          .from("collection_members")
          .select("collection_id,item_id,added_at"),
      ]);

      if (itemsResult.error) {
        throw itemsResult.error;
      }

      if (collectionsResult.error) {
        throw collectionsResult.error;
      }

      if (membersResult.error) {
        throw membersResult.error;
      }

      applyCustomCollectionData(collectionsResult.data, membersResult.data);

      const safeItems = itemsResult.data || [];

      if (safeItems.length === 0) {
        archiveRecords = [];
        collectionRecords = [];
        gameCards = [];

        const requestedId = getRequestedCollectionId();
        activeCollectionId =
          requestedId === "all" ||
          customCollections.some((collection) => collection.id === requestedId)
            ? requestedId
            : "all";

        updateCollectionHeader();
        renderCollectionScopes();
        updateCollectionUrl(activeCollectionId);
        populateFilters();
        restoreCollectionPreferences();
        renderCollectionInsights();
        renderCollectionCards();

        hideCollectionState();
        setControlsDisabled(false);
        restoreCollectionPosition();
        return;
      }

      const itemIds = safeItems.map((item) => item.id);

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
                media_format,
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
                thumbnail_path,
                disc_number,
                sort_order
              `,
          )
          .in("item_id", itemIds)
          .in("image_type", ["front", "disc", "cartridge"])
          .order("sort_order", { ascending: true }),
      ]);

      if (gamesResult.error) {
        throw gamesResult.error;
      }

      if (imagesResult.error) {
        throw imagesResult.error;
      }

      const gamesByItemId = new Map();
      const imagesByItemId = new Map();

      (gamesResult.data || []).forEach((game) => {
        gamesByItemId.set(game.item_id, game);
      });

      (imagesResult.data || []).forEach((image) => {
        if (!imagesByItemId.has(image.item_id)) {
          imagesByItemId.set(image.item_id, []);
        }

        imagesByItemId.get(image.item_id).push(image);
      });

      archiveRecords = safeItems.map((item) => ({
        item,
        game: gamesByItemId.get(item.id) || null,
        images: imagesByItemId.get(item.id) || [],
      }));

      const requestedId = getRequestedCollectionId();
      activeCollectionId =
        requestedId === "all" ||
        customCollections.some((collection) => collection.id === requestedId)
          ? requestedId
          : "all";

      setActiveCollectionRecords(activeCollectionId);
      updateCollectionHeader();
      renderCollectionScopes();
      updateCollectionUrl(activeCollectionId);
      populateFilters();
      restoreCollectionPreferences();
      renderCollectionInsights();
      renderCollectionCards();

      hideCollectionState();
      setControlsDisabled(false);
      restoreCollectionPosition();
    } catch (error) {
      console.error("Shelfmark collection load error:", error);

      archiveRecords = [];
      collectionRecords = [];
      customCollections = [];
      collectionMemberships = new Map();
      gameCards = [];

      if (collectionGrid) {
        collectionGrid.innerHTML = "";
      }

      if (customCollectionsSection) {
        customCollectionsSection.hidden = true;
      }

      if (emptyState) {
        emptyState.classList.remove("visible");
      }

      if (collectionCount) {
        collectionCount.textContent = "Collection unavailable";
      }

      if (collectionAddButton) {
        collectionAddButton.hidden = true;
      }

      if (collectionShareButton) {
        collectionShareButton.hidden = true;
      }

      if (collectionInsights) {
        collectionInsights.hidden = true;
      }

      setControlsDisabled(true);

      showCollectionState(
        "Unable to load collection",
        "Shelfmark could not load your games. Check your connection and try again.",
        { error: true },
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

  collectionInsightsToggle?.addEventListener("click", () => {
    const expanded =
      collectionInsightsToggle.getAttribute("aria-expanded") === "true";

    setCollectionInsightsExpanded(!expanded);
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

      if (view === "grid") {
        filterCollection();
      }

      saveCollectionPreferences();
    });
  });

  collectionCreateButton?.addEventListener("click", () => {
    openCollectionEditor(null, collectionCreateButton);
  });

  collectionEditButton?.addEventListener("click", () => {
    const collection = getActiveCustomCollection();

    if (collection) {
      openCollectionEditor(collection, collectionEditButton);
    }
  });

  collectionManageButton?.addEventListener("click", () => {
    openCollectionMembersManager(collectionManageButton);
  });

  collectionDeleteButton?.addEventListener("click", () => {
    openCollectionDeleteConfirmation(collectionDeleteButton);
  });

  collectionShareButton?.addEventListener("click", () => {
    openShareManager(collectionShareButton);
  });

  collectionEditorForm?.addEventListener("submit", saveCollectionEditor);

  collectionMembersSearch?.addEventListener("input", renderCollectionMemberList);

  collectionMembersSave?.addEventListener("click", saveCollectionMembers);

  collectionDeleteConfirm?.addEventListener("click", deleteActiveCollection);

  collectionShareEnabled?.addEventListener("change", () => {
    updateShareLinkUi();
    setDialogStatus(
      collectionShareStatus,
      collectionShareEnabled.checked && !activeShare
        ? "Save sharing to generate the public link."
        : "Save sharing to apply this change.",
    );
  });

  [
    shareShowPhotos,
    shareShowEstimatedValue,
    shareShowPurchasePrice,
    shareShowPurchaseDate,
    shareShowValueDifference,
  ].forEach((input) => {
    input?.addEventListener("change", () => {
      setDialogStatus(
        collectionShareStatus,
        "Save sharing to apply this change.",
      );
    });
  });

  collectionShareSave?.addEventListener("click", saveShareSettings);
  collectionShareRegenerate?.addEventListener("click", regenerateShareLink);
  collectionShareCopy?.addEventListener("click", copyShareLink);

  document.querySelectorAll("[data-collection-modal-close]").forEach((button) => {
    button.addEventListener("click", () => {
      const modal = button.closest(".collection-modal");
      closeCollectionModal(modal);
    });
  });

  [
    collectionEditorModal,
    collectionMembersModal,
    collectionDeleteModal,
    collectionShareModal,
  ].forEach((modal) => {
    modal?.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeCollectionModal(modal);
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    const openModal = [
      collectionShareModal,
      collectionDeleteModal,
      collectionMembersModal,
      collectionEditorModal,
    ].find((modal) => modal && !modal.hidden);

    if (openModal) {
      closeCollectionModal(openModal);
    }
  });

  /* ========================================
     Start
  ======================================== */

  loadCollection();
});
