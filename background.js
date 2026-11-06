// 點擴充功能圖示（或在 chrome://extensions/shortcuts 自訂的快捷鍵）切換 Gmail 信件 dark / light
const KEY = 'gmailDark';

async function isDark() {
  const r = await chrome.storage.local.get({ [KEY]: true });
  return r[KEY];
}

function updateBadge(dark) {
  chrome.action.setBadgeText({ text: dark ? '' : 'OFF' });
  chrome.action.setBadgeBackgroundColor({ color: '#888' });
}

chrome.action.onClicked.addListener(async () => {
  const dark = !(await isDark());
  await chrome.storage.local.set({ [KEY]: dark });
  updateBadge(dark);
});

chrome.runtime.onStartup.addListener(async () => updateBadge(await isDark()));
chrome.runtime.onInstalled.addListener(async () => updateBadge(await isDark()));
