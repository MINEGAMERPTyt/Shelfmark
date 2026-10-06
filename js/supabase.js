/* =========================================================
   SUPABASE CLIENT
========================================================= */

const SUPABASE_URL = "https://vshszzwqibypadclqzao.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Pr5InB66dPuZ74VOq8_u3Q_3H_YJKOd";

window.shelfmarkSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
);

/* =========================================================
   STORAGE IMAGE HELPERS

   Shelfmark keeps uploaded photographs private. Signed URLs
   are cached for the life of the browser tab so navigating
   between Collection, Game Details, Wishlist and edit pages
   can reuse the exact same URL instead of generating a fresh
   token every time.
========================================================= */

(() => {
  const IMAGE_BUCKET = "item-images";
  const SIGNED_URL_SECONDS = 3600;
  const SIGNED_URL_CACHE_MS = 50 * 60 * 1000;
  const SIGNED_URL_CACHE_KEY = "shelfmark.storage.signedUrls.v1";

  /*
    Uploaded image paths are immutable in Shelfmark: replacement
    images use a new storage path. A long browser cache lifetime is
    therefore safe for newly uploaded files and substantially reduces
    repeat Storage downloads.
  */
  const UPLOAD_CACHE_CONTROL = "31536000";
  const THUMBNAIL_MAX_DIMENSION = 420;
  const THUMBNAIL_QUALITY = 0.78;

  function readSignedUrlCache() {
    try {
      const parsed = JSON.parse(
        window.sessionStorage.getItem(SIGNED_URL_CACHE_KEY) || "{}",
      );

      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function writeSignedUrlCache(cache) {
    try {
      window.sessionStorage.setItem(
        SIGNED_URL_CACHE_KEY,
        JSON.stringify(cache),
      );
    } catch (error) {
      /*
        Storage access can be unavailable in hardened/private browser
        modes. Signed URL generation still works without this cache.
      */
    }
  }

  function pruneSignedUrlCache(cache, now = Date.now()) {
    Object.entries(cache).forEach(([path, entry]) => {
      if (
        !entry ||
        typeof entry.url !== "string" ||
        !entry.url ||
        !Number.isFinite(Number(entry.expiresAt)) ||
        Number(entry.expiresAt) <= now
      ) {
        delete cache[path];
      }
    });

    return cache;
  }

  function getPreferredImagePath(image, preferThumbnail = false) {
    if (preferThumbnail && image?.thumbnail_path) {
      return image.thumbnail_path;
    }

    return image?.storage_path || "";
  }

  async function addSignedUrls(images, options = {}) {
    const safeImages = Array.isArray(images) ? images : [];

    if (!safeImages.length || !window.shelfmarkSupabase) {
      return safeImages;
    }

    const bucket = options.bucket || IMAGE_BUCKET;
    const preferThumbnail = Boolean(options.preferThumbnail);
    const pathByImage = safeImages.map((image) =>
      getPreferredImagePath(image, preferThumbnail),
    );
    const paths = [...new Set(pathByImage.filter(Boolean))];

    if (!paths.length) {
      return safeImages;
    }

    const now = Date.now();
    const cache = pruneSignedUrlCache(readSignedUrlCache(), now);
    const signedUrlByPath = new Map();
    const missingPaths = [];

    paths.forEach((path) => {
      const cacheKey = `${bucket}:${path}`;
      const cached = cache[cacheKey];

      if (cached?.url && Number(cached.expiresAt) > now) {
        signedUrlByPath.set(path, cached.url);
      } else {
        missingPaths.push(path);
      }
    });

    if (missingPaths.length > 0) {
      const { data, error } = await window.shelfmarkSupabase.storage
        .from(bucket)
        .createSignedUrls(missingPaths, SIGNED_URL_SECONDS);

      if (error) {
        console.warn("Shelfmark signed URL error:", error);
      } else {
        (data || []).forEach((entry, index) => {
          const path = entry?.path || missingPaths[index];
          const signedUrl = entry?.signedUrl || entry?.signedURL || null;

          if (!path || !signedUrl) {
            return;
          }

          signedUrlByPath.set(path, signedUrl);

          cache[`${bucket}:${path}`] = {
            url: signedUrl,
            expiresAt: now + SIGNED_URL_CACHE_MS,
          };
        });
      }
    }

    writeSignedUrlCache(cache);

    return safeImages.map((image, index) => {
      const signedPath = pathByImage[index];

      return {
        ...image,
        signedPath: signedPath || null,
        signedUrl: signedPath ? signedUrlByPath.get(signedPath) || null : null,
      };
    });
  }

  function getThumbnailPath(storagePath) {
    const normalized = String(storagePath || "").replace(/^\/+/, "");

    if (!normalized) {
      return "";
    }

    const slashIndex = normalized.lastIndexOf("/");
    const folder = slashIndex >= 0 ? normalized.slice(0, slashIndex) : "";
    const filename = slashIndex >= 0 ? normalized.slice(slashIndex + 1) : normalized;
    const stem = filename.replace(/\.[^.]+$/, "") || "image";
    const thumbnailName = `${stem}.thumb.webp`;

    return folder
      ? `${folder}/thumbs/${thumbnailName}`
      : `thumbs/${thumbnailName}`;
  }

  async function loadImageForThumbnail(file) {
    if (typeof createImageBitmap === "function") {
      try {
        return await createImageBitmap(file);
      } catch {
        // Fall through to the HTMLImageElement path below.
      }
    }

    const objectUrl = URL.createObjectURL(file);

    try {
      return await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("The thumbnail source image could not be decoded."));
        image.src = objectUrl;
      });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  async function createThumbnailFile(file, options = {}) {
    if (!(file instanceof Blob) || !String(file.type || "").startsWith("image/")) {
      return null;
    }

    const maxDimension = Math.max(160, Number(options.maxDimension) || THUMBNAIL_MAX_DIMENSION);
    const quality = Math.min(0.92, Math.max(0.55, Number(options.quality) || THUMBNAIL_QUALITY));
    const source = await loadImageForThumbnail(file);
    const sourceWidth = Number(source.width || source.naturalWidth);
    const sourceHeight = Number(source.height || source.naturalHeight);

    if (!sourceWidth || !sourceHeight) {
      source.close?.();
      return null;
    }

    if (Math.max(sourceWidth, sourceHeight) <= maxDimension) {
      source.close?.();
      return null;
    }

    const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(source, 0, 0, width, height);
    source.close?.();

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/webp", quality);
    });

    if (!blob) {
      return null;
    }

    return new File([blob], "thumbnail.webp", {
      type: "image/webp",
      lastModified: Date.now(),
    });
  }

  window.ShelfmarkStorage = {
    IMAGE_BUCKET,
    SIGNED_URL_SECONDS,
    UPLOAD_CACHE_CONTROL,
    THUMBNAIL_MAX_DIMENSION,
    addSignedUrls,
    getThumbnailPath,
    createThumbnailFile,
  };
})();
