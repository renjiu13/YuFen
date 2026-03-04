/**
 * 白灰风格代码块 - 折叠与复制功能
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
    
    // 优先查找 highlight 内的 code，否则找直接的 code
    let codeEl = container.querySelector('.highlight code') || container.querySelector('code');
    if (!codeEl) return;
    
    const text = codeEl.innerText || codeEl.textContent;
    
    navigator.clipboard.writeText(text).then(function() {
        const original = btn.textContent;
        btn.textContent = '已复制';
        
        setTimeout(function() {
            btn.textContent = original;
        }, 1500);
    }).catch(function(err) {
        console.error('复制失败:', err);
        // 降级方案
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            document.execCommand('copy');
            btn.textContent = '已复制';
            setTimeout(function() {
                btn.textContent = '复制';
            }, 1500);
        } catch (e) {
            btn.textContent = '复制失败';
            setTimeout(function() {
                btn.textContent = '复制';
            }, 1500);
        }
        
        document.body.removeChild(textarea);
    });
};

// 自动初始化（DOMContentLoaded 时绑定事件）
document.addEventListener('DOMContentLoaded', function() {
    // 为所有头部添加点击事件（如果 HTML 中已用 onclick 可省略）
    document.querySelectorAll('.code-block-header').forEach(function(header) {
        header.addEventListener('click', function(e) {
            // 如果点击的是复制按钮，不触发折叠
            if (e.target.closest('.copy-button')) return;
            window.toggleCodeBlock(this);
        });
    });
});