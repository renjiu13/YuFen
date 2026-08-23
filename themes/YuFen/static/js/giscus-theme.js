/* ============================================
 * YuFen 主题 - Giscus 评论区主题同步
 * 作用：切换主题时同步更新 Giscus 评论框配色
 * 功能：监听 html 元素的 dark class 变化，
 *       向 Giscus iframe 发送 setConfig 消息
 * 说明：仅在评论功能启用时加载
 * ============================================ */

(function () {
  var giscusFrame = null;

  /* 获取当前主题 */
  function getCurrentTheme() {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }

  /* 向 Giscus 发送主题更新消息 */
  function updateGiscusTheme() {
    if (!giscusFrame) {
      giscusFrame = document.querySelector('iframe.giscus-frame');
    }
    if (giscusFrame) {
      giscusFrame.contentWindow.postMessage({
        giscus: { setConfig: { theme: getCurrentTheme() } }
      }, 'https://giscus.app');
    }
  }

  /* DOM 加载完成后开始监听 */
  document.addEventListener('DOMContentLoaded', function () {
    /* 使用 MutationObserver 监听 dark class 变化，比 click 事件更可靠 */
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.attributeName === 'class') {
          updateGiscusTheme();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    /* 初始同步一次（Giscus 加载完成后） */
    var initObserver = new MutationObserver(function () {
      var frame = document.querySelector('iframe.giscus-frame');
      if (frame) {
        giscusFrame = frame;
        updateGiscusTheme();
        initObserver.disconnect();
      }
    });

    initObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
})();
