(() => {
  /* =====================================================
     Shelfmark
     Physical Format Library

     Ratios are WIDTH / HEIGHT.
  ===================================================== */

  const CASE_FORMATS = {
    dvd: {
      label: "DVD-style game case",
      cover: 135 / 190,
      side: 14 / 190,
      manual: 115 / 179,
    },

    "blu-ray": {
      label: "Blu-ray game case",
      cover: 135 / 170,
      side: 14 / 170,
      manual: 118 / 145,
    },

    /*
      A standard jewel case is approximately
      142 mm wide × 125 mm high.

      The booklet/manual inside is approximately
      120 × 120 mm and is therefore square.
    */

    ps1: {
      label: "PS1 / CD jewel case",
      cover: 142 / 125,
      side: 10 / 125,
      manual: 120 / 120,
    },

    /*
      PAL / North-American GameCube case.

      Japanese GameCube cases can differ and
      should use Custom if necessary.
    */

    gamecube: {
      label: "Nintendo GameCube",
      cover: 135 / 190,
      side: 15 / 190,
      manual: 105 / 178,
    },

    psp: {
      label: "PSP",
      cover: 99 / 168,
      side: 14 / 168,
      manual: 85.725 / 169.875,
    },

    vita: {
      label: "PS Vita",
      cover: 105 / 135,
      side: 12 / 135,

      /*
        Vita printed inserts/manuals vary.
        Use the case proportions as a safe default.
      */
      manual: 105 / 135,
    },

    ds: {
      label: "Nintendo DS",
      cover: 122 / 135,

      /*
        European DS cases are commonly the
        thicker clear-case variant.
      */
      side: 20 / 135,

      manual: 105 / 105,
    },

    "3ds": {
      label: "Nintendo 3DS",
      cover: 122 / 135,
      side: 14 / 135,
      manual: 115 / 115,
    },

    switch: {
      label: "Nintendo Switch",
      cover: 104 / 170,
      side: 10 / 170,

      /*
        Switch generally uses small inserts rather
        than traditional full manuals. This gives
        the cropper a sensible printed-insert ratio.
      */
      manual: 81 / 110,
    },

    custom: {
      label: "Custom",
      cover: 1 / 1.4,
      side: (1 / 1.4) * (14 / 135),
      manual: 1 / 1.4,
    },
  };

  /* =====================================================
     MEDIA FORMATS
  ===================================================== */

  const MEDIA_FORMATS = {
    "standard-disc": {
      label: "Standard optical disc (120 mm)",
      shortLabel: "Disc",
      mediaType: "disc",

      ratio: 1,

      shape: "disc",

      /*
        Standard CD/DVD/Blu-ray:
        120 mm outside / 15 mm centre hole.
      */
      holeRatio: 15 / 120,

      rotates: true,
    },

    "gamecube-disc": {
      label: "GameCube Game Disc (80 mm)",
      shortLabel: "GameCube disc",
      mediaType: "disc",

      ratio: 1,
      shape: "disc",

      /*
        80 mm disc with a 15 mm centre hole.
      */
      holeRatio: 15 / 80,

      rotates: true,
    },

    umd: {
      label: "PSP UMD",
      shortLabel: "UMD",
      mediaType: "disc",

      /*
        Whole UMD shell:
        approximately 65 × 64 mm.
      */
      ratio: 65 / 64,

      shape: "umd",

      /*
        The artwork-facing shell is not treated
        as having a centre hole.
      */
      holeRatio: 0,

      rotates: false,
    },

    /* ---------------- Cartridge ---------------- */

    "generic-cartridge": {
      label: "Other / generic cartridge",
      shortLabel: "Cartridge",
      mediaType: "cartridge",
      ratio: 0.78,
      shape: "rounded",
      rotates: false,
    },

    nes: {
      label: "NES Game Pak",
      shortLabel: "NES cartridge",
      mediaType: "cartridge",
      ratio: 120 / 134,
      shape: "nes",
      rotates: false,
    },

    "snes-pal": {
      label: "SNES / Super Famicom (PAL / Japan)",
      shortLabel: "SNES cartridge",
      mediaType: "cartridge",
      ratio: 127 / 86,
      shape: "snes-pal",
      rotates: false,
    },

    "snes-us": {
      label: "SNES (North America)",
      shortLabel: "SNES cartridge",
      mediaType: "cartridge",
      ratio: 135.85 / 87.7,
      shape: "snes-us",
      rotates: false,
    },

    n64: {
      label: "Nintendo 64 cartridge",
      shortLabel: "N64 cartridge",
      mediaType: "cartridge",
      ratio: 116 / 76.6,
      shape: "n64",
      rotates: false,
    },

    "game-boy": {
      label: "Game Boy cartridge",
      shortLabel: "Game Boy cartridge",
      mediaType: "cartridge",
      ratio: 57 / 65,
      shape: "game-boy",
      rotates: false,
    },

    "game-boy-color": {
      label: "Game Boy Color cartridge",
      shortLabel: "Game Boy Color cartridge",
      mediaType: "cartridge",
      ratio: 57 / 65.5,
      shape: "game-boy-color",
      rotates: false,
    },

    "game-boy-advance": {
      label: "Game Boy Advance cartridge",
      shortLabel: "GBA cartridge",
      mediaType: "cartridge",
      ratio: 60 / 35,
      shape: "gba",
      rotates: false,
    },

    "ds-card": {
      label: "Nintendo DS Game Card",
      shortLabel: "DS Game Card",
      mediaType: "cartridge",
      ratio: 33 / 35,
      shape: "ds-card",
      rotates: false,
    },

    "3ds-card": {
      label: "Nintendo 3DS Game Card",
      shortLabel: "3DS Game Card",
      mediaType: "cartridge",

      /*
        Body is about 33 mm wide.
        Bounding box allows for the 3DS corner tab.
      */
      ratio: 1,

      shape: "3ds-card",
      rotates: false,
    },

    "switch-card": {
      label: "Nintendo Switch Game Card",
      shortLabel: "Switch Game Card",
      mediaType: "cartridge",
      ratio: 21 / 31,
      shape: "switch-card",
      rotates: false,
    },

    "vita-card": {
      label: "PS Vita Game Card",
      shortLabel: "PS Vita Game Card",
      mediaType: "cartridge",
      ratio: 22 / 30,
      shape: "vita-card",
      rotates: false,
    },
  };

  /* =====================================================
     PLATFORM DEFAULTS
  ===================================================== */

  const PLATFORM_DEFAULTS = {
    PlayStation: {
      mediaType: "disc",
      mediaFormat: "standard-disc",
      caseFormat: "ps1",
    },

    "PlayStation 2": {
      mediaType: "disc",
      mediaFormat: "standard-disc",
      caseFormat: "dvd",
    },

    "PlayStation 3": {
      mediaType: "disc",
      mediaFormat: "standard-disc",
      caseFormat: "blu-ray",
    },

    "PlayStation 4": {
      mediaType: "disc",
      mediaFormat: "standard-disc",
      caseFormat: "blu-ray",
    },

    "PlayStation 5": {
      mediaType: "disc",
      mediaFormat: "standard-disc",
      caseFormat: "blu-ray",
    },

    Xbox: {
      mediaType: "disc",
      mediaFormat: "standard-disc",
      caseFormat: "dvd",
    },

    "Xbox 360": {
      mediaType: "disc",
      mediaFormat: "standard-disc",
      caseFormat: "dvd",
    },

    "Xbox One": {
      mediaType: "disc",
      mediaFormat: "standard-disc",
      caseFormat: "blu-ray",
    },

    "Xbox Series X/S": {
      mediaType: "disc",
      mediaFormat: "standard-disc",
      caseFormat: "blu-ray",
    },

    "Nintendo Entertainment System": {
      mediaType: "cartridge",
      mediaFormat: "nes",
      caseFormat: "",
    },

    "Super Nintendo": {
      mediaType: "cartridge",
      mediaFormat: "snes-pal",
      caseFormat: "",
    },

    "Nintendo 64": {
      mediaType: "cartridge",
      mediaFormat: "n64",
      caseFormat: "",
    },

    GameCube: {
      mediaType: "disc",
      mediaFormat: "gamecube-disc",
      caseFormat: "gamecube",
    },

    Wii: {
      mediaType: "disc",
      mediaFormat: "standard-disc",
      caseFormat: "dvd",
    },

    "Wii U": {
      mediaType: "disc",
      mediaFormat: "standard-disc",
      caseFormat: "dvd",
    },

    Switch: {
      mediaType: "cartridge",
      mediaFormat: "switch-card",
      caseFormat: "switch",
    },

    "Game Boy": {
      mediaType: "cartridge",
      mediaFormat: "game-boy",
      caseFormat: "",
    },

    "Game Boy Color": {
      mediaType: "cartridge",
      mediaFormat: "game-boy-color",
      caseFormat: "",
    },

    "Game Boy Advance": {
      mediaType: "cartridge",
      mediaFormat: "game-boy-advance",
      caseFormat: "",
    },

    "Nintendo DS": {
      mediaType: "cartridge",
      mediaFormat: "ds-card",
      caseFormat: "ds",
    },

    "Nintendo 3DS": {
      mediaType: "cartridge",
      mediaFormat: "3ds-card",
      caseFormat: "3ds",
    },

    PSP: {
      mediaType: "disc",
      mediaFormat: "umd",
      caseFormat: "psp",
    },

    "PS Vita": {
      mediaType: "cartridge",
      mediaFormat: "vita-card",
      caseFormat: "vita",
    },

    PC: {
      mediaType: "disc",
      mediaFormat: "standard-disc",
      caseFormat: "",
    },

    Other: {
      mediaType: "",
      mediaFormat: "",
      caseFormat: "",
    },
  };

  /* =====================================================
     HELPERS
  ===================================================== */

  function normalizeCaseFormat(value) {
    const aliases = {
      standard: "dvd",
      "ps3-ps4-ps5": "blu-ray",
      "ps1-jewel": "ps1",
      "nintendo-ds": "ds",
    };

    return aliases[value] || value || "";
  }

  function getCaseRatio({
    caseFormat,
    role = "cover",
    customWidth,
    customHeight,
  } = {}) {
    const format = normalizeCaseFormat(caseFormat) || "dvd";

    if (format === "custom") {
      const width = Number(customWidth);
      const height = Number(customHeight);

      const coverRatio =
        Number.isFinite(width) &&
        Number.isFinite(height) &&
        width > 0 &&
        height > 0
          ? width / height
          : 135 / 190;

      if (role === "side") {
        return coverRatio * (14 / 135);
      }

      return coverRatio;
    }

    const definition = CASE_FORMATS[format] || CASE_FORMATS.dvd;

    return definition[role] || definition.cover;
  }

  function inferMediaFormat({
    platform = "",
    mediaType = "",
    region = "",
  } = {}) {
    /*
      SNES shells differ substantially between
      North America and PAL/Japan.
    */

    if (platform === "Super Nintendo") {
      return region === "North America" ? "snes-us" : "snes-pal";
    }

    const preset = PLATFORM_DEFAULTS[platform];

    if (
      preset?.mediaFormat &&
      MEDIA_FORMATS[preset.mediaFormat]?.mediaType === mediaType
    ) {
      return preset.mediaFormat;
    }

    if (mediaType === "disc") {
      return "standard-disc";
    }

    if (mediaType === "cartridge") {
      return "generic-cartridge";
    }

    return "";
  }

  function resolveMediaFormat({
    mediaFormat = "",
    platform = "",
    mediaType = "",
    region = "",
  } = {}) {
    const existing = MEDIA_FORMATS[mediaFormat];

    if (existing && existing.mediaType === mediaType) {
      return mediaFormat;
    }

    return inferMediaFormat({
      platform,
      mediaType,
      region,
    });
  }

  function getMediaDefinition(options = {}) {
    const key = resolveMediaFormat(options);

    return MEDIA_FORMATS[key] || null;
  }

  window.ShelfmarkFormats = {
    CASE_FORMATS,
    MEDIA_FORMATS,
    PLATFORM_DEFAULTS,

    normalizeCaseFormat,
    getCaseRatio,
    inferMediaFormat,
    resolveMediaFormat,
    getMediaDefinition,
  };
})();
