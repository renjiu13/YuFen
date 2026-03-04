/**
 * 豆包风格代码块 - 复制按钮逻辑
 * 使用事件委托，仅在有代码块时生效，便于按需加载
 */
(function () {
  function handleCopy(e) {
    const btn = e.target.closest('.copy-btn');
    if (!btn) return;
    const container = btn.closest('.code-block-container');
    const codeEl = container?.querySelector('.code-content code');
    if (!codeEl) return;
    const text = codeEl.textContent;
    navigator.clipboard.writeText(text).then(function () {
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check"></i> 已复制';
      btn.classList.add('copy-success');
      setTimeout(function () {
        btn.innerHTML = orig;
        btn.classList.remove('copy-success');
      }, 1500);
    });
  }
  document.addEventListener('click', handleCopy);
})();
