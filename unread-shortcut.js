// Chat 側欄「捷徑」加上「未讀」：切到首頁並開啟首頁的「未讀取」篩選。
// Google 會在切換畫面後保留篩選狀態，因此點「首頁」時改為關閉篩選，讓兩個捷徑各自代表全部與未讀。
(function () {
  const ITEM_ID = 'gwt-unread-shortcut';
  const ACTIVE_ATTR = 'data-gwt-unread';
  const CONTAINER = '[data-shortcut-container-id]';
  const HOME = '[data-shortcut-type="1"]';
  const FILTER_SWITCH = 'button[role=switch][aria-label="未讀取"]';
  const SELECTED = 'Qb1ood';
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const isOn = (sw) => sw.getAttribute('aria-checked') === 'true';

  function waitFor(selector, timeout = 5000) {
    const deadline = Date.now() + timeout;
    return new Promise((resolve) => {
      (function poll() {
        const el = document.querySelector(selector);
        if (el || Date.now() > deadline) resolve(el);
        else setTimeout(poll, 100);
      })();
    });
  }

  // 較晚的請求取代較早的；延到下一個 tick 才找開關，避免在觸發換頁的同一個 click 中搶在 Google 之前操作
  let request = 0;
  async function setUnreadFilter(on) {
    const id = ++request;
    await new Promise((r) => setTimeout(r));
    const sw = await waitFor(FILTER_SWITCH);
    if (id === request && sw && isOn(sw) !== on) sw.click();
  }

  function openUnread() {
    if (!document.querySelector(FILTER_SWITCH)) document.querySelector(HOME)?.click();
    setUnreadFilter(true);
  }

  function svg(tag, attrs, children = []) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    el.append(...children);
    return el;
  }

  function div(className, children) {
    const el = document.createElement('div');
    el.className = className;
    el.append(...children);
    return el;
  }

  function createItem() {
    const icon = svg('svg', {
      viewBox: '0 0 24 24', width: 20, height: 20, fill: 'none', stroke: 'currentColor',
      'stroke-width': 2, 'stroke-linejoin': 'round', focusable: 'false', 'aria-hidden': 'true',
    }, [
      svg('path', { d: 'M13 4H5a1 1 0 0 0-1 1v14.5L7.5 16H19a1 1 0 0 0 1-1v-4' }),
      svg('circle', { cx: 19, cy: 5, r: 3, fill: 'currentColor', stroke: 'none' }),
    ]);
    const item = div('fqMOM', [div('nozSKe', [icon]), div('Mywrue', ['未讀'])]);
    item.id = ITEM_ID;
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', '「未讀」捷徑');
    item.addEventListener('click', openUnread);
    item.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      openUnread();
    });
    return item;
  }

  // Google 把捷徑區塊外層的 height / max-height 固定成原本項目數的高度，收合時 max-height 設為 0、
  // 展開時再設回原值；多了一項就要改成實際高度，並在每次展開後重新調整
  const sectionObserver = new MutationObserver(() => scheduleRender());
  let observedSection = null;
  function fitSection(container) {
    const section = container.parentElement;
    if (section !== observedSection) {
      observedSection = section;
      sectionObserver.disconnect();
      sectionObserver.observe(section, { attributes: true, attributeFilter: ['style'] });
    }
    const { style } = section;
    if (!style.height || !container.offsetHeight) return;
    const full = `${container.offsetHeight}px`;
    if (style.height !== full) style.height = full;
    if (style.maxHeight && style.maxHeight !== '0px' && style.maxHeight !== full) style.maxHeight = full;
  }

  function render() {
    const container = document.querySelector(CONTAINER);
    const home = container?.querySelector(HOME);
    if (!home) return;
    const item = document.getElementById(ITEM_ID) || createItem();
    if (home.nextElementSibling !== item) home.after(item);
    fitSection(container);
    const sw = document.querySelector(FILTER_SWITCH);
    const active = !!sw && isOn(sw);
    document.documentElement.toggleAttribute(ACTIVE_ATTR, active);
    item.classList.toggle(SELECTED, active);
  }

  let scheduled = false;
  function scheduleRender() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; render(); });
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest?.(HOME)) setUnreadFilter(false);
  }, true);

  render();
  new MutationObserver(scheduleRender).observe(document.documentElement, {
    childList: true, subtree: true, attributes: true, attributeFilter: ['aria-checked'],
  });
})();
