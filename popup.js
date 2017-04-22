// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function (tabs) {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    var tab = tabs[0];

    // A tab is a plain object that provides information about the tab.
    // See https://developer.chrome.com/extensions/tabs#type-Tab
    var url = tab.url;

    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(tab.id, url);
  });
}

function renderStatus(text) {
  document.getElementById('available').textContent = text;
}

function renderInvest(text) {
  document.getElementById('invested').textContent = text;
}

var dataCallback = function (response) {
  console.log("Processing callback", response);
  renderStatus("£" + response.total);
  if (response.invested)
    renderInvest("£" + response.invested)
};

function sendMessage(message) {
  getCurrentTabUrl(function (id, url) {
    console.log("Got url: " + url);
    console.log("Sending message");
    chrome.tabs.sendMessage(id, message, dataCallback);
  });
}

document.addEventListener('DOMContentLoaded', function () {
  function sendState() {
    var minimumRate;
    var rateRdoBtns = document.loanVisibility.minimumRate;
    for (var i = 0; i < rateRdoBtns.length; i++) {
      if (rateRdoBtns[i].checked) {
        minimumRate = rateRdoBtns[i].value;
      }
    }

    var minimumDays;
    var daysRdoBtns = document.loanVisibility.minimumDays;
    for (var i = 0; i < daysRdoBtns.length; i++) {
      if (daysRdoBtns[i].checked)
        minimumDays = daysRdoBtns[i].value;
    }

    sendMessage({
      minimumRate: minimumRate,
      minimumDays: minimumDays
    });
  }

  var rateRdoBtns = document.loanVisibility.minimumRate;
  for (var i = 0; i < rateRdoBtns.length; i++) {
    rateRdoBtns[i].onclick = function() {
      sendState();
    }
  }

  var daysRdoBtns = document.loanVisibility.minimumDays;
  for (var i = 0; i < daysRdoBtns.length; i++) {
    daysRdoBtns[i].onclick = function() {
      sendState();
    }
  }
  // renderStatus('Getting total');
  sendMessage({})
});