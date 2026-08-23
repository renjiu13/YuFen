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
  var iconEl = btn.querySelector('i');
  var textEl = btn.querySelector('span');
  var originalText = textEl ? textEl.textContent : btn.textContent;
  var originalIcon = iconEl ? iconEl.className : '';

  if (iconEl) {
    iconEl.className = 'fa-solid fa-check';
  }
  if (textEl) {
    textEl.textContent = '已复制';
  } else {
    btn.textContent = '已复制';
  }

  /* 1.5 秒后恢复 */
  setTimeout(function () {
    btn.classList.remove('copied');
    if (iconEl && originalIcon) {
      iconEl.className = originalIcon;
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
