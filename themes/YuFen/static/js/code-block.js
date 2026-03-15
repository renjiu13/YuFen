/* Copy functionality */
window.copyCode = function(e, btn) {
    e.stopPropagation();

    const container = btn.closest('.code-block-container');
    if (!container) return;

    const codeEl = container.querySelector('code');
    if (!codeEl) return;

    const text = codeEl.innerText || codeEl.textContent;

    navigator.clipboard.writeText(text).then(function() {
        btn.classList.add('copied');
        const original = btn.textContent;
        btn.textContent = 'Copied';

        setTimeout(function() {
            btn.textContent = original;
            btn.classList.remove('copied');
        }, 1200);
    }).catch(function() {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.cssText = 'position:fixed;opacity:0;';
        document.body.appendChild(textarea);
        textarea.select();

        try {
            document.execCommand('copy');
            btn.classList.add('copied');
            btn.textContent = 'Copied';
            setTimeout(function() {
                btn.textContent = 'Copy';
                btn.classList.remove('copied');
            }, 1200);
        } catch (err) {
            btn.textContent = 'Failed';
            setTimeout(function() {
                btn.textContent = 'Copy';
            }, 1200);
        }

        document.body.removeChild(textarea);
    });
};

/* Bind copy buttons on DOM load */
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.copy-button').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            window.copyCode(e, this);
        });
    });
});