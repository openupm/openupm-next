/* Refresh page when a chunk fails to load
 * Modified from https://raw.githubusercontent.com/cwaring/vuepress-plugin-chunkload-redirect/main/clientRootMixin.js
 */
function unhandledRejection(e) {
  if (/loading chunk \d* failed./i.test(e.reason)) {
    const targetPath = this.$router.history.pending.fullPath;
    if (targetPath) {
      console.log('Reloading page to handle loading chunk error...');
      window.removeEventListener('unhandledrejection', unhandledRejection);
      window.location.pathname = targetPath;
    }
  }
}

// catch unhandledRejection from promise
window.addEventListener('unhandledrejection', unhandledRejection);