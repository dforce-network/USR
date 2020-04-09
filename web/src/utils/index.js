// format account address
import numeral from 'numeral';
import moment from 'moment';

// format time
export function formatTime(time) {
  return moment(time).format('YYYY-MM-DD HH:mm:ss');
}

export function accountFormatter(account) {
  if (account.length && account.length === 40) {
    return ('0x' + account).toLowerCase()
  }
  return account.toLowerCase()
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
  return normalArray;
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
    normalArray.push(transObj);
  }

  window.localStorage.setItem('__transactions', JSON.stringify(normalArray));
}