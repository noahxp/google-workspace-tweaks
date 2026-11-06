# Google Workspace Tweaks: Maintenance Guide

A handover document for whoever maintains this extension next (a person, or a new Claude conversation).
**When you start a new conversation, give Claude this document and the whole folder first, then describe what you want to change.**

---

## 1. What this is

A Chrome extension (Manifest V3) for Chromium-based browsers. Features:

| Site | Feature |
|---|---|
| `chat.google.com` | Turns Google Chat into a **Slack-style** theme (dark mode): aubergine sidebar, bubble-free messages all left-aligned, avatar and name on your own messages, date separator lines, hover menu at the far right of the message row |
| `mail.google.com` | Gmail **message content dark mode** (split reading pane plus the "Open in new window" pop-out), with one-click switch back to light |

- UI language is Traditional Chinese. Gmail and Chat aria-labels are in Chinese too, for example `新增回應` ("Add reaction") and `Google 帳戶：` ("Google Account:"). Selectors and scripts match these Chinese strings.
- The user's Gmail and Chat are set to the **dark theme**. This extension is tuned for the dark theme.
- Versioning starts at `0.1.0` (chosen by the user) and only goes up.

## 2. File structure

```
google-workspace-tweaks/
├─ manifest.json      MV3 config; content_scripts split into a Chat group and a Gmail group
├─ slackify.css       Slack-style styles for Chat (all visual changes live here)
├─ content.js         Chat: reads your avatar and name from the account button (top right) → sets CSS variables
├─ gmail.css          Gmail message content dark mode (invert filter)
├─ gmail.js           Gmail: toggles <html data-gwt-light> based on the stored setting
├─ background.js      Clicking the extension icon → toggles dark/light and shows the OFF badge
├─ tools/load-test.js Load test script (not used by the extension itself)
├─ README.md          User-facing install and usage guide
└─ MAINTAINING.md     This document
```

The only permission is `storage`. There are no host_permissions (the content_scripts `matches` are enough).

## 3. How each feature works

### 3.1 Chat: Slack style (slackify.css + content.js)

**Color variables** are defined on `:root` in `slackify.css` (`--sk-top`, `--sk-side`, `--sk-sel`, `--sk-main`, `--sk-hover`, `--sk-text`, `--sk-border`). To change the palette, edit only these.

**Your own avatar and name**: Google Chat does not render an avatar on your own messages (they were right-aligned bubbles). The approach:
1. `content.js` finds `img.gbii` (the account avatar at the top right of the Google bar) and sets its `src` as `--sk-me-avatar`. It takes the name from the `aria-label` of the enclosing `<a>` (format: `Google 帳戶： Name \n email`) and sets it as `--sk-me-name` (JSON-stringified so it can be used in CSS `content:`).
2. CSS draws a 32px avatar with `.AflJR::before` and shows the name with `.NGoCob::before`.
3. If the page has not finished loading, a MutationObserver waits for `img.gbii` to appear.

**Moving the hover menu to the far right**: the menu container `.UgwGlb` is `position:absolute` and was originally positioned relative to the bubble `.EAOoq`. The fix sets `.EAOoq / .Hj5Fxb / .B8q9Gf` to `position:static` so the menu is positioned relative to the whole row `.iKCcE` instead, then applies `justify-content:flex-end`. The content layer is also stretched to fill the row (`flex:1; width:100%`), so hovering anywhere on the row triggers the menu (Google detects hover on the bubble). The bubble's own hover layer `.EAOoq::after` must be hidden, or it turns into a gray bar across the whole row.

**Date separators**: the date heading is `[role=heading].Ao1xUb`. A `::before` draws a full-width line, and the date itself (`.cK9mzf`) gets a background, border, and rounded corners so it sits on top of the line.

### 3.2 Gmail: message content dark mode (gmail.css + gmail.js + background.js)

**How it works**: the whole message area gets `filter: invert(1) hue-rotate(180deg) contrast(.8)`. Then `img / video / picture / canvas / iframe / [style*=background-image]` get the reverse filter `contrast(1.25) hue-rotate(180deg) invert(1)` to restore their original colors.
- Benefit: colors in HTML emails and every white-background component turn dark automatically, with no need to hunt down classes one by one.
- `contrast(.8)` turns white into roughly `#1a1a1a` instead of pure black, so text is easier on the eyes. Because `contrast(1.25)` in the reverse filter clips extreme values, **images come out slightly darker**. This is an accepted trade-off.
- Known limitation: colors in branded marketing emails may shift → hence the toggle.

**Toggle mechanism**:
- `gmailDark` in `chrome.storage.local` (default `true`).
- `background.js`: clicking the extension icon (`chrome.action.onClicked`) flips the value. In light mode the badge shows `OFF`.
- `gmail.js`: reads the value and listens to `storage.onChanged`. In light mode it adds `data-gwt-light` to `<html>`. All Gmail tabs and pop-out windows stay in sync.
- Every rule in `gmail.css` is prefixed with `html:not([data-gwt-light])`.
- Keyboard shortcut: the manifest has `commands._execute_action` but **deliberately has no `suggested_key`** (the user asked for no shortcut by default). Set one in `chrome://extensions/shortcuts` if needed.

## 4. Selector reference (the part that needs the most maintenance)

Google's class names are **obfuscated** and may break whenever Google updates its UI. Prefer stable attributes (`role`, `aria-*`, `data-*`) and fall back to classes only when there is no other option.

### Chat (`chat.google.com`)

| Selector | What it is | Stability |
|---|---|---|
| `[role=group][data-id]` | A single message | Stable |
| `.Pxe3Yd` (on the group) | **Your own** message | Obfuscated class |
| `.i3b7Zb` (on the group) | A **follow-up** message in a consecutive run (no avatar shown) | Obfuscated class |
| ~~`.VX5P7c`~~ | ~~First message~~ — **unreliable**; in some conversations the first message lacks this class. Deprecated | — |
| `.AflJR` | Message row (container for the avatar column and content column) | Obfuscated |
| `.F0wyae` | Content column (header + body) | Obfuscated |
| `.yMXUbf` / `.NGoCob` | Message header (name + time) | Obfuscated |
| `.iKCcE` | Full-row body container (new positioning anchor for the hover menu) | Obfuscated |
| `.B8q9Gf > .zlPNZe > .Hj5Fxb > .YJxKBc > .EAOoq` | Nested bubble containers; `.EAOoq` is the bubble itself (originally had a background and rounded corners) | Obfuscated |
| `.UgwGlb` | Hover menu outer container (absolute) | Obfuscated |
| `.GoAOqc` | Quote block | Obfuscated |
| `.SFMExc` | Reaction row | Obfuscated |
| `[role=heading].Ao1xUb` / `.cK9mzf` | Date separator heading / date text container | Obfuscated |
| `c-wiz.BCL84c` | Left sidebar | Obfuscated |
| `c-wiz.BCL84c [role=listitem].qs41qe` | Currently selected conversation in the sidebar | Obfuscated |
| `.CMcgue .WqdKAc .vIO7af .Bqp03e .bzJiD .Bl2pUd .knr7ee .XganBc .bNfiFb` | Background layers of the main area | Obfuscated |
| `.RWqrJc .jO3HBb` | Rounded corners of the main area | Obfuscated |
| `header.gb_Ta`, `.lYh0Nb`, `form[role=search]` | Top Google bar, page background, search box | Obfuscated / Stable |
| `img.gbii` | Account avatar at the top right (used by content.js) | Fairly stable |

### Gmail (`mail.google.com`)

| Selector | What it is |
|---|---|
| `.nH.ao9` | Scroll container of the main window's **split reading pane** (list on top, content below) |
| `.nH.aBz` | Message area of the "Open in new window" **pop-out** |
| `body:has(.nH.aBz) .G-atb` | Toolbar at the top of the pop-out (the main window also has `.G-atb`, so it must be scoped to the pop-out) |
| `body:has(.nH.aBz)` | Pop-out body (background of the side margins) |
| `.a3s` | Message body (not used yet, but a good starting point for exploring the structure) |

Not supported yet: Gmail "No split" mode, "Right of inbox" mode, and the compose window.

## 5. Maintenance workflow (finding selectors and previewing)

The user runs Claude in the Chrome side panel, and **Claude can operate the user's tabs directly** (Claude in Chrome tools). Suggested workflow:

1. **Take a screenshot** to see the current state.
2. **Explore the structure with JS**: find the DOM node from visible text, then walk up the ancestor chain listing class, role, and computed style (background, position, flex, and so on). Example:
   ```js
   function findText(t){const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(n.nodeValue.includes(t))return n.parentElement}}
   let el=findText('some message text'),o=[];
   while(el&&el!==document.body){const s=getComputedStyle(el),r=el.getBoundingClientRect();
     o.push([el.tagName,el.className.slice(0,40),el.getAttribute('role')||'',s.backgroundColor,s.position,Math.round(r.x)+','+Math.round(r.y)+' '+Math.round(r.width)+'x'+Math.round(r.height)].join(';'));
     el=el.parentElement}
   o.join('\n')
   ```
   - Elements that only appear on hover: `hover` with the `computer` tool first, then query something like `[aria-label="新增回應"]` ("Add reaction").
   - Elements at a specific position: `document.elementsFromPoint(x,y)` (screenshot coordinates and viewport coordinates may differ by a scale factor).
   - Pseudo-elements: `getComputedStyle(el,'::after')`.
3. **Live preview**: inject a `<style id="...-test">` with test CSS into the page, take a screenshot to check, and reload to revert. If the user has the extension installed, the test styles stack on top of the extension's styles.
4. Once confirmed, write the changes back to the `.css` file, **bump the version by 0.0.1**, rebuild the zip, and ask the user to reload the extension in `chrome://extensions`.

### Pitfalls

- **JS tool results that contain URL query strings or cookie-like content are blocked** (`[BLOCKED: Cookie/query string data]`). When returning `iframe.src` or `img.src`, return only `new URL(src).host` or `pathname`.
- **You cannot inspect a Gmail pop-out by opening its URL directly**: the pop-out page renders through `window.opener`, so opening it directly gives a blank page, and calling `window.open` from JS is blocked by the pop-up blocker. What works: in the main window, monkeypatch `window.open` to save the returned window reference, then use the `computer` tool to **actually click** the "Open in new window" (`在新視窗中開啟`) button (this provides a user gesture), and inspect it through `window.__pw.document` (same origin). Restore `window.open` afterwards. The pop-out is not in Claude's tab group, so **it cannot be screenshotted**; you can only check computed styles, and the user has to confirm the visual result.
- **content_scripts CSS is injected into pop-outs automatically** (they are also `mail.google.com/*`); you only need the right selectors.
- To detect "the first message in a consecutive run", use `:not(.i3b7Zb)`, not `.VX5P7c`.
- Chat's main content lives in the main document, not in an iframe (only a few widgets are iframes).
- The Chat embedded in Gmail is an iframe. The Slack style is currently **not** applied to it (to do so, add `"all_frames": true` to the Chat content_scripts group).

## 6. Testing

1. **Load test** (manifest is valid, service worker starts, storage reads and writes):
   ```bash
   node tools/load-test.js
   # Expected output: service worker loaded: true / storage toggle ok: true
   ```
   Requires playwright and Chromium. **New headless mode is required** (the script handles this); the old headless mode does not start extensions.
2. **Visual test**: preview and screenshot on the user's tab using the method in section 5. For Chat, check at least: a coworker's message, your own first and follow-up messages, quotes, reactions, the hover menu, and date separators. For Gmail, check: scrolling the split pane up and down to the reply button, switching dark/light, and the pop-out.

## 7. Packaging and deployment

```bash
cd <parent directory>
zip -rq google-workspace-tweaks.zip google-workspace-tweaks
```

How the user installs it: unzip → `chrome://extensions` → turn on Developer mode → Load unpacked.

If the extension is ever published to the Chrome Web Store, the version cannot be lower than the published one.

## 8. Version history

| Version | Changes |
|---|---|
| 0.1.0 | First official version (the user chose to start here). Includes: Chat Slack style (palette, bubble-free left-aligned messages, your own avatar and name, left-aligned reactions, straight-line quotes); Gmail message dark mode (split pane + pop-out); click the icon to toggle dark/light (no shortcut by default) |
| 0.1.1 | Chat: date separators; hover menu moved to the far right of the message row and triggered by hovering anywhere on the row; fixed missing avatar on your own messages in some conversations (switched to `:not(.i3b7Zb)`) |

## 9. Possible follow-ups (requested by or discussed with the user)

- Switch a single email back to light (a button in each message's header; more likely to break when Google updates its UI)
- Gmail compose window dark mode
- Gmail "No split" / "Right of inbox" modes
- Chat: `#` before channel names, tighter message spacing, a light-mode palette
- Apply the Slack style to the Chat embedded in Gmail
