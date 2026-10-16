import { pingReply } from './capture.js';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'locked-in-read',
      title: 'Read this page in Locked In',
      contexts: ['page', 'selection'],
    });
  });
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => undefined);
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id || info.menuItemId !== 'locked-in-read') return;
  await chrome.storage.session.set({ pendingSelection: info.selectionText ?? '' });
  await chrome.sidePanel.open({ tabId: tab.id });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const reply = pingReply(message);
  if (!reply) return;
  sendResponse(reply);
});
