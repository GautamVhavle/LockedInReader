import { chosenSelection, pageFromMessage, type PageCapture } from './capture.js';

export type { PageCapture };

function capture(selection?: string): PageCapture {
  return {
    url: location.href,
    title: document.title,
    html: document.documentElement.outerHTML,
    selection: chosenSelection(selection, window.getSelection()?.toString() ?? ''),
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const page = pageFromMessage(message, capture);
  if (!page) return;
  sendResponse(page);
});
