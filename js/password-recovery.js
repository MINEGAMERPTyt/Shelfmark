document.addEventListener("DOMContentLoaded", async () => {
  const supabaseClient = window.shelfmarkSupabase;

  if (!supabaseClient) {
    return;
  }

  /* ========================================
       REQUEST RESET
    ======================================== */

  const requestForm = document.getElementById("password-reset-request-form");

  const emailInput = document.getElementById("recovery-email");

  const requestMessage = document.getElementById("recovery-message");

  const requestButton = document.getElementById("recovery-submit");

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

  requestForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput?.value.trim() || "";

    if (!email || !email.includes("@")) {
      setMessage(requestMessage, "Enter a valid email address.", "error");

      emailInput?.focus();

      return;
    }

    requestButton.disabled = true;

    requestButton.textContent = "Sending…";

    setMessage(requestMessage, "");

    try {
      const redirectTo = `${window.location.origin}/reset-password.html`;

      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        throw error;
      }

      /*
            Keep the response generic.

            This avoids confirming whether
            a specific email has an account.
          */

      setMessage(
        requestMessage,
        "If an account exists for that email address, a recovery link has been sent. Check your inbox and spam folder.",
        "success",
      );

      requestForm.reset();
    } catch (error) {
      console.error("Shelfmark password recovery error:", error);

      setMessage(
        requestMessage,
        "The recovery email could not be sent. Please try again.",
        "error",
      );
    } finally {
      requestButton.disabled = false;

      requestButton.textContent = "Send recovery link";
    }
  });

  /* ========================================
       UPDATE PASSWORD
    ======================================== */

  const updateForm = document.getElementById("password-update-form");

  if (!updateForm) {
    return;
  }

  const passwordInput = document.getElementById("new-password");

  const confirmationInput = document.getElementById("confirm-new-password");

  const updateMessage = document.getElementById("password-update-message");

  const updateButton = document.getElementById("password-update-submit");

  let recoveryReady = false;

  function enableRecoveryForm() {
    recoveryReady = true;

    if (updateButton) {
      updateButton.disabled = false;
    }

    setMessage(updateMessage, "");
  }

  /* ----------------------------------------
       URL errors
    ---------------------------------------- */

  const hashParams = new URLSearchParams(window.location.hash.slice(1));

  const queryParams = new URLSearchParams(window.location.search);

  const recoveryError =
    hashParams.get("error_description") || queryParams.get("error_description");

  if (recoveryError) {
    setMessage(
      updateMessage,
      "This recovery link is invalid or has expired. Request a new password reset link.",
      "error",
    );
  }

  /* ----------------------------------------
       Auth event
    ---------------------------------------- */

  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY" && session) {
      enableRecoveryForm();
    }
  });

  /*
      Also check whether the recovery
      session has already been established
      before this listener ran.
    */

  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (session) {
    enableRecoveryForm();
  } else if (!recoveryError) {
    setMessage(
      updateMessage,
      "Open this page using the recovery link sent to your email.",
    );
  }

  updateForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!recoveryReady) {
      setMessage(
        updateMessage,
        "This password recovery session is not valid.",
        "error",
      );

      return;
    }

    const password = passwordInput?.value || "";

    const confirmation = confirmationInput?.value || "";

    if (password.length < 8) {
      setMessage(
        updateMessage,
        "Your new password must contain at least 8 characters.",
        "error",
      );

      passwordInput?.focus();

      return;
    }

    if (password !== confirmation) {
      setMessage(updateMessage, "The passwords do not match.", "error");

      confirmationInput?.focus();

      return;
    }

    updateButton.disabled = true;

    updateButton.textContent = "Updating…";

    try {
      const { error } = await supabaseClient.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      setMessage(
        updateMessage,
        "Your password has been updated. You can now return to the login page.",
        "success",
      );

      passwordInput.disabled = true;

      confirmationInput.disabled = true;

      updateButton.textContent = "Password updated";
    } catch (error) {
      console.error("Shelfmark password update error:", error);

      setMessage(
        updateMessage,
        "Your password could not be updated. Request a new recovery link and try again.",
        "error",
      );

      updateButton.disabled = false;

      updateButton.textContent = "Update password";
    }
  });
});
