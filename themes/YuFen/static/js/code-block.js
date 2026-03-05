/**
 * 代码块 - 折叠与复制功能（适配黑白灰主题）
 */

// 切换代码块折叠状态
window.toggleCodeBlock = function(header) {
    const content = header.nextElementSibling;
    const chevron = header.querySelector('.chevron-icon');
    if (content && chevron) {
        content.classList.toggle('collapsed');
        chevron.classList.toggle('collapsed');
    }
};

// 复制代码
window.copyCode = function(e, btn) {
    e.stopPropagation();

    const container = btn.closest('.code-block-container');
    if (!container) return;

    const codeEl = container.querySelector('.highlight code') || container.querySelector('code');
    if (!codeEl) return;

    const text = codeEl.innerText || codeEl.textContent;

    navigator.clipboard.writeText(text).then(function() {
        const original = btn.textContent;
        btn.textContent = '已复制';

        setTimeout(function() {
            btn.textContent = original;
        }, 1200);
    }).catch(function() {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.cssText = 'position:fixed;opacity:0;';
        document.body.appendChild(textarea);
        textarea.select();

        try {
            document.execCommand('copy');
            btn.textContent = '已复制';
            setTimeout(function() {
                btn.textContent = '复制';
            }, 1200);
        } catch (err) {
            btn.textContent = '失败';
            setTimeout(function() {
                btn.textContent = '复制';
            }, 1200);
        }

        document.body.removeChild(textarea);
    });
};

// DOM 加载后绑定头部点击折叠
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.code-block-header').forEach(function(header) {
        header.addEventListener('click', function(e) {
            if (e.target.closest('.copy-button')) return;
            window.toggleCodeBlock(this);
        });
    });
});
