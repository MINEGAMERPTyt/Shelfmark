document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("delete-account-form");

  const passwordInput = document.getElementById("delete-password");

  const confirmationInput = document.getElementById("delete-confirmation");

  const messageElement = document.getElementById("delete-account-message");

  const submitButton = document.getElementById("delete-account-submit");

  const supabaseClient = window.shelfmarkSupabase;

  function setMessage(message, type = "") {
    if (!messageElement) {
      return;
    }

    messageElement.textContent = message;

    messageElement.classList.remove("visible", "success", "error");

    if (!message) {
      return;
    }

    messageElement.classList.add("visible");

    if (type) {
      messageElement.classList.add(type);
    }
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!supabaseClient) {
      return;
    }

    const password = passwordInput?.value || "";

    const confirmation = confirmationInput?.value.trim() || "";

    if (!password) {
      setMessage("Enter your current password.", "error");

      passwordInput?.focus();

      return;
    }

    if (confirmation !== "DELETE") {
      setMessage(
        "Type DELETE exactly to confirm permanent account deletion.",
        "error",
      );

      confirmationInput?.focus();

      return;
    }

    submitButton.disabled = true;

    submitButton.textContent = "Deleting account…";

    try {
      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser();

      if (userError || !user?.email) {
        throw new Error("Your account session is unavailable.");
      }

      /*
            Re-authenticate before allowing
            this destructive operation.
          */

      const { error: passwordError } =
        await supabaseClient.auth.signInWithPassword({
          email: user.email,

          password,
        });

      if (passwordError) {
        setMessage("Your current password is incorrect.", "error");

        submitButton.disabled = false;

        submitButton.textContent = "Permanently delete account";

        return;
      }

      const { data, error } = await supabaseClient.functions.invoke(
        "delete-account",
        {
          body: {},
        },
      );

      if (error || !data?.deleted) {
        throw error || new Error("Account deletion failed.");
      }

      try {
        await supabaseClient.auth.signOut({
          scope: "local",
        });
      } catch {
        /* Account no longer exists. */
      }

      window.location.replace("index.html");
    } catch (error) {
      console.error("Shelfmark account deletion:", error);

      setMessage(
        "Your account could not be deleted. No further action has been taken automatically. Please try again.",
        "error",
      );

      submitButton.disabled = false;

      submitButton.textContent = "Permanently delete account";
    }
  });
});
