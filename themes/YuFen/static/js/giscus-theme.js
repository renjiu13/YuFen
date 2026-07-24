/* ============================================
 * YuFen 主题 - Giscus 评论区主题同步
 * 作用：切换主题时同步更新 Giscus 评论框配色
 * 功能：监听主题切换按钮，向 Giscus iframe
 *       发送 setConfig 消息更新主题
 * 说明：仅在评论功能启用时加载
 * ============================================ */

document.addEventListener('DOMContentLoaded', function () {
  var toggleButton = document.getElementById('theme-toggle');
  if (!toggleButton) return;

  toggleButton.addEventListener('click', function () {
    setTimeout(function () {
      var giscusFrame = document.querySelector('iframe.giscus-frame');
      if (giscusFrame) {
        var theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        giscusFrame.contentWindow.postMessage({
          giscus: { setConfig: { theme: theme } }
        }, 'https://giscus.app');
      }
    }, 100);
  });
});
