/* ======================================
 * YuFen 主题 - 代码块交互脚本
 * 功能：复制代码、复制成功动画
 * ====================================== */

/* Copy functionality */
window.copyCode = function(e, btn) {
    e.stopPropagation();
    const container = btn.closest('.code-block-container');
    if (!container) return;
    
    // 获取代码元素
    const codeEl = container.querySelector('.code-content-wrapper code') || container.querySelector('code');
    if (!codeEl) return;
    
    // 获取纯文本代码
    const text = codeEl.innerText || codeEl.textContent;
    
    // 复制到剪贴板
    navigator.clipboard.writeText(text).then(function() {
        showCopySuccess(btn);
    }).catch(function() {
        // 降级方案：使用 textarea
        const textarea = document.createElement('textarea');
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
    const iconEl = btn.querySelector('i');
    const textEl = btn.querySelector('span');
    const originalText = textEl ? textEl.textContent : btn.textContent;
    const originalIcon = iconEl ? iconEl.className : '';
    
    // 更新图标和文字
    if (iconEl) {
        iconEl.className = 'fa-solid fa-check';
    }
    if (textEl) {
        textEl.textContent = '已复制';
    } else {
        btn.textContent = '已复制';
    }
    
    // 1.5秒后恢复
    setTimeout(function() {
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
    const textEl = btn.querySelector('span');
    const originalText = textEl ? textEl.textContent : btn.textContent;
    
    if (textEl) {
        textEl.textContent = '失败';
    } else {
        btn.textContent = '失败';
    }
    
    setTimeout(function() {
        if (textEl) {
            textEl.textContent = originalText;
        } else {
            btn.textContent = originalText;
        }
    }, 1500);
}

/* Bind copy buttons on DOM load */
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.copy-button').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            window.copyCode(e, this);
        });
    });
});
