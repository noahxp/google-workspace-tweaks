// 從右上角 Google 帳戶按鈕取得自己的頭像與名字，存成 CSS 變數給 slackify.css 使用
(function () {
  function apply() {
    const img = document.querySelector('img.gbii');
    if (!img || !img.src) return false;
    const root = document.documentElement.style;
    root.setProperty('--sk-me-avatar', `url("${img.src}")`);
    const label = (img.closest('a') || {}).getAttribute?.('aria-label') || '';
    const name = (label.split(/[：:]/)[1] || '').split('\n')[0].trim();
    if (name) root.setProperty('--sk-me-name', JSON.stringify(name));
    return true;
  }
  if (apply()) return;
  const obs = new MutationObserver(() => { if (apply()) obs.disconnect(); });
  obs.observe(document.documentElement, { childList: true, subtree: true });
})();
