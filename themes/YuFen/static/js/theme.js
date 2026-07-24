/* ============================================
 * YuFen 主题 - 主题切换与回到顶部
 * 作用：暗色/浅色模式切换 + 回到顶部按钮交互
 * 功能：
 *   1. 读取 localStorage 或系统偏好初始化主题
 *   2. 主题切换按钮点击事件与图标切换
 *   3. 回到顶部按钮的显示/隐藏和滚动动画
 *   4. 键盘可访问性支持 (Enter/Space)
 * 合并：原 theme.js + theme-controls.html 内联脚本
 * ============================================ */

(function () {
  var themeToggleBtn = document.getElementById('theme-toggle');
  var themeIcon = document.getElementById('theme-icon');
  var backToTopBtn = document.getElementById('back-to-top');

  /* ---------- 主题初始化 ---------- */
  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
    if (themeIcon) {
      themeIcon.classList.remove('fa-sun');
      themeIcon.classList.add('fa-moon');
    }
  } else {
    document.documentElement.classList.remove('dark');
  }

  /* ---------- 主题切换 ---------- */
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function () {
      document.documentElement.classList.toggle('dark');
      if (document.documentElement.classList.contains('dark')) {
        localStorage.theme = 'dark';
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
      } else {
        localStorage.theme = 'light';
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
      }
    });
  }

  /* ---------- 回到顶部 ---------- */
  if (backToTopBtn) {
    /* 滚动监听：控制按钮显示/隐藏 */
    window.addEventListener('scroll', function () {
      if (window.pageYOffset > 300) {
        backToTopBtn.classList.add('show');
      } else {
        backToTopBtn.classList.remove('show');
      }
    });

    /* 点击平滑滚动到顶部 */
    var scrollToTop = function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    backToTopBtn.addEventListener('click', scrollToTop);

    /* 键盘可访问性 */
    backToTopBtn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        scrollToTop();
      }
    });
  }
})();
