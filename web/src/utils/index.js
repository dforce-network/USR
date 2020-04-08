
// 格式化钱包地址
export function accountFormatter(account) {
  if (account.length && account.length === 40) {
    return ('0x' + account).toLowerCase()
  }
  return account.toLowerCase()
}

// 将钱包地址格式化为 0xff****xx2a
export function accountHideFormatter(account) {
  let newaccount = accountFormatter(account);
  return `${newaccount.substring(0, 4)}****${newaccount.substring(newaccount.length - 4)}`;
}
