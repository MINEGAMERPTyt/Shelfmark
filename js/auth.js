document.addEventListener("DOMContentLoaded", () => {
  /* =========================================================
     SUPABASE
  ========================================================= */

  const supabaseClient = window.shelfmarkSupabase;

  if (!supabaseClient) {
    console.error(
      "Shelfmark Auth: Supabase client was not found. Make sure supabase.js loads before auth.js.",
    );

    return;
  }

  /* =========================================================
     STATE
  ========================================================= */

  let currentUser = null;
  let currentProfile = null;

  /* =========================================================
     ELEMENTS
  ========================================================= */

  const userOnlyElements = document.querySelectorAll('[data-auth="user"]');

  const guestOnlyElements = document.querySelectorAll('[data-auth="guest"]');

  const userNameElements = document.querySelectorAll("[data-user-name]");

  const logoutButtons = document.querySelectorAll(
    '[data-auth-action="logout"]',
  );

  /* =========================================================
     DISABLE NATIVE BROWSER VALIDATION

     Shelfmark handles validation itself so that we can show
     our own messages instead of browser popups such as:
     "Please fill out this field."
  ========================================================= */

  document.querySelectorAll(".auth-form, .settings-form").forEach((form) => {
    form.noValidate = true;
  });

  /* =========================================================
     MESSAGE HELPERS
  ========================================================= */

  function setMessage(element, message, type = "") {
    if (!element) {
      return;
    }

    element.textContent = message;

    element.classList.remove("visible", "success", "error");

    if (!message) {
      return;
    }

    element.classList.add("visible");

    if (type) {
      element.classList.add(type);
    }
  }

  /* =========================================================
     CUSTOM VALIDATION
  ========================================================= */

  function clearFieldErrors(form) {
    if (!form) {
      return;
    }

    form.querySelectorAll(".is-invalid").forEach((input) => {
      input.classList.remove("is-invalid");
      input.removeAttribute("aria-invalid");
    });
  }

  function markFieldInvalid(input) {
    if (!input) {
      return;
    }

    input.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");
  }

  function focusInvalidField(input) {
    if (!input) {
      return;
    }

    markFieldInvalid(input);
    input.focus();
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /* =========================================================
     BUTTON LOADING
  ========================================================= */

  function setButtonLoading(button, loading, loadingText = "") {
    if (!button) {
      return;
    }

    if (loading) {
      /*
        Only save the original text once.
      */
      if (!button.dataset.originalText) {
        button.dataset.originalText = button.textContent.trim();
      }

      button.textContent = loadingText;
      button.disabled = true;

      return;
    }

    button.textContent = button.dataset.originalText || button.textContent;

    button.disabled = false;
  }

  /* =========================================================
     DISPLAY NAME
  ========================================================= */

  function getDisplayName(user, profile) {
    return (
      profile?.username ||
      user?.user_metadata?.username ||
      user?.email?.split("@")[0] ||
      "Account"
    );
  }

  /* =========================================================
     PROFILE
  ========================================================= */

  async function getProfile(userId) {
    if (!userId) {
      return null;
    }

    const { data, error } = await supabaseClient
      .from("profiles")
      .select("id, username, avatar_path, created_at, updated_at")
      .eq("id", userId)
      .limit(1);

    if (error) {
      console.warn("Shelfmark Auth: Could not load profile:", error);

      return null;
    }

    return data?.[0] || null;
  }

  /* =========================================================
     AUTH UI
  ========================================================= */

  function updateAuthVisibility(user) {
    const signedIn = Boolean(user);

    userOnlyElements.forEach((element) => {
      element.hidden = !signedIn;
    });

    guestOnlyElements.forEach((element) => {
      element.hidden = signedIn;
    });
  }

  function updateUserNames(user, profile) {
    if (!user) {
      return;
    }

    const displayName = getDisplayName(user, profile);

    userNameElements.forEach((element) => {
      element.textContent = displayName;
    });
  }

  /* =========================================================
     PROFILE PAGE
  ========================================================= */

  function populateProfilePage(user, profile) {
    if (!user) {
      return;
    }

    const usernameElement = document.getElementById("profile-username");

    const emailElement = document.getElementById("profile-email");

    const createdElement = document.getElementById("profile-created-at");

    if (usernameElement) {
      usernameElement.textContent = getDisplayName(user, profile);
    }

    if (emailElement) {
      emailElement.textContent = user.email || "N/D";
    }

    if (createdElement) {
      const createdAt = profile?.created_at || user.created_at;

      if (createdAt) {
        createdElement.textContent = new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }).format(new Date(createdAt));
      } else {
        createdElement.textContent = "N/D";
      }
    }
  }

  /* =========================================================
     SETTINGS PAGE
  ========================================================= */

  function populateSettingsPage(user, profile) {
    if (!user) {
      return;
    }

    const usernameInput = document.getElementById("settings-username");

    const emailInput = document.getElementById("settings-email");

    if (usernameInput) {
      usernameInput.value = getDisplayName(user, profile);
    }

    if (emailInput) {
      emailInput.value = user.email || "";
    }
  }

  /* =========================================================
     SAFE REDIRECT
  ========================================================= */

  function getNextPage(defaultPage = "collection.html") {
    const params = new URLSearchParams(window.location.search);

    const next = params.get("next");

    if (!next) {
      return defaultPage;
    }

    /*
      Only allow local Shelfmark HTML pages.

      This prevents something like:

      login.html?next=https://malicious-site.com
    */
    if (/^[a-zA-Z0-9_-]+\.html(?:\?.*)?$/.test(next)) {
      return next;
    }

    return defaultPage;
  }

  function getCurrentPage() {
    const fileName = window.location.pathname.split("/").pop() || "index.html";

    return `${fileName}${window.location.search}`;
  }

  /* =========================================================
     PAGE PROTECTION
  ========================================================= */

  function handlePageProtection(user) {
    const requiresAuth = document.body.dataset.requireAuth === "true";

    const guestOnly = document.body.dataset.guestOnly === "true";

    /*
      Protected page but no user:
      send them to login.
    */
    if (requiresAuth && !user) {
      const next = encodeURIComponent(getCurrentPage());

      window.location.replace(`login.html?next=${next}`);

      return false;
    }

    /*
      Login / register page but user is
      already authenticated.
    */
    if (guestOnly && user) {
      window.location.replace(getNextPage("collection.html"));

      return false;
    }

    return true;
  }

  /* =========================================================
     REFRESH AUTH STATE
  ========================================================= */

  async function refreshAuthState() {
    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser();

    if (error) {
      console.warn("Shelfmark Auth: Could not retrieve user:", error);
    }

    currentUser = user || null;

    /*
      Update navbar / page visibility immediately.
    */
    updateAuthVisibility(currentUser);

    if (!handlePageProtection(currentUser)) {
      return;
    }

    if (!currentUser) {
      currentProfile = null;

      return;
    }

    currentProfile = await getProfile(currentUser.id);

    updateUserNames(currentUser, currentProfile);

    populateProfilePage(currentUser, currentProfile);

    populateSettingsPage(currentUser, currentProfile);
  }

  /* =========================================================
     REGISTER
  ========================================================= */

  const registerForm = document.getElementById("register-form");

  registerForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const usernameInput = document.getElementById("register-username");

    const emailInput = document.getElementById("register-email");

    const passwordInput = document.getElementById("register-password");

    const confirmPasswordInput = document.getElementById(
      "register-confirm-password",
    );

    const message = document.getElementById("auth-message");

    const submitButton = registerForm.querySelector('button[type="submit"]');

    const username = usernameInput?.value.trim() || "";

    const email = emailInput?.value.trim() || "";

    const password = passwordInput?.value || "";

    const confirmPassword = confirmPasswordInput?.value || "";

    setMessage(message, "");
    clearFieldErrors(registerForm);

    /* =====================================================
         USERNAME
      ===================================================== */

    if (!username) {
      setMessage(message, "Enter a username.", "error");

      focusInvalidField(usernameInput);

      return;
    }

    if (username.length < 2) {
      setMessage(
        message,
        "Username must contain at least 2 characters.",
        "error",
      );

      focusInvalidField(usernameInput);

      return;
    }

    /* =====================================================
         EMAIL
      ===================================================== */

    if (!email) {
      setMessage(message, "Enter your email address.", "error");

      focusInvalidField(emailInput);

      return;
    }

    if (!isValidEmail(email)) {
      setMessage(message, "Enter a valid email address.", "error");

      focusInvalidField(emailInput);

      return;
    }

    /* =====================================================
         PASSWORD
      ===================================================== */

    if (!password) {
      setMessage(message, "Enter a password.", "error");

      focusInvalidField(passwordInput);

      return;
    }

    if (password.length < 8) {
      setMessage(
        message,
        "Password must contain at least 8 characters.",
        "error",
      );

      focusInvalidField(passwordInput);

      return;
    }

    /* =====================================================
         CONFIRM PASSWORD
      ===================================================== */

    if (!confirmPassword) {
      setMessage(message, "Confirm your password.", "error");

      focusInvalidField(confirmPasswordInput);

      return;
    }

    if (password !== confirmPassword) {
      setMessage(message, "The passwords do not match.", "error");

      markFieldInvalid(passwordInput);

      focusInvalidField(confirmPasswordInput);

      return;
    }

    /* =====================================================
         CREATE ACCOUNT
      ===================================================== */

    setButtonLoading(submitButton, true, "Creating account…");

    try {
      const redirectUrl = new URL(
        "login.html?confirmed=1",
        window.location.href,
      ).href;

      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,

        options: {
          data: {
            username,
          },

          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        throw error;
      }

      /*
          If email confirmation has been disabled,
          Supabase may create a session immediately.
        */
      if (data.session) {
        window.location.href = "collection.html";

        return;
      }

      registerForm.reset();

      clearFieldErrors(registerForm);

      setMessage(
        message,
        "Account created. Check your email and confirm your address before logging in.",
        "success",
      );
    } catch (error) {
      console.error("Shelfmark registration error:", error);

      /*
          Convert common Supabase messages into
          messages that match Shelfmark.
        */
      const errorMessage = error?.message?.toLowerCase() || "";

      if (
        errorMessage.includes("already registered") ||
        errorMessage.includes("already exists") ||
        errorMessage.includes("user already registered")
      ) {
        setMessage(
          message,
          "An account already exists with this email address.",
          "error",
        );

        focusInvalidField(emailInput);

        return;
      }

      if (errorMessage.includes("email") && errorMessage.includes("invalid")) {
        setMessage(message, "Enter a valid email address.", "error");

        focusInvalidField(emailInput);

        return;
      }

      if (errorMessage.includes("password")) {
        setMessage(
          message,
          error.message || "This password cannot be used.",
          "error",
        );

        focusInvalidField(passwordInput);

        return;
      }

      setMessage(
        message,
        "Your account could not be created. Please try again.",
        "error",
      );
    } finally {
      setButtonLoading(submitButton, false);
    }
  });

  /* =========================================================
     LOGIN
  ========================================================= */

  const loginForm = document.getElementById("login-form");

  if (loginForm) {
    const params = new URLSearchParams(window.location.search);

    if (params.get("confirmed") === "1") {
      setMessage(
        document.getElementById("auth-message"),
        "Email confirmed. You can now log in.",
        "success",
      );
    }
  }

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const emailInput = document.getElementById("login-email");

    const passwordInput = document.getElementById("login-password");

    const message = document.getElementById("auth-message");

    const submitButton = loginForm.querySelector('button[type="submit"]');

    const email = emailInput?.value.trim() || "";

    const password = passwordInput?.value || "";

    setMessage(message, "");
    clearFieldErrors(loginForm);

    /* =====================================================
         EMAIL
      ===================================================== */

    if (!email) {
      setMessage(message, "Enter your email address.", "error");

      focusInvalidField(emailInput);

      return;
    }

    if (!isValidEmail(email)) {
      setMessage(message, "Enter a valid email address.", "error");

      focusInvalidField(emailInput);

      return;
    }

    /* =====================================================
         PASSWORD
      ===================================================== */

    if (!password) {
      setMessage(message, "Enter your password.", "error");

      focusInvalidField(passwordInput);

      return;
    }

    /* =====================================================
         LOG IN
      ===================================================== */

    setButtonLoading(submitButton, true, "Logging in…");

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error("The account could not be loaded.");
      }

      window.location.href = getNextPage("collection.html");
    } catch (error) {
      console.error("Shelfmark login error:", error);

      const errorMessage = error?.message?.toLowerCase() || "";

      if (errorMessage.includes("email not confirmed")) {
        setMessage(
          message,
          "Confirm your email address before logging in.",
          "error",
        );

        focusInvalidField(emailInput);

        return;
      }

      /*
          Don't tell the user whether the email
          or password specifically was incorrect.
        */
      setMessage(message, "Incorrect email or password.", "error");

      markFieldInvalid(emailInput);

      focusInvalidField(passwordInput);
    } finally {
      setButtonLoading(submitButton, false);
    }
  });

  /* =========================================================
     LOG OUT
  ========================================================= */

  logoutButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      button.disabled = true;

      const { error } = await supabaseClient.auth.signOut({
        scope: "local",
      });

      if (error) {
        console.error("Shelfmark logout error:", error);

        button.disabled = false;

        return;
      }

      window.location.href = "index.html";
    });
  });

  /* =========================================================
     UPDATE USERNAME
  ========================================================= */

  const usernameSettingsForm = document.getElementById(
    "username-settings-form",
  );

  usernameSettingsForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!currentUser) {
      return;
    }

    const usernameInput = document.getElementById("settings-username");

    const message = document.getElementById("settings-profile-message");

    const submitButton = usernameSettingsForm.querySelector(
      'button[type="submit"]',
    );

    const username = usernameInput?.value.trim() || "";

    setMessage(message, "");

    clearFieldErrors(usernameSettingsForm);

    /* =====================================================
         USERNAME VALIDATION
      ===================================================== */

    if (!username) {
      setMessage(message, "Enter a username.", "error");

      focusInvalidField(usernameInput);

      return;
    }

    if (username.length < 2) {
      setMessage(
        message,
        "Username must contain at least 2 characters.",
        "error",
      );

      focusInvalidField(usernameInput);

      return;
    }

    /* =====================================================
         SAVE USERNAME
      ===================================================== */

    setButtonLoading(submitButton, true, "Saving…");

    try {
      const { error: profileError } = await supabaseClient
        .from("profiles")
        .update({
          username,
        })
        .eq("id", currentUser.id);

      if (profileError) {
        throw profileError;
      }

      /*
          Keep Supabase Auth metadata in sync
          with the profiles table.
        */
      const { error: authError } = await supabaseClient.auth.updateUser({
        data: {
          username,
        },
      });

      if (authError) {
        console.warn(
          "Username was updated in profiles but Auth metadata could not be updated:",
          authError,
        );
      }

      currentProfile = {
        ...currentProfile,
        username,
      };

      /*
          Also update our local user object's metadata
          so the UI remains consistent immediately.
        */
      currentUser = {
        ...currentUser,

        user_metadata: {
          ...currentUser.user_metadata,
          username,
        },
      };

      updateUserNames(currentUser, currentProfile);

      setMessage(message, "Username updated.", "success");
    } catch (error) {
      console.error("Shelfmark username update error:", error);

      setMessage(
        message,
        "Username could not be updated. Please try again.",
        "error",
      );
    } finally {
      setButtonLoading(submitButton, false);
    }
  });

  /* =========================================================
     CHANGE PASSWORD
  ========================================================= */

  const passwordSettingsForm = document.getElementById(
    "password-settings-form",
  );

  passwordSettingsForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const passwordInput = document.getElementById("settings-password");

    const confirmInput = document.getElementById("settings-confirm-password");

    const message = document.getElementById("settings-password-message");

    const submitButton = passwordSettingsForm.querySelector(
      'button[type="submit"]',
    );

    const password = passwordInput?.value || "";

    const confirmPassword = confirmInput?.value || "";

    setMessage(message, "");

    clearFieldErrors(passwordSettingsForm);

    /* =====================================================
         PASSWORD VALIDATION
      ===================================================== */

    if (!password) {
      setMessage(message, "Enter a new password.", "error");

      focusInvalidField(passwordInput);

      return;
    }

    if (password.length < 8) {
      setMessage(
        message,
        "Password must contain at least 8 characters.",
        "error",
      );

      focusInvalidField(passwordInput);

      return;
    }

    if (!confirmPassword) {
      setMessage(message, "Confirm your new password.", "error");

      focusInvalidField(confirmInput);

      return;
    }

    if (password !== confirmPassword) {
      setMessage(message, "The passwords do not match.", "error");

      markFieldInvalid(passwordInput);

      focusInvalidField(confirmInput);

      return;
    }

    /* =====================================================
         CHANGE PASSWORD
      ===================================================== */

    setButtonLoading(submitButton, true, "Updating…");

    try {
      const { error } = await supabaseClient.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      passwordSettingsForm.reset();

      clearFieldErrors(passwordSettingsForm);

      setMessage(message, "Password updated.", "success");
    } catch (error) {
      console.error("Shelfmark password update error:", error);

      const errorMessage = error?.message?.toLowerCase() || "";

      if (errorMessage.includes("password")) {
        setMessage(
          message,
          error.message || "This password cannot be used.",
          "error",
        );

        focusInvalidField(passwordInput);

        return;
      }

      setMessage(
        message,
        "Password could not be updated. Please try again.",
        "error",
      );
    } finally {
      setButtonLoading(submitButton, false);
    }
  });

  /* =========================================================
     CLEAR FIELD ERRORS WHILE TYPING

     Once the user starts correcting an invalid field,
     remove its red validation state.
  ========================================================= */

  document
    .querySelectorAll(".auth-form input, .settings-form input")
    .forEach((input) => {
      input.addEventListener("input", () => {
        input.classList.remove("is-invalid");

        input.removeAttribute("aria-invalid");
      });
    });

  /* =========================================================
     AUTH STATE CHANGES
  ========================================================= */

  supabaseClient.auth.onAuthStateChange(() => {
    /*
        Do the heavier async work outside of
        Supabase's auth callback.
      */
    window.setTimeout(() => {
      refreshAuthState();
    }, 0);
  });

  /* =========================================================
     INITIALIZE
  ========================================================= */

  refreshAuthState();
});
