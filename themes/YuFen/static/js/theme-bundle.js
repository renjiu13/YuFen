/* ============================================
 * YuFen 主题 - 合并脚本 theme-bundle.js
 * 作用：合并 code-block.js + theme.js，减少 HTTP 请求
 * ============================================ */


/* ========== code-block.js ========== */

/* ============================================
 * YuFen 主题 - 代码块交互脚本
 * 作用：代码复制功能
 * 功能：
 *   1. 复制代码到剪贴板 (Clipboard API + textarea 降级方案)
 *   2. 复制成功/失败状态反馈动画
 *   3. 智能定位代码内容（自动跳过行号）
 * ============================================ */

/* 复制代码到剪贴板 */
window.copyCode = function (e, btn) {
  e.stopPropagation();
  var container = btn.closest('.code-block-container');
  if (!container) return;

  /* 获取代码元素（优先取行号表格的代码列，避免复制行号） */
  var codeWrapper = container.querySelector('.code-content-wrapper');
  var codeEl = null;

  /* 优先取行号表格中的代码列（第二个 lntd） */
  var lntable = codeWrapper.querySelector('.lntable');
  if (lntable) {
    var lntds = lntable.querySelectorAll('.lntd');
    if (lntds.length >= 2) {
      codeEl = lntds[1].querySelector('code') || lntds[1];
    }
  }

  /* 降级：直接取 code 元素 */
  if (!codeEl) {
    codeEl = codeWrapper.querySelector('code');
  }

  if (!codeEl) return;

  /* 获取纯文本 */
  var text = codeEl.innerText || codeEl.textContent;

  /* 优先使用 Clipboard API */
  navigator.clipboard.writeText(text).then(function () {
    showCopySuccess(btn);
  }).catch(function () {
    /* 降级方案：使用 textarea + execCommand */
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showCopySuccess(btn);
    } catch (err) {
      showCopyFailed(btn);
    }
    document.body.removeChild(textarea);
  });
};

/* 显示复制成功状态 */
function showCopySuccess(btn) {
  btn.classList.add('copied');
  var svgEl = btn.querySelector('svg');
  var textEl = btn.querySelector('span');
  var originalText = textEl ? textEl.textContent : btn.textContent;
  var originalSvg = svgEl ? svgEl.outerHTML : '';

  if (svgEl) {
    svgEl.outerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  }
  if (textEl) {
    textEl.textContent = '已复制';
  } else {
    btn.textContent = '已复制';
  }

  /* 1.5 秒后恢复 */
  setTimeout(function () {
    btn.classList.remove('copied');
    var newSvg = btn.querySelector('svg');
    if (newSvg && originalSvg) {
      newSvg.outerHTML = originalSvg;
    }
    if (textEl) {
      textEl.textContent = originalText;
    } else {
      btn.textContent = originalText;
    }
  }, 1500);
}

/* 显示复制失败状态 */
function showCopyFailed(btn) {
  var textEl = btn.querySelector('span');
  var originalText = textEl ? textEl.textContent : btn.textContent;

  if (textEl) {
    textEl.textContent = '失败';
  } else {
    btn.textContent = '失败';
  }

  setTimeout(function () {
    if (textEl) {
      textEl.textContent = originalText;
    } else {
      btn.textContent = originalText;
    }
  }, 1500);
}

/* DOM 加载后无需额外绑定，复制按钮通过 HTML onclick 属性直接调用 */


/* ========== theme.js ========== */

/* ============================================
 * YuFen 主题 - 主题切换与回到顶部
 * 作用：暗色/浅色模式切换 + 回到顶部按钮交互
 * 功能：
 *   1. 主题切换按钮点击事件与图标切换（CSS 驱动，无需 JS 操纵图标）
 *   2. aria-pressed 状态同步（无障碍）
 *   3. 回到顶部按钮的显示/隐藏和滚动动画
 *   4. 键盘可访问性支持 (Enter/Space)
 * 说明：主题初始化已移至 head-assets.html 内联脚本，防止 FOUC 闪烁
 * ============================================ */

(function () {
  var themeToggleBtn = document.getElementById('theme-toggle');
  var backToTopBtn = document.getElementById('back-to-top');

  /* ---------- 主题切换 ---------- */
  if (themeToggleBtn) {
    /* 同步初始 aria-pressed 状态 */
    var isDark = document.documentElement.classList.contains('dark');
    themeToggleBtn.setAttribute('aria-pressed', isDark);

    themeToggleBtn.addEventListener('click', function () {
      document.documentElement.classList.toggle('dark');
      var dark = document.documentElement.classList.contains('dark');
      localStorage.theme = dark ? 'dark' : 'light';
      themeToggleBtn.setAttribute('aria-pressed', dark);
    });
  }

  /* ---------- 回到顶部 ---------- */
  if (backToTopBtn) {
    /* 节流函数：避免滚动事件频繁触发 */
    function throttle(fn, delay) {
      var lastTime = 0;
      var timer = null;
      return function () {
        var now = Date.now();
        var remaining = delay - (now - lastTime);
        if (remaining <= 0) {
          clearTimeout(timer);
          timer = null;
          lastTime = now;
          fn.apply(this, arguments);
        } else if (!timer) {
          timer = setTimeout(function () {
            lastTime = Date.now();
            timer = null;
            fn.apply(this, arguments);
          }, remaining);
        }
      };
    }

    /* 滚动监听：控制按钮显示/隐藏（节流 100ms） */
    var handleScroll = throttle(function () {
      if (window.pageYOffset > 300) {
        backToTopBtn.classList.add('show');
      } else {
        backToTopBtn.classList.remove('show');
      }
    }, 100);

    window.addEventListener('scroll', handleScroll, { passive: true });

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
