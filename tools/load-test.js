// 擴充功能載入測試：確認 manifest 有效、service worker 能啟動、storage 能讀寫。
// 用法：node tools/load-test.js   （需要 Node + playwright 與 Chromium）
// 注意：載入擴充功能必須用 new headless 模式（headless:false + --headless=new），
//       舊的 headless:true 不會啟動擴充功能的 service worker。
const path = require('path');
const os = require('os');
const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const ext = path.resolve(__dirname, '..');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'gwt-prof-'));
  const ctx = await chromium.launchPersistentContext(profile, {
    headless: false,
    args: ['--headless=new', `--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
  });
  let [sw] = ctx.serviceWorkers();
  if (!sw) sw = await ctx.waitForEvent('serviceworker', { timeout: 10000 });
  console.log('service worker loaded:', sw.url().endsWith('background.js'));
  const r = await sw.evaluate(async () => {
    await chrome.storage.local.set({ gmailDark: false });
    return (await chrome.storage.local.get('gmailDark')).gmailDark;
  });
  console.log('storage toggle ok:', r === false);
  await ctx.close();
  fs.rmSync(profile, { recursive: true, force: true });
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
