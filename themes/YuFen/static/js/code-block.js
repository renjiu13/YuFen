/* ============================================
 * YuFen 主题 - 代码块交互脚本
 * 作用：代码复制功能
 * 功能：
 *   1. 复制代码到剪贴板 (Clipboard API + textarea 降级方案)
 *   2. 复制成功/失败状态反馈动画
 *   3. DOM 加载后自动绑定所有复制按钮
 * ============================================ */

/* 复制代码到剪贴板 */
window.copyCode = function (e, btn) {
  e.stopPropagation();
  var container = btn.closest('.code-block-container');
  if (!container) return;

  /* 获取代码元素 */
  var codeEl = container.querySelector('.code-content-wrapper code') || container.querySelector('code');
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

/* DOM 加载后绑定所有复制按钮 */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.copy-button').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      window.copyCode(e, this);
    });
  });
});
