// format account address
import numeral from 'numeral';

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
