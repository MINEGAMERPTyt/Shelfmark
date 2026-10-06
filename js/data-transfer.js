(() => {
  /* =========================================================
     Shelfmark
     Portable Collection / Wishlist Backup
  ========================================================= */

  const supabaseClient = window.shelfmarkSupabase;
  const storageHelpers = window.ShelfmarkStorage;

  const BACKUP_KIND = "shelfmark-backup";
  const BACKUP_FORMAT_VERSION = 1;
  const SOURCE_APP_VERSION = "1.5.0";
  const PAGE_SIZE = 500;

  const collectionCheckbox = document.getElementById(
    "backup-export-collection",
  );
  const wishlistCheckbox = document.getElementById("backup-export-wishlist");
  const photosCheckbox = document.getElementById("backup-export-photos");
  const exportButton = document.getElementById("backup-export-button");
  const exportStatus = document.getElementById("backup-export-status");
  const exportProgress = document.getElementById("backup-export-progress");
  const exportProgressBar = document.getElementById(
    "backup-export-progress-bar",
  );

  const importInput = document.getElementById("backup-import-file");
  const importFileName = document.getElementById("backup-import-file-name");
  const importButton = document.getElementById("backup-import-button");
  const importStatus = document.getElementById("backup-import-status");
  const importProgress = document.getElementById("backup-import-progress");
  const importProgressBar = document.getElementById(
    "backup-import-progress-bar",
  );

  if (!exportButton || !importButton) {
    return;
  }

  function setStatus(element, message = "", state = "") {
    if (!element) {
      return;
    }

    element.textContent = message;

    if (state) {
      element.dataset.state = state;
    } else {
      element.removeAttribute("data-state");
    }
  }

  function setProgress(wrapper, bar, value = null) {
    if (!wrapper || !bar) {
      return;
    }

    if (value === null) {
      wrapper.hidden = true;
      bar.style.setProperty("--transfer-progress", "0%");
      return;
    }

    wrapper.hidden = false;
    const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
    bar.style.setProperty("--transfer-progress", `${safeValue}%`);
  }

  function setBusy(isBusy) {
    exportButton.disabled = isBusy;
    importButton.disabled = isBusy || !importInput?.files?.[0];

    [collectionCheckbox, wishlistCheckbox, photosCheckbox, importInput].forEach(
      (control) => {
        if (control) {
          control.disabled = isBusy;
        }
      },
    );
  }

  async function getCurrentUser() {
    if (!supabaseClient) {
      throw new Error("Shelfmark could not connect to Supabase.");
    }

    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser();

    if (error || !user) {
      throw new Error("You must be logged in to export or import a backup.");
    }

    return user;
  }

  async function fetchAllRows(table, columns, configureQuery = null) {
    const rows = [];
    let offset = 0;

    while (true) {
      let query = supabaseClient
        .from(table)
        .select(columns)
        .range(offset, offset + PAGE_SIZE - 1);

      if (typeof configureQuery === "function") {
        query = configureQuery(query);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const batch = data || [];
      rows.push(...batch);

      if (batch.length < PAGE_SIZE) {
        break;
      }

      offset += batch.length;
    }

    return rows;
  }

  function pick(source, keys) {
    const target = {};

    keys.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(source || {}, key)) {
        target[key] = source[key];
      }
    });

    return target;
  }

  const COLLECTION_ITEM_KEYS = [
    "category",
    "title",
    "condition",
    "completeness",
    "region",
    "country",
    "purchase_date",
    "purchase_price",
    "estimated_value",
    "notes",
    "created_at",
    "updated_at",
    "value_source",
    "value_checked_at",
  ];

  const GAME_KEYS = [
    "platform",
    "release_year",
    "genre",
    "game_type",
    "edition",
    "developer",
    "publisher",
    "media_type",
    "case_format",
    "custom_case_width",
    "custom_case_height",
    "disc_count",
    "media_format",
  ];

  const WISHLIST_KEYS = [
    "title",
    "platform",
    "release_year",
    "genre",
    "game_type",
    "edition",
    "developer",
    "publisher",
    "region",
    "country",
    "media_type",
    "media_format",
    "case_format",
    "priority",
    "target_price",
    "desired_condition",
    "desired_completeness",
    "notes",
    "created_at",
    "updated_at",
    "custom_case_width",
    "custom_case_height",
  ];

  const CUSTOM_COLLECTION_KEYS = [
    "name",
    "description",
    "created_at",
    "updated_at",
  ];

  function getPathExtension(path = "") {
    const match = String(path).toLowerCase().match(/\.([a-z0-9]{2,5})$/);
    return match ? match[1] : "webp";
  }

  function mimeFromExtension(extension) {
    if (extension === "png") {
      return "image/png";
    }

    if (extension === "jpg" || extension === "jpeg") {
      return "image/jpeg";
    }

    return "image/webp";
  }

  function safeAssetName(value) {
    return String(value || "image")
      .replace(/[^a-z0-9._-]+/gi, "-")
      .replace(/^-+|-+$/g, "") || "image";
  }

  async function attachImageAssets(
    zip,
    rows,
    itemIdKey,
    directory,
    onProgress,
  ) {
    const safeRows = Array.isArray(rows) ? rows : [];

    if (!safeRows.length) {
      return new Map();
    }

    if (!storageHelpers?.addSignedUrls) {
      throw new Error("Shelfmark's private image helper is unavailable.");
    }

    const signedRows = await storageHelpers.addSignedUrls(safeRows);
    const result = new Map();

    for (let index = 0; index < signedRows.length; index += 1) {
      const image = signedRows[index];

      if (!image?.signedUrl || !image?.storage_path) {
        continue;
      }

      const response = await fetch(image.signedUrl, {
        cache: "force-cache",
      });

      if (!response.ok) {
        throw new Error(
          `A stored image could not be included in the backup (${response.status}).`,
        );
      }

      const blob = await response.blob();
      const extension = getPathExtension(image.storage_path);
      const sourceId = image[itemIdKey];
      const filename = safeAssetName(
        `${String(index + 1).padStart(3, "0")}-${image.image_type}${
          image.disc_number ? `-${image.disc_number}` : ""
        }.${extension}`,
      );
      const assetPath = `images/${directory}/${sourceId}/${filename}`;

      zip.file(assetPath, blob, { binary: true });

      if (!result.has(sourceId)) {
        result.set(sourceId, []);
      }

      result.get(sourceId).push({
        image_type: image.image_type,
        disc_number: image.disc_number ?? null,
        sort_order: image.sort_order ?? 0,
        asset: assetPath,
        mime_type: blob.type || mimeFromExtension(extension),
      });

      onProgress?.(index + 1, signedRows.length);
    }

    return result;
  }

  async function buildBackup({ includeCollection, includeWishlist, includePhotos }) {
    const user = await getCurrentUser();
    const zip = new window.JSZip();

    const manifest = {
      kind: BACKUP_KIND,
      formatVersion: BACKUP_FORMAT_VERSION,
      sourceVersion: SOURCE_APP_VERSION,
      exportedAt: new Date().toISOString(),
      includesPhotos: Boolean(includePhotos),
      sections: {
        collection: Boolean(includeCollection),
        wishlist: Boolean(includeWishlist),
      },
      collection: null,
      wishlist: null,
    };

    if (includeCollection) {
      setStatus(exportStatus, "Reading Collection data…");
      setProgress(exportProgress, exportProgressBar, 8);

      const [items, games, images, collections, memberships] =
        await Promise.all([
          fetchAllRows(
            "collection_items",
            "id,category,title,condition,completeness,region,country,purchase_date,purchase_price,estimated_value,notes,created_at,updated_at,value_source,value_checked_at",
            (query) =>
              query
                .eq("user_id", user.id)
                .eq("category", "game")
                .order("id", { ascending: true }),
          ),
          fetchAllRows(
            "games",
            "item_id,platform,release_year,genre,game_type,edition,developer,publisher,media_type,case_format,custom_case_width,custom_case_height,disc_count,media_format",
            (query) => query.order("item_id", { ascending: true }),
          ),
          includePhotos
            ? fetchAllRows(
                "item_images",
                "id,item_id,image_type,storage_path,disc_number,sort_order,created_at",
                (query) =>
                  query
                    .order("item_id", { ascending: true })
                    .order("sort_order", { ascending: true }),
              )
            : Promise.resolve([]),
          fetchAllRows(
            "collections",
            "id,name,description,created_at,updated_at",
            (query) =>
              query
                .eq("user_id", user.id)
                .order("id", { ascending: true }),
          ),
          fetchAllRows(
            "collection_members",
            "collection_id,item_id,added_at",
            (query) =>
              query
                .order("collection_id", { ascending: true })
                .order("item_id", { ascending: true }),
          ),
        ]);

      const itemIds = new Set(items.map((item) => item.id));
      const gamesByItem = new Map(
        games
          .filter((game) => itemIds.has(game.item_id))
          .map((game) => [game.item_id, game]),
      );

      let imagesByItem = new Map();

      if (includePhotos && images.length) {
        setStatus(
          exportStatus,
          `Adding Collection photos to the backup (0/${images.length})…`,
        );

        imagesByItem = await attachImageAssets(
          zip,
          images.filter((image) => itemIds.has(image.item_id)),
          "item_id",
          "collection",
          (done, total) => {
            setStatus(
              exportStatus,
              `Adding Collection photos to the backup (${done}/${total})…`,
            );
            setProgress(
              exportProgress,
              exportProgressBar,
              10 + (done / Math.max(total, 1)) * 30,
            );
          },
        );
      }

      const membershipsByCollection = new Map();

      memberships.forEach((membership) => {
        if (!itemIds.has(membership.item_id)) {
          return;
        }

        if (!membershipsByCollection.has(membership.collection_id)) {
          membershipsByCollection.set(membership.collection_id, []);
        }

        membershipsByCollection
          .get(membership.collection_id)
          .push(membership.item_id);
      });

      manifest.collection = {
        items: items.map((item) => ({
          sourceId: item.id,
          item: pick(item, COLLECTION_ITEM_KEYS),
          game: pick(gamesByItem.get(item.id) || {}, GAME_KEYS),
          images: imagesByItem.get(item.id) || [],
        })),
        customCollections: collections.map((collection) => ({
          sourceId: collection.id,
          data: pick(collection, CUSTOM_COLLECTION_KEYS),
          members: membershipsByCollection.get(collection.id) || [],
        })),
      };
    }

    if (includeWishlist) {
      setStatus(exportStatus, "Reading Wishlist data…");
      setProgress(exportProgress, exportProgressBar, includeCollection ? 45 : 10);

      const [items, images] = await Promise.all([
        fetchAllRows(
          "wishlist_items",
          "id,title,platform,release_year,genre,game_type,edition,developer,publisher,region,country,media_type,media_format,case_format,priority,target_price,desired_condition,desired_completeness,notes,created_at,updated_at,custom_case_width,custom_case_height",
          (query) =>
            query.eq("user_id", user.id).order("id", { ascending: true }),
        ),
        includePhotos
          ? fetchAllRows(
              "wishlist_images",
              "id,wishlist_item_id,image_type,storage_path,created_at",
              (query) =>
                query
                  .order("wishlist_item_id", { ascending: true })
                  .order("id", { ascending: true }),
            )
          : Promise.resolve([]),
      ]);

      const itemIds = new Set(items.map((item) => item.id));
      let imagesByItem = new Map();

      if (includePhotos && images.length) {
        setStatus(
          exportStatus,
          `Adding Wishlist photos to the backup (0/${images.length})…`,
        );

        imagesByItem = await attachImageAssets(
          zip,
          images.filter((image) => itemIds.has(image.wishlist_item_id)),
          "wishlist_item_id",
          "wishlist",
          (done, total) => {
            setStatus(
              exportStatus,
              `Adding Wishlist photos to the backup (${done}/${total})…`,
            );
            setProgress(
              exportProgress,
              exportProgressBar,
              (includeCollection ? 55 : 20) +
                (done / Math.max(total, 1)) * 25,
            );
          },
        );
      }

      manifest.wishlist = {
        items: items.map((item) => ({
          sourceId: item.id,
          data: pick(item, WISHLIST_KEYS),
          images: imagesByItem.get(item.id) || [],
        })),
      };
    }

    zip.file("manifest.json", JSON.stringify(manifest, null, 2));

    setStatus(exportStatus, "Compressing backup…");
    setProgress(exportProgress, exportProgressBar, 88);

    const blob = await zip.generateAsync(
      {
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      },
      (metadata) => {
        setProgress(
          exportProgress,
          exportProgressBar,
          88 + metadata.percent * 0.12,
        );
      },
    );

    return { blob, manifest };
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function backupFilename(manifest) {
    const date = String(manifest.exportedAt || new Date().toISOString())
      .slice(0, 10)
      .replaceAll("-", "");

    if (manifest.sections.collection && manifest.sections.wishlist) {
      return `shelfmark-backup-${date}.zip`;
    }

    if (manifest.sections.collection) {
      return `shelfmark-collection-${date}.zip`;
    }

    return `shelfmark-wishlist-${date}.zip`;
  }

  async function exportBackup() {
    const includeCollection = Boolean(collectionCheckbox?.checked);
    const includeWishlist = Boolean(wishlistCheckbox?.checked);
    const includePhotos = Boolean(photosCheckbox?.checked);

    if (!includeCollection && !includeWishlist) {
      setStatus(
        exportStatus,
        "Choose Collection, Wishlist, or both before exporting.",
        "error",
      );
      return;
    }

    if (!window.JSZip) {
      setStatus(
        exportStatus,
        "The backup library did not load. Refresh the page and try again.",
        "error",
      );
      return;
    }

    setBusy(true);
    setProgress(exportProgress, exportProgressBar, 2);

    try {
      const { blob, manifest } = await buildBackup({
        includeCollection,
        includeWishlist,
        includePhotos,
      });

      downloadBlob(blob, backupFilename(manifest));

      const collectionCount = manifest.collection?.items?.length || 0;
      const wishlistCount = manifest.wishlist?.items?.length || 0;

      setStatus(
        exportStatus,
        `Backup ready · ${collectionCount} Collection ${
          collectionCount === 1 ? "item" : "items"
        } · ${wishlistCount} Wishlist ${
          wishlistCount === 1 ? "item" : "items"
        }${includePhotos ? " · photos included" : ""}.`,
        "success",
      );
      setProgress(exportProgress, exportProgressBar, 100);
    } catch (error) {
      console.error("Shelfmark backup export error:", error);
      setStatus(
        exportStatus,
        error?.message || "Shelfmark could not export this backup.",
        "error",
      );
      setProgress(exportProgress, exportProgressBar, null);
    } finally {
      setBusy(false);
    }
  }

  function validateManifest(manifest) {
    if (
      !manifest ||
      manifest.kind !== BACKUP_KIND ||
      Number(manifest.formatVersion) !== BACKUP_FORMAT_VERSION
    ) {
      throw new Error("This is not a supported Shelfmark backup file.");
    }

    if (!manifest.sections?.collection && !manifest.sections?.wishlist) {
      throw new Error("This Shelfmark backup does not contain importable data.");
    }
  }

  function cleanInsertData(source, allowedKeys) {
    const output = {};

    allowedKeys.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(source || {}, key)) {
        output[key] = source[key];
      }
    });

    return output;
  }

  async function removeStoragePaths(paths) {
    const safePaths = [...new Set(paths.filter(Boolean))];

    for (let index = 0; index < safePaths.length; index += 100) {
      const batch = safePaths.slice(index, index + 100);
      const { error } = await supabaseClient.storage
        .from(storageHelpers.IMAGE_BUCKET)
        .remove(batch);

      if (error) {
        console.warn("Shelfmark backup rollback storage error:", error);
      }
    }
  }

  async function deleteRowsByIds(table, ids) {
    const safeIds = [...new Set(ids.filter(Boolean))];

    for (let index = 0; index < safeIds.length; index += 100) {
      const batch = safeIds.slice(index, index + 100);
      const { error } = await supabaseClient.from(table).delete().in("id", batch);

      if (error) {
        console.warn(`Shelfmark backup rollback ${table} error:`, error);
      }
    }
  }

  async function rollbackImport(state) {
    await removeStoragePaths(state.uploadedPaths);
    await deleteRowsByIds("collections", state.collectionIds);
    await deleteRowsByIds("wishlist_items", state.wishlistItemIds);
    await deleteRowsByIds("collection_items", state.collectionItemIds);
  }

  function makeImportedCollectionName(baseName, usedNames) {
    const rawBase = String(baseName || "Imported collection").trim();
    const base = rawBase.slice(0, 80) || "Imported collection";
    let candidate = base;
    let suffix = 1;

    while (usedNames.has(candidate.toLocaleLowerCase())) {
      suffix += 1;
      const ending = ` (Imported${suffix > 2 ? ` ${suffix - 1}` : ""})`;
      candidate = `${base.slice(0, Math.max(1, 80 - ending.length))}${ending}`;
    }

    usedNames.add(candidate.toLocaleLowerCase());
    return candidate;
  }

  async function zipAssetToBlob(zip, image) {
    if (!image?.asset) {
      return null;
    }

    const file = zip.file(image.asset);

    if (!file) {
      throw new Error(`Backup photo is missing: ${image.asset}`);
    }

    const rawBlob = await file.async("blob");

    return new Blob([rawBlob], {
      type: image.mime_type || mimeFromExtension(getPathExtension(image.asset)),
    });
  }

  async function importThumbnail(storagePath, blob, state) {
    if (!storageHelpers?.createThumbnailFile) {
      return null;
    }

    try {
      const thumbnailFile = await storageHelpers.createThumbnailFile(blob);

      if (!thumbnailFile) {
        return null;
      }

      const thumbnailPath = storageHelpers.getThumbnailPath(storagePath);

      if (!thumbnailPath) {
        return null;
      }

      const { error } = await supabaseClient.storage
        .from(storageHelpers.IMAGE_BUCKET)
        .upload(thumbnailPath, thumbnailFile, {
          cacheControl: storageHelpers.UPLOAD_CACHE_CONTROL,
          contentType: "image/webp",
          upsert: false,
        });

      if (error) {
        console.warn("Shelfmark import thumbnail upload skipped:", error);
        return null;
      }

      state.uploadedPaths.push(thumbnailPath);
      return thumbnailPath;
    } catch (error) {
      console.warn("Shelfmark import thumbnail creation skipped:", error);
      return null;
    }
  }

  async function importCollectionImage(
    zip,
    user,
    newItemId,
    image,
    state,
  ) {
    const blob = await zipAssetToBlob(zip, image);

    if (!blob) {
      return;
    }

    const extension = getPathExtension(image.asset);
    const role = String(image.image_type || "front");
    const discNumber = Number(image.disc_number) || null;
    const filename =
      role === "disc"
        ? `disc-${discNumber || 1}.${extension}`
        : `${safeAssetName(role)}.${extension}`;
    const storagePath = `${user.id}/${newItemId}/${filename}`;

    const { error: uploadError } = await supabaseClient.storage
      .from(storageHelpers.IMAGE_BUCKET)
      .upload(storagePath, blob, {
        cacheControl: storageHelpers.UPLOAD_CACHE_CONTROL,
        contentType: blob.type || mimeFromExtension(extension),
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    state.uploadedPaths.push(storagePath);

    const thumbnailPath = await importThumbnail(storagePath, blob, state);

    const { error: rowError } = await supabaseClient.from("item_images").insert({
      item_id: newItemId,
      image_type: role,
      storage_path: storagePath,
      thumbnail_path: thumbnailPath,
      disc_number: role === "disc" ? discNumber : null,
      sort_order: Number(image.sort_order) || 0,
    });

    if (rowError) {
      throw rowError;
    }
  }

  async function importWishlistImage(
    zip,
    user,
    newItemId,
    image,
    imageIndex,
    state,
  ) {
    const blob = await zipAssetToBlob(zip, image);

    if (!blob) {
      return;
    }

    const extension = getPathExtension(image.asset);
    const role = String(image.image_type || "front");
    const token = `${Date.now()}-${imageIndex}-${crypto.randomUUID().slice(0, 8)}`;
    const storagePath = `${user.id}/wishlist/${newItemId}/${safeAssetName(
      role,
    )}-${token}.${extension}`;

    const { error: uploadError } = await supabaseClient.storage
      .from(storageHelpers.IMAGE_BUCKET)
      .upload(storagePath, blob, {
        cacheControl: storageHelpers.UPLOAD_CACHE_CONTROL,
        contentType: blob.type || mimeFromExtension(extension),
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    state.uploadedPaths.push(storagePath);

    const thumbnailPath = await importThumbnail(storagePath, blob, state);

    const { error: rowError } = await supabaseClient
      .from("wishlist_images")
      .insert({
        wishlist_item_id: newItemId,
        image_type: role,
        storage_path: storagePath,
        thumbnail_path: thumbnailPath,
      });

    if (rowError) {
      throw rowError;
    }
  }

  async function importBackup(file) {
    const user = await getCurrentUser();
    const zip = await window.JSZip.loadAsync(file);
    const manifestFile = zip.file("manifest.json");

    if (!manifestFile) {
      throw new Error("This ZIP does not contain a Shelfmark backup manifest.");
    }

    const manifest = JSON.parse(await manifestFile.async("string"));
    validateManifest(manifest);

    const state = {
      collectionItemIds: [],
      wishlistItemIds: [],
      collectionIds: [],
      uploadedPaths: [],
    };

    const importedItemMap = new Map();

    try {
      const collectionEntries = manifest.collection?.items || [];
      const wishlistEntries = manifest.wishlist?.items || [];
      const customCollections = manifest.collection?.customCollections || [];
      const totalUnits =
        collectionEntries.length +
          wishlistEntries.length +
          customCollections.length || 1;
      let completedUnits = 0;

      const updateImportProgress = (message) => {
        setStatus(importStatus, message);
        setProgress(
          importProgress,
          importProgressBar,
          4 + (completedUnits / totalUnits) * 92,
        );
      };

      for (let index = 0; index < collectionEntries.length; index += 1) {
        const entry = collectionEntries[index];
        updateImportProgress(
          `Importing Collection game ${index + 1} of ${collectionEntries.length}…`,
        );

        const itemPayload = {
          ...cleanInsertData(entry.item, COLLECTION_ITEM_KEYS),
          user_id: user.id,
          category: "game",
        };

        const { data: insertedItem, error: itemError } = await supabaseClient
          .from("collection_items")
          .insert(itemPayload)
          .select("id")
          .single();

        if (itemError || !insertedItem?.id) {
          throw itemError || new Error("A Collection item could not be created.");
        }

        state.collectionItemIds.push(insertedItem.id);
        importedItemMap.set(entry.sourceId, insertedItem.id);

        const gamePayload = cleanInsertData(entry.game, GAME_KEYS);
        const { error: gameError } = await supabaseClient.from("games").insert({
          item_id: insertedItem.id,
          ...gamePayload,
        });

        if (gameError) {
          throw gameError;
        }

        const images = Array.isArray(entry.images) ? entry.images : [];

        for (const image of images) {
          await importCollectionImage(zip, user, insertedItem.id, image, state);
        }

        completedUnits += 1;
      }

      if (customCollections.length) {
        const existingCollections = await fetchAllRows(
          "collections",
          "name",
          (query) => query.eq("user_id", user.id).order("name"),
        );
        const usedNames = new Set(
          existingCollections.map((row) =>
            String(row.name || "").toLocaleLowerCase(),
          ),
        );

        for (let index = 0; index < customCollections.length; index += 1) {
          const sourceCollection = customCollections[index];
          updateImportProgress(
            `Rebuilding custom Collection ${index + 1} of ${customCollections.length}…`,
          );

          const data = cleanInsertData(
            sourceCollection.data,
            CUSTOM_COLLECTION_KEYS,
          );
          data.name = makeImportedCollectionName(data.name, usedNames);

          const { data: insertedCollection, error } = await supabaseClient
            .from("collections")
            .insert({
              ...data,
              user_id: user.id,
            })
            .select("id")
            .single();

          if (error || !insertedCollection?.id) {
            throw error || new Error("A custom Collection could not be created.");
          }

          state.collectionIds.push(insertedCollection.id);

          const memberRows = (sourceCollection.members || [])
            .map((sourceItemId) => importedItemMap.get(sourceItemId))
            .filter(Boolean)
            .map((itemId) => ({
              collection_id: insertedCollection.id,
              item_id: itemId,
            }));

          if (memberRows.length) {
            const { error: memberError } = await supabaseClient
              .from("collection_members")
              .insert(memberRows);

            if (memberError) {
              throw memberError;
            }
          }

          completedUnits += 1;
        }
      }

      for (let index = 0; index < wishlistEntries.length; index += 1) {
        const entry = wishlistEntries[index];
        updateImportProgress(
          `Importing Wishlist item ${index + 1} of ${wishlistEntries.length}…`,
        );

        const payload = {
          ...cleanInsertData(entry.data, WISHLIST_KEYS),
          user_id: user.id,
        };

        const { data: insertedItem, error } = await supabaseClient
          .from("wishlist_items")
          .insert(payload)
          .select("id")
          .single();

        if (error || !insertedItem?.id) {
          throw error || new Error("A Wishlist item could not be created.");
        }

        state.wishlistItemIds.push(insertedItem.id);

        const images = Array.isArray(entry.images) ? entry.images : [];

        for (let imageIndex = 0; imageIndex < images.length; imageIndex += 1) {
          await importWishlistImage(
            zip,
            user,
            insertedItem.id,
            images[imageIndex],
            imageIndex,
            state,
          );
        }

        completedUnits += 1;
      }

      setProgress(importProgress, importProgressBar, 100);

      return {
        collectionCount: collectionEntries.length,
        wishlistCount: wishlistEntries.length,
        customCollectionCount: customCollections.length,
        photosIncluded: Boolean(manifest.includesPhotos),
      };
    } catch (error) {
      setStatus(importStatus, "Import failed. Reverting imported data…");
      await rollbackImport(state);
      throw error;
    }
  }

  async function handleImport() {
    const file = importInput?.files?.[0];

    if (!file) {
      setStatus(importStatus, "Choose a Shelfmark backup ZIP first.", "error");
      return;
    }

    if (!window.JSZip) {
      setStatus(
        importStatus,
        "The backup library did not load. Refresh the page and try again.",
        "error",
      );
      return;
    }

    setBusy(true);
    setProgress(importProgress, importProgressBar, 2);

    try {
      const result = await importBackup(file);

      setStatus(
        importStatus,
        `Import complete · ${result.collectionCount} Collection ${
          result.collectionCount === 1 ? "item" : "items"
        } · ${result.customCollectionCount} custom ${
          result.customCollectionCount === 1 ? "Collection" : "Collections"
        } · ${result.wishlistCount} Wishlist ${
          result.wishlistCount === 1 ? "item" : "items"
        }${result.photosIncluded ? " · photos restored" : ""}.`,
        "success",
      );
    } catch (error) {
      console.error("Shelfmark backup import error:", error);
      setStatus(
        importStatus,
        error?.message || "Shelfmark could not import this backup.",
        "error",
      );
      setProgress(importProgress, importProgressBar, null);
    } finally {
      setBusy(false);
    }
  }

  importInput?.addEventListener("change", () => {
    const file = importInput.files?.[0];

    if (importFileName) {
      importFileName.textContent = file?.name || "No backup selected";
    }

    importButton.disabled = !file;
    setStatus(importStatus);
    setProgress(importProgress, importProgressBar, null);
  });

  exportButton.addEventListener("click", exportBackup);
  importButton.addEventListener("click", handleImport);

  setProgress(exportProgress, exportProgressBar, null);
  setProgress(importProgress, importProgressBar, null);
  setBusy(false);
})();
