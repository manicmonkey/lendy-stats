chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log("Got message", message);

  //Remove cell background colours which prevents row colourisation
  var sheet = document.styleSheets[0];
  for (var i=0; i<sheet.cssRules.length; i++) {
    var selector = sheet.cssRules[i];
    var selectorText = selector.selectorText;
    if (selectorText !== undefined && selectorText.startsWith('.c-table')) {
      // console.log("Processing", sheet.cssRules[i]);
      selector.style.backgroundColor = '';
    }
  }

  function pageModel() {
    return {
      loggedIn: function () {
        return document.getElementsByClassName('c-main-nav')[0].children[4].innerText === "LOGOUT";
      },
      loansTable: function () {
        return document.getElementsByClassName('c-table')[0];
      }
    }
  }

  function getLoans() {
    var table = pageModel().loansTable();
    var rowDef = pageModel().loggedIn() ? {
      rate: 4,
      remainingTerm: 6,
      invested: 7,
      available: 8
    } : {
      rate: 4,
      remainingTerm: 6,
      available: 7
    };

    var body = table.children[1];
    var loans = [];
    for (var i = 0; i < body.childElementCount; i++) {
      loans.push(newLoan(body.children[i], rowDef));
    }
    return loans;
  }

  function newLoan(row, rowDef) {
    return {
      row: row,
      highlight: function() {
        row.style.backgroundColor = '#79bc50'
      },
      rate: function() {
        var innerText = row.children[rowDef.rate].innerText;
        var normalizedText = innerText.replace(/%/g, '');
        return parseInt(normalizedText);
      },
      remainingTerm: function() {
        var innerText = row.children[rowDef.remainingTerm].innerText;
        var normalizedText = innerText.replace(/ days/g, '');
        return parseInt(normalizedText);
      },
      invested: function() {
        var innerText = row.children[rowDef.invested].innerText;
        var normalizedText = innerText.replace(/£|,/g, '');
        return parseFloat(normalizedText);
      },
      value: function() {
        var innerText = row.children[rowDef.available].innerText;
        var normalizedText = innerText.replace(/£|,/g, '');
        return parseFloat(normalizedText);
      }
    };
  }

  function forEachLoan(callback) {
    var loans = getLoans();
    for (var i = 0; i < loans.length; i++) {
      var loan = loans[i];
      callback(loan);
    }
  }

  function highlightLoans() {
    forEachLoan(function(loan) {
      if (loan.invested() > 0)
        loan.highlight();
    })
  }

  function getTotalAvailable() {
    var loanTotal = 0;
    forEachLoan(function(loan) {
      loanTotal += loan.value();
    });
    return loanTotal;
  }

  function getTotalInvested() {
    var loanTotal = 0;
    forEachLoan(function(loan) {
      loanTotal += loan.invested();
    });
    return loanTotal;
  }

  console.log("Got minimum rate", message.minimumRate);
  var minimumRate = message.minimumRate ? message.minimumRate : 0;
  console.log("Got minimum days", message.minimumDays);
  var minimumDays = message.minimumDays ? message.minimumDays : -180;

  forEachLoan(function(loan) {
    if (loan.rate() < minimumRate || loan.remainingTerm() < minimumDays)
      loan.row.style.display = 'none';
    else
      loan.row.style.display = 'table-row';
  });

  highlightLoans();

  function sortLoansByRemainingTerm() {
    var loans = [];
    var table = pageModel().loansTable();
    forEachLoan(function (loan) {
      loans.push(loan);
      table.children[1].removeChild(loan.row);
    });
    console.log("Got loans", loans);
    loans.sort(function (a, b) {
      return b.remainingTerm() - a.remainingTerm();
    });
    for (var i = 0; i < loans.length; i++) {
      table.children[1].appendChild(loans[i].row);
    }
  }

  sortLoansByRemainingTerm();

  var invested = pageModel().loggedIn() ? getTotalInvested() : 0;
  var loanTotal = getTotalAvailable();

  console.log("Got loan total: " + loanTotal);

  loanTotal = Number(loanTotal).toLocaleString();
  sendResponse({
    invested: invested,
    total: loanTotal
  });
});