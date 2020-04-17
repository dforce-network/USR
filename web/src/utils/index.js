// format account address
import numeral from 'numeral';
import moment from 'moment';

// format time
export function timeFormatter(time) {
  return moment(time).format('YYYY-MM-DD HH:mm:ss');
}

// format time
export function transTimeFormatter(time) {
  moment.locale('en');

  let timeobj = moment(time);
  let timePrefix = timeobj.format('LL');
  let timeEnd = timeobj.format('HH:mm:ss');
  return `${timePrefix} at ${timeEnd}`;
}

// account formatter
export function accountFormatter(account) {
  if (account.length && account.length === 40) {
    return ('0x' + account).toLowerCase()
  }
  return account.toLowerCase()
}

// transactions hash formatter
export function transactionHashFormatter(hash) {
  return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
}

// to fixed
export function toFixed(num, decimal = 2) {
  // let result = (+(Math.round(+(num + 'e' + precision)) + 'e' + -precision)).toFixed(precision);
  // return +result;
  num = num.toString();
  let index = num.indexOf('.');
  if (index !== -1) {
    num = num.substring(0, decimal + index + 1);
  } else {
    num = num.substring(0);
  }
  return +parseFloat(num).toFixed(decimal);
}

// format percent
export function percentFormatter(v) {
  let fixValue = toFixed(parseFloat(v * 100));
  return `${fixValue}%`;
}

// format usr/usdx
export function transactionValueFormatter(v) {
  if (!v) return 0;
  let vStr = parseFloat(v).toFixed(4);
  return formatCurrencyNumber(parseFloat(vStr));
}

// format transactions
export function txFormatter(network, tx) {
  return (
    <a
      href={
        network == 1 ?  `https://etherscan.io/tx/${tx}` : `https://rinkeby.etherscan.io/tx/${tx}`
      }
      target="_blank"
      rel="noopener noreferrer"
    >
      { transactionHashFormatter(tx) }
    </a>
  );
}

// format wallet address
export function accountHideFormatter(account) {
  let newaccount = accountFormatter(account);
  return `${newaccount.substring(0, 4)}...${newaccount.substring(newaccount.length - 4)}`;
}

// currency format
export function formatCurrencyNumber(b) {
  if (b > 0) {
    return numeral(b).format('0,0.00');
  }
  return '0';
}

// get transactions from local
export function getTransactions(state = {}) {
  if (!state) {
    return [];
  }
  let normalArray = window.localStorage.getItem('__transactions');
  let { network, walletAddress } = state;

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
    let filterResult = normalArray.filter(item => {
      let itemFrom = item.from || '';
      let itemNetwork = item.network || '';
      return itemFrom && itemFrom.toLowerCase() === walletAddress.toLowerCase() && itemNetwork == network;
    });
    return filterResult;
  }
  return [];
}

// updated the status of transaction
export function updateTransactionStatus({ hash = '', walletAddress = '', network = 4, status = 'finished' }) {
  let transactions = [];
  try {
    let transactionsStr = window.localStorage.getItem('__transactions');
    transactions = JSON.parse(transactionsStr);
  } catch (e) {
    console.log(e);
  }
  let filterResult = [];
  try {
    filterResult = transactions.filter(item => {
      if (item.data && item.data.transactionHash && item.from) {
        return item.data.transactionHash.toLowerCase() === hash.toLowerCase()
          && item.from.toLowerCase() === walletAddress.toLowerCase()
      }
    });

    if (filterResult.length) {
      filterResult[0].status = status;
    }
  } catch {
    filterResult = [];
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
