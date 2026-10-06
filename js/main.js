/*
  Shelfmark
  Main JavaScript + Local App Preferences
*/

(() => {
  const SETTINGS_KEY = "shelfmark.settings.v1";
  const VIEWER_LAST_OBJECT_KEY = "shelfmark.viewer.lastObject";

  const DEFAULTS = Object.freeze({
    motion: "system",
    imageLoading: "standard",
    collectionView: "remember",
    collectionPageSize: "remember",
    collectionSort: "remember",
    viewerDefault: "last",
  });

  const ALLOWED = {
    motion: new Set(["system", "full", "reduced", "off"]),
    imageLoading: new Set(["standard", "data-saver"]),
    collectionView: new Set(["remember", "grid", "list"]),
    collectionPageSize: new Set(["remember", "12", "24", "48", "all"]),
    collectionSort: new Set([
      "remember",
      "title",
      "newest",
      "oldest",
      "price-low",
      "price-high",
    ]),
    viewerDefault: new Set(["last", "case", "media"]),
  };

  function safeRead() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
      const next = { ...DEFAULTS };

      Object.keys(DEFAULTS).forEach((key) => {
        if (ALLOWED[key]?.has(parsed?.[key])) {
          next[key] = parsed[key];
        }
      });

      return next;
    } catch {
      return { ...DEFAULTS };
    }
  }

  let settings = safeRead();
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function getEffectiveMotion() {
    if (settings.motion === "off") {
      return "off";
    }

    if (settings.motion === "reduced") {
      return "reduced";
    }

    if (settings.motion === "full") {
      return "full";
    }

    return reducedMotionQuery.matches ? "reduced" : "full";
  }

  function applyRootSettings() {
    const root = document.documentElement;

    root.dataset.motionPreference = settings.motion;
    root.dataset.motionEffective = getEffectiveMotion();
    root.dataset.imageLoading = settings.imageLoading;
  }

  function persist() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Local preferences are optional. The app remains functional without them.
    }
  }

  function update(patch, { silent = false } = {}) {
    const next = { ...settings };

    Object.entries(patch || {}).forEach(([key, value]) => {
      if (ALLOWED[key]?.has(value)) {
        next[key] = value;
      }
    });

    settings = next;
    persist();
    applyRootSettings();

    if (!silent) {
      window.dispatchEvent(
        new CustomEvent("shelfmark:settings-changed", {
          detail: { ...settings, effectiveMotion: getEffectiveMotion() },
        }),
      );
    }

    return { ...settings };
  }

  function reset() {
    settings = { ...DEFAULTS };
    persist();
    applyRootSettings();

    try {
      localStorage.removeItem(VIEWER_LAST_OBJECT_KEY);

      for (let index = localStorage.length - 1; index >= 0; index -= 1) {
        const key = localStorage.key(index);

        if (key?.startsWith("shelfmark.collection.")) {
          localStorage.removeItem(key);
        }
      }

      for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
        const key = sessionStorage.key(index);

        if (key?.startsWith("shelfmark.collection.")) {
          sessionStorage.removeItem(key);
        }
      }
    } catch {
      // Ignore localStorage/sessionStorage failures.
    }

    window.dispatchEvent(
      new CustomEvent("shelfmark:settings-changed", {
        detail: { ...settings, effectiveMotion: getEffectiveMotion() },
      }),
    );

    return { ...settings };
  }

  function get(key) {
    return key ? settings[key] : undefined;
  }

  function getAll() {
    return { ...settings };
  }

  function isDataSaver() {
    return settings.imageLoading === "data-saver";
  }

  window.ShelfmarkSettings = {
    get,
    getAll,
    update,
    reset,
    isDataSaver,
    getEffectiveMotion,
    defaults: { ...DEFAULTS },
  };

  applyRootSettings();

  reducedMotionQuery.addEventListener?.("change", () => {
    if (settings.motion !== "system") {
      return;
    }

    applyRootSettings();

    window.dispatchEvent(
      new CustomEvent("shelfmark:settings-changed", {
        detail: { ...settings, effectiveMotion: getEffectiveMotion() },
      }),
    );
  });

  function initializeMotion() {
    const body = document.body;

    if (!body) {
      return;
    }

    const targets = [
      ...document.querySelectorAll(
        "main > header, main > section, .feature-section > .feature, .settings-divider",
      ),
    ];

    targets.forEach((target, index) => {
      target.classList.add("shelfmark-motion-target");
      target.style.setProperty(
        "--shelfmark-motion-delay",
        `${Math.min(index, 8) * 34}ms`,
      );
    });

    body.classList.add("shelfmark-motion-mounted");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        body.classList.add("shelfmark-motion-ready");
      });
    });
  }

  function initializeSettingsPanel() {
    const form = document.getElementById("app-preferences-form");

    if (!form) {
      return;
    }

    const controls = {
      motion: document.getElementById("setting-motion"),
      imageLoading: document.getElementById("setting-image-loading"),
      collectionView: document.getElementById("setting-collection-view"),
      collectionPageSize: document.getElementById("setting-collection-page-size"),
      collectionSort: document.getElementById("setting-collection-sort"),
      viewerDefault: document.getElementById("setting-viewer-default"),
    };

    const status = document.getElementById("app-preferences-status");
    const resetButton = document.getElementById("app-preferences-reset");
    let statusTimer = null;

    function syncControls() {
      const current = getAll();

      Object.entries(controls).forEach(([key, control]) => {
        if (control) {
          control.value = current[key];
        }
      });
    }

    function showStatus(message) {
      if (!status) {
        return;
      }

      status.textContent = message;

      if (statusTimer) {
        clearTimeout(statusTimer);
      }

      statusTimer = setTimeout(() => {
        status.textContent = "";
      }, 2400);
    }

    Object.entries(controls).forEach(([key, control]) => {
      control?.addEventListener("change", () => {
        update({ [key]: control.value });
        showStatus("Saved on this device.");
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      update(
        Object.fromEntries(
          Object.entries(controls)
            .filter(([, control]) => control)
            .map(([key, control]) => [key, control.value]),
        ),
      );
      showStatus("Preferences saved.");
    });

    resetButton?.addEventListener("click", () => {
      reset();
      syncControls();
      showStatus("Interface preferences reset.");
    });

    syncControls();
  }

  function initializeMobileNavigation() {
    const mobileBreakpoint = window.matchMedia("(max-width: 800px)");

    document.querySelectorAll(".site-header .navbar").forEach((navbar, index) => {
      const navLinks = navbar.querySelector(".nav-links");
      const navAccount = navbar.querySelector(".nav-account");
      const navLinkItems = [...navbar.querySelectorAll(".nav-links a")];
      const accountItems = [
        ...navbar.querySelectorAll(".nav-account a, .nav-account button"),
      ];
      const menuItems = [...navLinkItems, ...accountItems];

      const onlyHomeLink =
        navLinkItems.length === 1 &&
        accountItems.length === 0 &&
        /(?:^|\/)index\.html(?:$|[?#])/.test(
          navLinkItems[0].getAttribute("href") || "",
        );

      if (
        !menuItems.length ||
        onlyHomeLink ||
        navbar.querySelector(".nav-mobile-toggle")
      ) {
        return;
      }

      if (navLinks && !navLinks.id) {
        navLinks.id = `site-nav-links-${index + 1}`;
      }

      if (navAccount && !navAccount.id) {
        navAccount.id = `site-nav-account-${index + 1}`;
      }

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "nav-mobile-toggle";
      toggle.setAttribute("aria-label", "Open navigation");
      toggle.setAttribute("aria-expanded", "false");

      const controlledIds = [navLinks?.id, navAccount?.id].filter(Boolean);

      if (controlledIds.length) {
        toggle.setAttribute("aria-controls", controlledIds.join(" "));
      }

      toggle.innerHTML = `
        <span class="nav-mobile-toggle-lines" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </span>
      `;

      navbar.appendChild(toggle);

      function setMenuOpen(open) {
        const shouldOpen = Boolean(open && mobileBreakpoint.matches);

        navbar.classList.toggle("mobile-open", shouldOpen);
        toggle.setAttribute("aria-expanded", String(shouldOpen));
        toggle.setAttribute(
          "aria-label",
          shouldOpen ? "Close navigation" : "Open navigation",
        );
      }

      toggle.addEventListener("click", (event) => {
        event.stopPropagation();
        setMenuOpen(!navbar.classList.contains("mobile-open"));
      });

      menuItems.forEach((item) => {
        item.addEventListener("click", () => {
          if (mobileBreakpoint.matches) {
            setMenuOpen(false);
          }
        });
      });

      document.addEventListener("click", (event) => {
        if (
          mobileBreakpoint.matches &&
          navbar.classList.contains("mobile-open") &&
          !navbar.contains(event.target)
        ) {
          setMenuOpen(false);
        }
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && navbar.classList.contains("mobile-open")) {
          setMenuOpen(false);
          toggle.focus();
        }
      });

      mobileBreakpoint.addEventListener?.("change", (event) => {
        if (!event.matches) {
          setMenuOpen(false);
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initializeMotion();
    initializeSettingsPanel();
    initializeMobileNavigation();
  });
})();
