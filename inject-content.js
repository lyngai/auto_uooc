var script = document.createElement('script');
script.setAttribute('type', 'text/javascript');
script.src = chrome.extension.getURL('scripts/center.js');
document.body.appendChild(script);