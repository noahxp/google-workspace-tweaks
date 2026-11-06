# Google Workspace Tweaks

A Chrome extension that tweaks Google Workspace:

- **Google Chat**: a Slack-style dark theme. Messages are left-aligned without bubbles, and your own messages show your Google account avatar and name. The sidebar Shortcuts get an **Unread** item.
- **Gmail**: dark mode for message content, including HTML emails. Images and videos keep their original colors. Click the extension icon to switch between dark and light.

## Requirements

- Google Chrome, or another Chromium-based browser that supports Manifest V3 (Edge, Brave, Arc, and so on)

## Installation

The extension is not on the Chrome Web Store, so you load it as an unpacked extension.

1. Clone or download this repository:

   ```sh
   git clone https://github.com/noahxp/google-workspace-tweaks.git
   ```

2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select the `google-workspace-tweaks` folder (the one that contains `manifest.json`).
5. Reload any open Google Chat or Gmail tabs.

Optional: pin the extension to the toolbar (puzzle-piece icon → pin) so the Gmail dark/light toggle is one click away.

## Usage

### Google Chat

Open [chat.google.com](https://chat.google.com). The Slack-style theme applies automatically. There is no setting. It works the same in the installed Google Chat app (PWA) from chat.google.com.

- **Unread shortcut**: click **未讀** (Unread) under Shortcuts to see only unread conversations. It opens Home with Home's own Unread filter turned on. Clicking **首頁** (Home) shows everything again.

### Gmail

Open [mail.google.com](https://mail.google.com). Message content is dark by default.

- **Toggle dark / light**: click the extension icon. The change applies right away to every open Gmail tab and pop-out window.
- **Keyboard shortcut**: no shortcut is set by default. To add one, open `chrome://extensions/shortcuts` and set a shortcut for *Google Workspace Tweaks*.
- An **OFF** badge on the icon means Gmail is in light mode.

## Updating

1. Pull the latest changes (`git pull`), or download the folder again.
2. Open `chrome://extensions` and click the reload icon on the *Google Workspace Tweaks* card.
3. Reload any open Google Chat or Gmail tabs.

## Uninstalling

Open `chrome://extensions` and click **Remove** on the *Google Workspace Tweaks* card.

## Known limitations

- Google Chat uses obfuscated CSS class names. When Google updates its UI, some styles may stop applying until the selectors in `slackify.css` are updated.
- Gmail dark mode inverts colors with a CSS filter, so a few emails with unusual styling may look slightly off.

## Permissions

| Permission | Why |
| --- | --- |
| `storage` | Remembers your Gmail dark/light choice |
| Access to `chat.google.com` and `mail.google.com` | Injects the styles and scripts on these sites only |

The extension does not collect or send any data.

## Maintaining

See [MAINTAINING.md](MAINTAINING.md) for how the extension works, the selector reference, how to find new selectors when Google changes its UI, and how to test and package it.
