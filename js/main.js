/*
    Shelfmark
    Main JavaScript
*/

document.addEventListener("DOMContentLoaded", () => {
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
});
