chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'locked-in-save',
    title: 'Save to Locked In',
    contexts: ['page', 'selection'],
  });
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => undefined);
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;
  await chrome.sidePanel.open({ tabId: tab.id });
  await chrome.tabs.sendMessage(tab.id, {
    type: 'LOCKED_IN_CAPTURE',
    selection: info.selectionText,
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'LOCKED_IN_PING') {
    sendResponse({ ok: true, worker: 'event-driven' });
  }
  return true;
});
