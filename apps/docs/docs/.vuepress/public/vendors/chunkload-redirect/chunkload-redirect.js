/* Refresh page when a chunk fails to load
 * Modified from https://raw.githubusercontent.com/cwaring/vuepress-plugin-chunkload-redirect/main/clientRootMixin.js
 */
function unhandledRejection(e) {
  console.error("unhandledrejection", e);
  if (/loading chunk \d* failed./i.test(e.reason))
    window.location.href = window.location.href;
}

// catch unhandledRejection from promise
window.removeEventListener("unhandledrejection", unhandledRejection);
window.addEventListener("unhandledrejection", unhandledRejection);
