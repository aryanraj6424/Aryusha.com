const GOOGLE_CLIENT_ID =
  "463458879565-t3e512uoqcns9920csa5fhar1o9mh13v.apps.googleusercontent.com";

/**
 * Dynamically loads the Google Identity Services script if not already present.
 */
function loadGISScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );
    if (existing) {
      existing.addEventListener("load", resolve);
      existing.addEventListener("error", () => reject(new Error("Failed to load GIS script")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Failed to load Google Identity Services script"));
    document.head.appendChild(script);
  });
}

/**
 * Opens a Google Sign-In popup via Google Identity Services (GIS).
 * No Firebase involved.
 *
 * @returns {Promise<string>} Resolves with the Google ID token string.
 * @throws with a user-facing error message string on failure.
 */
export async function signInWithGoogle() {
  await loadGISScript();

  return new Promise((resolve, reject) => {
    // Initialize GIS with our client ID
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (response?.credential) {
          resolve(response.credential);
        } else {
          reject(new Error("Google sign-in was cancelled or failed."));
        }
      },
      cancel_on_tap_outside: true,
    });

    // Prompt the One-Tap / popup flow
    window.google.accounts.id.prompt((notification) => {
      if (
        notification.isNotDisplayed() ||
        notification.isSkippedMoment()
      ) {
        // One-Tap was suppressed — fall back to the explicit popup
        const container = document.createElement("div");
        container.style.display = "none";
        document.body.appendChild(container);

        window.google.accounts.id.renderButton(container, {
          type: "standard",
          size: "large",
          theme: "outline",
        });

        // Find and click the rendered button to trigger popup
        const btn = container.querySelector("div[role='button']");
        if (btn) {
          btn.click();
        } else {
          document.body.removeChild(container);
          reject(new Error("Google sign-in popup could not be opened. Please try again."));
        }

        // Clean up the hidden container after a short delay
        setTimeout(() => {
          if (document.body.contains(container)) {
            document.body.removeChild(container);
          }
        }, 5000);
      }
    });
  });
}
