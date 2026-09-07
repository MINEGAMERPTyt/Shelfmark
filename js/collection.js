/* ========================================
   Shelfmark
   Collection functionality
======================================== */

const searchInput = document.getElementById("game-search");
const platformFilter = document.getElementById("platform-filter");
const genreFilter = document.getElementById("genre-filter");
const sortSelect = document.getElementById("sort-games");

const collectionGrid = document.querySelector(".collection-grid");
const gameCards = Array.from(document.querySelectorAll(".game-card"));
const emptyState = document.getElementById("collection-empty");

/* ========================================
   Filter Collection
======================================== */

function filterCollection() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedPlatform = platformFilter.value;
  const selectedGenre = genreFilter.value;

  let visibleGames = 0;

  gameCards.forEach((card) => {
    const title = card.dataset.title.toLowerCase();
    const platform = card.dataset.platform;
    const genre = card.dataset.genre;

    const matchesSearch = title.includes(searchTerm);

    const matchesPlatform =
      selectedPlatform === "all" || platform === selectedPlatform;

    const matchesGenre = selectedGenre === "all" || genre === selectedGenre;

    if (matchesSearch && matchesPlatform && matchesGenre) {
      card.style.display = "";
      visibleGames++;
    } else {
      card.style.display = "none";
    }
  });

  if (visibleGames === 0) {
    emptyState.classList.add("visible");
  } else {
    emptyState.classList.remove("visible");
  }
}

/* ========================================
   Sort Collection
======================================== */

function sortCollection() {
  const sortValue = sortSelect.value;

  const sortedCards = [...gameCards];

  sortedCards.sort((a, b) => {
    const titleA = a.dataset.title.toLowerCase();
    const titleB = b.dataset.title.toLowerCase();

    const yearA = Number(a.dataset.year);
    const yearB = Number(b.dataset.year);

    switch (sortValue) {
      case "title-asc":
        return titleA.localeCompare(titleB);

      case "title-desc":
        return titleB.localeCompare(titleA);

      case "year-newest":
        return yearB - yearA;

      case "year-oldest":
        return yearA - yearB;

      default:
        return 0;
    }
  });

  sortedCards.forEach((card) => {
    collectionGrid.appendChild(card);
  });
}

/* ========================================
   Disc Rotation
======================================== */

/*
   Store the rotation of every disc separately.

   This means a disc can be at:
   127°
   294°
   731°
   etc.

   It never has to reset to 0°.
*/

const discStates = new Map();

gameCards.forEach((card) => {
  const disc = card.querySelector(".game-disc");
  const discImage = disc?.querySelector("img");

  if (!disc || !discImage) {
    return;
  }

  discStates.set(card, {
    image: discImage,
    angle: 0,
    spinning: false,
    frame: null,
  });
});

/*
   How quickly the disc rotates.

   Higher number = faster.
*/
const DISC_SPEED = 144;

/*
   Start spinning a disc.
*/
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

    /*
           Keep the angle within 0-360.
           This prevents the number from growing forever.
        */
    state.angle %= 360;

    state.image.style.transform = `rotate(${state.angle}deg)`;

    state.frame = requestAnimationFrame(spin);
  }

  state.frame = requestAnimationFrame(spin);
}

/*
   Stop spinning.

   The current angle is NOT reset.
*/
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

/* ========================================
   Disc Hover Events
======================================== */

gameCards.forEach((card) => {
  const disc = card.querySelector(".game-disc");

  if (!disc) {
    return;
  }

  /*
       Each card gets its own stop timer.
       This prevents an old mouseleave timeout
       from stopping a newly started animation.
    */
  let stopTimer = null;

  /*
       Mouse enters:
       - Cancel any pending stop.
       - Start/restart the disc rotation.
       - CSS handles the disc sliding out.
    */
  card.addEventListener("mouseenter", () => {
    if (stopTimer) {
      clearTimeout(stopTimer);
      stopTimer = null;
    }

    startDiscSpin(card);
  });

  /*
       Mouse leaves:
       - CSS immediately starts sliding the disc
         back into the case.
       - Keep the disc spinning during the
         500ms slide-back animation.
       - Stop only after the slide is finished.
    */
  card.addEventListener("mouseleave", () => {
    if (stopTimer) {
      clearTimeout(stopTimer);
    }

    stopTimer = setTimeout(() => {
      stopDiscSpin(card);
      stopTimer = null;
    }, 500);
  });
});

/* ========================================
   Event Listeners
======================================== */

searchInput.addEventListener("input", filterCollection);

platformFilter.addEventListener("change", filterCollection);

genreFilter.addEventListener("change", filterCollection);

sortSelect.addEventListener("change", sortCollection);

/* ========================================
   Initial State
======================================== */

filterCollection();
