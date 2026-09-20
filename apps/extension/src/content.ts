export interface PageCapture {
  url: string;
  title: string;
  html: string;
  selection: string;
}

function capture(selection?: string): PageCapture {
  return {
    url: location.href,
    title: document.title,
    html: document.documentElement.outerHTML,
    selection: selection ?? window.getSelection()?.toString() ?? '',
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'LOCKED_IN_CAPTURE' || message?.type === 'LOCKED_IN_GET_PAGE') {
    sendResponse(capture(message.selection));
  }
  return true;
});
