/**
 * Register Service Worker for Progressive Web App (PWA)
 */
export function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[PWA] Service Worker registered with scope:", registration.scope);

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (!installingWorker) return;

            installingWorker.onstatechange = () => {
              if (installingWorker.state === "installed") {
                if (navigator.serviceWorker.controller) {
                  console.log("[PWA] New version available!");
                  window.dispatchEvent(new CustomEvent("pwa-update-available", { detail: registration }));
                } else {
                  console.log("[PWA] App cached for offline use.");
                }
              }
            };
          };
        })
        .catch((error) => {
          console.error("[PWA] Service Worker registration failed:", error);
        });
    });
  }
}
