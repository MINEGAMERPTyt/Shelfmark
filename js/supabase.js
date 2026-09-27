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

  async function addSignedUrls(images, options = {}) {
    const safeImages = Array.isArray(images) ? images : [];

    if (!safeImages.length || !window.shelfmarkSupabase) {
      return safeImages;
    }

    const bucket = options.bucket || IMAGE_BUCKET;
    const paths = [
      ...new Set(
        safeImages.map((image) => image?.storage_path).filter(Boolean),
      ),
    ];

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

    return safeImages.map((image) => ({
      ...image,
      signedUrl: signedUrlByPath.get(image.storage_path) || null,
    }));
  }

  window.ShelfmarkStorage = {
    IMAGE_BUCKET,
    SIGNED_URL_SECONDS,
    UPLOAD_CACHE_CONTROL,
    addSignedUrls,
  };
})();
