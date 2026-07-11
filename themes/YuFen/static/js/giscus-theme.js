/* Giscus 评论区暗色模式同步 */
document.addEventListener('DOMContentLoaded', function () {
  const toggleButton = document.getElementById('theme-toggle');
  if (!toggleButton) return;

  toggleButton.addEventListener('click', function () {
    setTimeout(() => {
      const giscusFrame = document.querySelector('iframe.giscus-frame');
      if (giscusFrame) {
        const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        giscusFrame.contentWindow.postMessage({
          giscus: { setConfig: { theme: theme } }
        }, 'https://giscus.app');
      }
    }, 100);
  });
});
