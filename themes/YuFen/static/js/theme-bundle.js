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


/* ========== image-lightbox.js ========== */

/* ============================================
 * YuFen 主题 - 图片灯箱预览
 * 作用：点击文章图片全屏预览，支持缩放
 * 功能：
 *   1. 点击图片打开黑色背景预览
 *   2. 单击背景 / ESC / 空格 关闭（单击图片不关闭，避免与双击冲突）
 *   3. 双击图片切换缩放（以光标位置为中心）
 *   4. 鼠标滚轮控制缩放（以光标位置为中心定位）
 *   5. 缩放后可拖拽移动图片
 * ============================================ */

(function () {
  var lightbox = null;
  var lightboxImg = null;
  var scale = 1;
  var translateX = 0;
  var translateY = 0;
  var minScale = 0.1;
  var maxScale = 10;
  var isOpen = false;
  var clickTimer = null;
  var clickDelay = 250;

  /* 拖拽状态 */
  var isDragging = false;
  var dragStartX = 0;
  var dragStartY = 0;
  var dragStartTX = 0;
  var dragStartTY = 0;

  /* 创建灯箱 DOM */
  function createLightbox() {
    lightbox = document.createElement('div');
    lightbox.id = 'image-lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-label', '图片预览');
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.innerHTML = '<img class="lightbox-image" alt=""><div class="lightbox-caption"></div>';
    document.body.appendChild(lightbox);
    lightboxImg = lightbox.querySelector('.lightbox-image');

    /* 单击背景关闭，单击图片不关闭（给双击留机会） */
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightboxImg) return;
      closeLightbox();
    });

    /* 图片单击：延迟判断，若期间有双击则不关闭 */
    lightboxImg.addEventListener('click', function (e) {
      e.stopPropagation();
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
        return;
      }
      clickTimer = setTimeout(function () {
        clickTimer = null;
        /* 单击图片不关闭，什么也不做 */
      }, clickDelay);
    });

    /* 双击图片：以光标位置为中心切换缩放 */
    lightboxImg.addEventListener('dblclick', function (e) {
      e.stopPropagation();
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
      }
      toggleZoom(e);
    });

    /* 滚轮缩放：以光标位置为中心 */
    lightbox.addEventListener('wheel', function (e) {
      e.preventDefault();
      e.stopPropagation();
      handleWheel(e);
    }, { passive: false });

    /* 拖拽移动图片 */
    lightboxImg.addEventListener('mousedown', function (e) {
      if (scale <= 1) return;
      e.preventDefault();
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragStartTX = translateX;
      dragStartTY = translateY;
      lightboxImg.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', function (e) {
      if (!isDragging) return;
      var dx = e.clientX - dragStartX;
      var dy = e.clientY - dragStartY;
      translateX = dragStartTX + dx;
      translateY = dragStartTY + dy;
      applyTransform();
    });

    document.addEventListener('mouseup', function () {
      if (!isDragging) return;
      isDragging = false;
      lightboxImg.style.cursor = scale > 1 ? 'grab' : 'zoom-in';
    });

    /* 阻止图片本身的默认拖拽 */
    lightboxImg.addEventListener('dragstart', function (e) {
      e.preventDefault();
    });
  }

  /* 获取视口中心 */
  function getViewportCenter() {
    if (!lightbox) return { x: 0, y: 0 };
    var rect = lightbox.getBoundingClientRect();
    return { x: rect.width / 2, y: rect.height / 2 };
  }

  /* 打开灯箱 */
  function openLightbox(src, alt) {
    if (!lightbox) createLightbox();

    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    scale = 1;
    translateX = 0;
    translateY = 0;
    applyTransform();

    lightbox.classList.add('show');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    isOpen = true;
  }

  /* 关闭灯箱 */
  function closeLightbox() {
    if (!isOpen || !lightbox) return;
    lightbox.classList.remove('show');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    isOpen = false;
    scale = 1;
    translateX = 0;
    translateY = 0;
    isDragging = false;
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
    }
  }

  /* 应用缩放 + 平移变换 */
  function applyTransform() {
    if (!lightboxImg) return;
    lightboxImg.style.transform =
      'translate(' + translateX + 'px, ' + translateY + 'px) scale(' + scale + ')';
  }

  /* 以指定点为中心进行缩放（点坐标相对于 lightbox） */
  function zoomAt(newScale, pointX, pointY) {
    if (newScale < minScale) newScale = minScale;
    if (newScale > maxScale) newScale = maxScale;
    if (newScale === scale) return;

    var center = getViewportCenter();

    /* 鼠标相对图片中心的偏移（图片坐标系，缩放前） */
    var relX = (pointX - center.x - translateX) / scale;
    var relY = (pointY - center.y - translateY) / scale;

    /* 计算新的平移量，使鼠标指向的点保持不动 */
    translateX = pointX - center.x - relX * newScale;
    translateY = pointY - center.y - relY * newScale;

    /* 如果缩回到 1，复位平移 */
    if (newScale <= 1) {
      translateX = 0;
      translateY = 0;
      newScale = 1;
    }

    scale = newScale;
    applyTransform();

    /* 更新光标样式 */
    if (lightboxImg) {
      lightboxImg.style.cursor = scale > 1 ? 'grab' : 'zoom-in';
    }
  }

  /* 双击切换缩放（以光标位置为中心） */
  function toggleZoom(e) {
    var rect = lightbox.getBoundingClientRect();
    var px = e.clientX - rect.left;
    var py = e.clientY - rect.top;
    var newScale = scale > 1 ? 1 : 2.5;
    zoomAt(newScale, px, py);
  }

  /* 滚轮缩放：以光标位置为中心 */
  function handleWheel(e) {
    var rect = lightbox.getBoundingClientRect();
    var px = e.clientX - rect.left;
    var py = e.clientY - rect.top;
    var delta = e.deltaY > 0 ? -0.15 : 0.15;
    var newScale = scale * (1 + delta);
    zoomAt(newScale, px, py);
  }

  /* 键盘事件 */
  function handleKeydown(e) {
    if (!isOpen) return;
    if (e.key === 'Escape' || e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      closeLightbox();
    }
  }

  /* 绑定文章内所有图片 */
  function bindImages() {
    var article = document.querySelector('.prose');
    if (!article) return;

    var images = article.querySelectorAll('img');
    images.forEach(function (img) {
      if (img.dataset.lightboxBound) return;
      img.dataset.lightboxBound = 'true';
      img.style.cursor = 'zoom-in';

      img.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var src = img.getAttribute('src') || img.src;
        var alt = img.getAttribute('alt') || '';
        openLightbox(src, alt);
      });
    });
  }

  /* DOM 加载完成后初始化 */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      bindImages();
      document.addEventListener('keydown', handleKeydown);
    });
  } else {
    bindImages();
    document.addEventListener('keydown', handleKeydown);
  }
})();


/* ========== toc-aside.js ========== */

/* ============================================
 * YuFen 主题 - 右侧标题导航器
 * 作用：文章页右侧显示标题位置标记
 * 功能：
 *   1. 折叠态：只显示灰色短横线，激活节点为红色
 *   2. 展开态：白色背景+圆角+阴影，显示标题文字
 *   3. 鼠标悬停展开，移开折叠
 *   4. 闲置 1.5s 自动折叠
 *   5. 滚动时保持折叠，停止后延迟展开
 *   6. 点击跳转（不修改 URL）
 * ============================================ */

(function () {
  var tocNav = null;
  var headings = [];
  var tocItems = [];
  var activeIndex = -1;
  var isScrolling = false;
  var scrollStopTimer = null;
  var idleTimer = null;
  var idleDelay = 1500;
  var scrollExpandDelay = 600;

  function initTOC() {
    var article = document.querySelector('.prose');
    if (!article) return;

    headings = article.querySelectorAll('h2, h3');
    if (headings.length < 2) return;

    tocNav = document.createElement('nav');
    tocNav.id = 'toc-aside';
    tocNav.setAttribute('aria-label', '文章目录');

    var track = document.createElement('div');
    track.className = 'toc-track';

    headings.forEach(function (h, i) {
      var item = document.createElement('a');
      item.className = 'toc-item' + (h.tagName === 'H3' ? ' toc-sub' : '');
      item.setAttribute('data-index', i);
      item.setAttribute('href', 'javascript:void(0)');

      var bar = document.createElement('span');
      bar.className = 'toc-bar';

      var label = document.createElement('span');
      label.className = 'toc-label';
      label.textContent = h.textContent;

      item.appendChild(bar);
      item.appendChild(label);
      track.appendChild(item);
    });

    tocNav.appendChild(track);
    document.body.appendChild(tocNav);

    tocItems = tocNav.querySelectorAll('.toc-item');

    tocItems.forEach(function (item, i) {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        headings[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    /* 鼠标进入展开 */
    tocNav.addEventListener('mouseenter', function () {
      expand();
      resetIdle();
    });

    /* 鼠标离开折叠 */
    tocNav.addEventListener('mouseleave', function () {
      collapse();
    });

    /* 鼠标移动重置闲置计时器 */
    tocNav.addEventListener('mousemove', resetIdle);

    /* 滚动：保持折叠 + 更新激活 + 停止后延迟展开 */
    var scrollHandler = throttle(function () {
      if (!isScrolling) {
        isScrolling = true;
        collapse();
      }
      updateActive();

      clearTimeout(scrollStopTimer);
      scrollStopTimer = setTimeout(function () {
        isScrolling = false;
      }, scrollExpandDelay);
    }, 60);

    window.addEventListener('scroll', scrollHandler, { passive: true });

    updateActive();
  }

  function expand() {
    if (tocNav) tocNav.classList.add('expanded');
  }

  function collapse() {
    if (tocNav) tocNav.classList.remove('expanded');
    clearTimeout(idleTimer);
  }

  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () {
      collapse();
    }, idleDelay);
  }

  function updateActive() {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var winH = window.innerHeight;
    var threshold = scrollTop + winH * 0.3;

    var newIndex = -1;
    for (var i = 0; i < headings.length; i++) {
      var rect = headings[i].getBoundingClientRect();
      var top = rect.top + scrollTop;
      if (top <= threshold) {
        newIndex = i;
      } else {
        break;
      }
    }

    if (newIndex === activeIndex) return;
    activeIndex = newIndex;

    tocItems.forEach(function (item, i) {
      if (i === newIndex) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  function throttle(fn, wait) {
    var last = 0;
    return function () {
      var now = Date.now();
      if (now - last >= wait) {
        last = now;
        fn.apply(null, arguments);
      }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTOC);
  } else {
    initTOC();
  }
})();
