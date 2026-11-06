// 「未讀」捷徑行為測試：以模擬 Google Chat 側欄與首頁的 fixture 頁面驗證 unread-shortcut.js。
// 用法：node --test tools/unread-shortcut.test.js   （需要 Node + playwright 與本機 Google Chrome）
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { chromium } = require('playwright');

const SCRIPT = path.resolve(__dirname, '..', 'unread-shortcut.js');

// 模擬 Google Chat：點捷徑後非同步切換畫面；首頁才有「未讀取」開關，開關狀態跨畫面保留；
// 捷徑區塊外層以 inline height / max-height 固定成原本 3 項的高度，收合時 max-height 設為 0
const FIXTURE = `<!doctype html><html><head><style>.fqMOM { height: 28px; }</style></head><body>
<div id="sidebar"></div><div id="main"></div>
<script>
  window.chat = { view: 'mentions', unread: false };
  const VIEWS = { 1: 'home', 2: 'mentions', 3: 'starred' };
  function renderSidebar() {
    document.getElementById('sidebar').innerHTML =
      '<div id="section" style="height: 84px; max-height: 84px; overflow: hidden">' +
      '<div data-shortcut-container-id="WkVP0e">' +
      '<div class="fqMOM" data-shortcut-type="1" tabindex="0"><div class="Mywrue">首頁</div></div>' +
      '<div class="fqMOM" data-shortcut-type="2" tabindex="-1"><div class="Mywrue">提及</div></div>' +
      '<div class="fqMOM" data-shortcut-type="3" tabindex="-1"><div class="Mywrue">已加星號</div></div>' +
      '</div></div>';
    markSelected();
  }
  function markSelected() {
    for (const el of document.querySelectorAll('[data-shortcut-type]')) {
      el.classList.toggle('Qb1ood', VIEWS[el.dataset.shortcutType] === chat.view);
    }
  }
  function renderMain() {
    document.getElementById('main').innerHTML = chat.view === 'home'
      ? '<button type="button" role="switch" aria-label="未讀取" aria-checked="' + chat.unread + '"></button>'
      : '<p>' + chat.view + '</p>';
    markSelected();
  }
  document.addEventListener('click', (e) => {
    const shortcut = e.target.closest('[data-shortcut-type]');
    if (shortcut) setTimeout(() => { chat.view = VIEWS[shortcut.dataset.shortcutType]; renderMain(); }, 50);
    const sw = e.target.closest('[role=switch]');
    if (sw) { chat.unread = !chat.unread; sw.setAttribute('aria-checked', String(chat.unread)); }
  });
</script></body></html>`;

let browser;
before(async () => { browser = await chromium.launch({ channel: 'chrome' }); });
after(async () => { await browser.close(); });

async function openChat({ view, unread }) {
  const page = await browser.newPage();
  await page.setContent(FIXTURE);
  await page.evaluate(([v, u]) => { chat.view = v; chat.unread = u; renderSidebar(); renderMain(); }, [view, unread]);
  await page.addScriptTag({ path: SCRIPT });
  return page;
}

const unreadShortcut = (page) => page.getByRole('button', { name: '「未讀」捷徑' });

const shortcutLabels = (page) =>
  page.$$eval('[data-shortcut-container-id] > *', (els) => els.map((el) => el.textContent.trim()));

const waitForChat = (page, view, unread) =>
  page.waitForFunction(([v, u]) => chat.view === v && chat.unread === u
    && document.querySelector('[role=switch]')?.getAttribute('aria-checked') === String(u), [view, unread]);

test('在「首頁」正下方插入「未讀」捷徑', async () => {
  const page = await openChat({ view: 'mentions', unread: false });

  const labels = await shortcutLabels(page);

  assert.deepEqual(labels, ['首頁', '未讀', '提及', '已加星號']);
  await page.close();
});

test('側欄重新渲染後補回「未讀」捷徑且不重複', async () => {
  const page = await openChat({ view: 'mentions', unread: false });

  await page.evaluate(() => renderSidebar());
  await page.waitForFunction(() => document.querySelectorAll('[data-shortcut-container-id] > *').length === 4);

  assert.deepEqual(await shortcutLabels(page), ['首頁', '未讀', '提及', '已加星號']);
  await page.close();
});

const sectionHeights = (page) => page.$eval('#section', (el) => ({
  height: el.style.height, maxHeight: el.style.maxHeight, visible: el.getBoundingClientRect().height,
}));

const waitForMaxHeight = (page, value) =>
  page.waitForFunction((v) => document.getElementById('section').style.maxHeight === v, value);

test('捷徑區塊高度擴大到能完整顯示四個捷徑', async () => {
  const page = await openChat({ view: 'mentions', unread: false });

  await waitForMaxHeight(page, '112px');

  assert.deepEqual(await sectionHeights(page), { height: '112px', maxHeight: '112px', visible: 112 });
  await page.close();
});

test('收合捷徑區塊時維持收合，再展開時恢復完整高度', async () => {
  const page = await openChat({ view: 'mentions', unread: false });
  await waitForMaxHeight(page, '112px');

  await page.evaluate(() => { document.getElementById('section').style.maxHeight = '0px'; });
  await page.evaluate(() => new Promise(requestAnimationFrame));
  const collapsed = await sectionHeights(page);
  await page.evaluate(() => { document.getElementById('section').style.maxHeight = '84px'; });
  await waitForMaxHeight(page, '112px');

  assert.equal(collapsed.maxHeight, '0px');
  assert.equal(collapsed.visible, 0);
  await page.close();
});

test('捷徑內容暫時隱藏時不改動區塊高度', async () => {
  const page = await openChat({ view: 'mentions', unread: false });
  await waitForMaxHeight(page, '112px');

  await page.evaluate(() => {
    document.querySelector('[data-shortcut-container-id]').style.display = 'none';
    document.getElementById('section').style.maxHeight = '84px';
  });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

  const { height, maxHeight } = await sectionHeights(page);
  assert.deepEqual({ height, maxHeight }, { height: '112px', maxHeight: '84px' });
  await page.close();
});

test('在其他畫面點「未讀」會切到首頁並開啟未讀取篩選', async () => {
  const page = await openChat({ view: 'mentions', unread: false });

  await unreadShortcut(page).click();

  await waitForChat(page, 'home', true);
  await page.close();
});

test('已在首頁時點「未讀」會開啟未讀取篩選', async () => {
  const page = await openChat({ view: 'home', unread: false });

  await unreadShortcut(page).click();

  await waitForChat(page, 'home', true);
  await page.close();
});

test('未讀取篩選開啟時點「首頁」會關閉篩選', async () => {
  const page = await openChat({ view: 'home', unread: true });

  await page.locator('[data-shortcut-type="1"]').click();

  await waitForChat(page, 'home', false);
  await page.close();
});

test('從其他畫面點「首頁」會關閉先前保留的篩選', async () => {
  const page = await openChat({ view: 'mentions', unread: true });

  await page.locator('[data-shortcut-type="1"]').click();

  await waitForChat(page, 'home', false);
  await page.close();
});

test('以鍵盤 Enter 觸發「未讀」捷徑', async () => {
  const page = await openChat({ view: 'mentions', unread: false });

  await unreadShortcut(page).press('Enter');

  await waitForChat(page, 'home', true);
  await page.close();
});

test('只在首頁開啟未讀取篩選時把「未讀」標為選取', async () => {
  const page = await openChat({ view: 'home', unread: false });
  const selectedState = () => page.evaluate(() => ({
    item: document.querySelector('[aria-label="「未讀」捷徑"]').classList.contains('Qb1ood'),
    root: document.documentElement.hasAttribute('data-gwt-unread'),
  }));
  const waitForSelected = (on) => page.waitForFunction((v) =>
    document.documentElement.hasAttribute('data-gwt-unread') === v, on);

  const initial = await selectedState();
  await page.locator('[role=switch]').click();
  await waitForSelected(true);
  const filtered = await selectedState();
  await page.locator('[data-shortcut-type="2"]').click();
  await waitForSelected(false);
  const elsewhere = await selectedState();

  assert.deepEqual(initial, { item: false, root: false });
  assert.deepEqual(filtered, { item: true, root: true });
  assert.deepEqual(elsewhere, { item: false, root: false });
  await page.close();
});
