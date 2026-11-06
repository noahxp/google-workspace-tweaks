// 依照設定切換 Gmail 信件 dark / light；所有 Gmail 分頁與彈出視窗會同步
const KEY = 'gmailDark';

function apply(dark) {
  if (dark) document.documentElement.removeAttribute('data-gwt-light');
  else document.documentElement.setAttribute('data-gwt-light', '');
}

chrome.storage.local.get({ [KEY]: true }, (r) => apply(r[KEY]));
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && KEY in changes) apply(changes[KEY].newValue);
});
