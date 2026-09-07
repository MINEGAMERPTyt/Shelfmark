/* ========================================
   Shelfmark
   Game Details
======================================== */

/* ========================================
   Image Lightbox
======================================== */

const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-image");
const lightboxLabel = document.getElementById("lightbox-label");
const lightboxClose = document.getElementById("lightbox-close");

const galleryImages = document.querySelectorAll(".gallery-image");

/* ---------- Open ---------- */

function openLightbox(image, label) {
  lightboxImage.src = image.src;
  lightboxImage.alt = image.alt;

  lightboxLabel.textContent = label;

  lightbox.classList.add("visible");

  lightbox.setAttribute("aria-hidden", "false");

  document.body.style.overflow = "hidden";
}

/* ---------- Close ---------- */

function closeLightbox() {
  lightbox.classList.remove("visible");

  lightbox.setAttribute("aria-hidden", "true");

  document.body.style.overflow = "";
}

/* ========================================
   Gallery Events
======================================== */

if (lightbox && lightboxImage && lightboxLabel && lightboxClose) {
  galleryImages.forEach((galleryItem) => {
    const image = galleryItem.querySelector("img");
    const label = galleryItem.querySelector("span");

    if (!image) {
      return;
    }

    galleryItem.addEventListener("click", () => {
      openLightbox(image, label?.textContent || "");
    });
  });

  /* ---------- Close Button ---------- */

  lightboxClose.addEventListener("click", closeLightbox);

  /* ---------- Click Outside ---------- */

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  /* ---------- Escape ---------- */

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox.classList.contains("visible")) {
      closeLightbox();
    }
  });
}
