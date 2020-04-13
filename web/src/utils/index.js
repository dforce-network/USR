// format account address
import numeral from 'numeral';
import moment from 'moment';

// format time
export function timeFormatter(time) {
  return moment(time).format('YYYY-MM-DD HH:mm:ss');
}

// account formatter
export function accountFormatter(account) {
  if (account.length && account.length === 40) {
    return ('0x' + account).toLowerCase()
  }
  return account.toLowerCase()
}

// format percent
export function percentFormatter(v) {
  let fixValue = parseFloat(v * 100).toFixed(2);
  return `${fixValue}%`;
}

// format usr/usdx
export function transactionValueFormatter(v) {
  if (!v) return 0;
  let vStr = parseFloat(v).toFixed(4);
  return parseFloat(vStr);
}

// format transactions
export function txFormatter(network, tx) {
  return network == 1 ?  `https://etherscan.io/tx/${tx}` : `https://rinkeby.etherscan.io/tx/${tx}`;
}

// format wallet address
export function accountHideFormatter(account) {
  let newaccount = accountFormatter(account);
  return `${newaccount.substring(0, 4)}****${newaccount.substring(newaccount.length - 4)}`;
}

// currency format
export function formatCurrencyNumber(b) {
  if (b > 0) {
    return numeral(b).format('0,0.00');
  }
  return '0';
}

// get transactions from local
export function getTransactions() {
  let normalArray = window.localStorage.getItem('__transactions');

  if (!normalArray) {
    normalArray = [];
  } else {
    try {
      normalArray = JSON.parse(normalArray);
    } catch {
      normalArray = [];
    }
  }

  if (normalArray.length) {
    return normalArray;
  }
  return [];
}

export function updateTransactionStatus(hash) {
  let transactions = getTransactions();
  let filterResult = [];
  try {
    filterResult = transactions.filter(item => {
      if (item.data && item.data.transactionHash) {
        return item.data.transactionHash.toLowerCase() === hash.toLowerCase();
      }
    });
  } catch {
    filterResult = [];
  }

  if (filterResult.length) {
    filterResult[0].status = 'finished';
  }

  window.localStorage.setItem('__transactions', JSON.stringify(transactions));
}

// save transactions to localStorage
export function saveTransactions(transObj) {
  let normalArray = window.localStorage.getItem('__transactions');

  if (!normalArray) {
    normalArray = [];
  } else {
    try {
      normalArray = JSON.parse(normalArray);
    } catch {
      normalArray = [];
    }
  }

  if (normalArray) {
    normalArray.unshift(transObj);
  }

  window.localStorage.setItem('__transactions', JSON.stringify(normalArray));
}

export function SuspenseFallback() {
  return <b></b>;
}
