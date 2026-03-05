// 极简代码块复制功能
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.copy-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            const block = this.closest('.code-block');
            const code = block.querySelector('code');
            
            if (!code) return;
            
            const text = code.innerText || code.textContent;
            
            navigator.clipboard.writeText(text).then(() => {
                const original = this.textContent;
                this.textContent = '已复制';
                this.classList.add('copied');
                
                setTimeout(() => {
                    this.textContent = original;
                    this.classList.remove('copied');
                }, 1200);
            }).catch(() => {
                // 降级方案
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.cssText = 'position:fixed;opacity:0;';
                document.body.appendChild(textarea);
                textarea.select();
                
                try {
                    document.execCommand('copy');
                    this.textContent = '已复制';
                    this.classList.add('copied');
                    setTimeout(() => {
                        this.textContent = '复制';
                        this.classList.remove('copied');
                    }, 1200);
                } catch (e) {
                    this.textContent = '失败';
                    setTimeout(() => this.textContent = '复制', 1200);
                }
                
                document.body.removeChild(textarea);
            });
        });
    });
});