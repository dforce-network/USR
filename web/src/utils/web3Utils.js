import Web3 from 'web3';
import config from './config';
import USRABI from '../abi/USR.abi.json';
import USDxABI from '../abi/USDx.abi.json';
import { message } from 'antd';
import { saveTransactions, updateTransactionStatus, timeFormatter } from './index';

let Decimal = require('decimal.js-light');
Decimal = require('toformat')(Decimal);

export const WadDecimal = Decimal.clone({
  rounding: 1, // round down
  precision: 78,
  toExpNeg: -18,
  toExpPos: 78,
})

WadDecimal.format = {
  groupSeparator: ",",
  groupSize: 3,
}

// to fixed
function toFixed(num, precision) {
  return (+(Math.round(+(num + 'e' + precision)) + 'e' + -precision)).toFixed(precision);
}

// get usdx balance
export async function getUSDxBalance() {
  const {
    web3,
    walletAddress,
    usdxObj,
  } = this.props.usr;
  const { dispatch } = this.props;

  if (!usdxObj || !walletAddress) return;

  const usdxBalanceRaw = await usdxObj.methods.balanceOf(walletAddress).call();
  const usdxBalanceDecimal = new WadDecimal(usdxBalanceRaw).div('1e18');
  const usdxBalance = toFixed(parseFloat(web3.utils.fromWei(usdxBalanceRaw)), 5);

  dispatch({
    type: 'usr/updateMultiParams',
    payload: {
      usdxBalance,
      usdxBalanceDecimal,
    }
  });
}

// get usr balance
export async function getUSRBalance() {
  const {
    dispatch,
    usr: {
      web3,
      usrObj,
      walletAddress,
    }
  } = this.props;

  if (!usrObj || !walletAddress) return;
  console.log(walletAddress);
  const usrBalanceRaw = await usrObj.methods.balanceOf(walletAddress).call();
  const usrBalanceDecimal = new WadDecimal(usrBalanceRaw).div('1e18');
  const usrBalance = toFixed(parseFloat(web3.utils.fromWei(usrBalanceRaw)), 5);

  // save usr balance
  dispatch({
    type: 'usr/updateMultiParams',
    payload: {
      usrBalance,
      usrBalanceDecimal,
    },
  });
}

// get exchange rate
export async function getExchangeRate() {
  const { usrObj } = this.props.usr;
  const exchangeRateRaw = await usrObj.methods.getExchangeRate().call();
  const exchangeRateDecimal = new WadDecimal(exchangeRateRaw).div('1e27');
  const exchangeRate = exchangeRateDecimal.toFixed(8);

  this.props.dispatch({
    type: 'usr/updateMultiParams',
    payload: { exchangeRate }
  });
}

// get interest rate
export async function getInterestRate() {
  const { usrObj } = this.props.usr;
  // console.log(usrObj.methods)
  const interestRateRaw = await usrObj.methods.getFixedInterestRate(3600 * 24 * 365).call();
  const interestRateDecimal = new WadDecimal(interestRateRaw - 1e27).div('1e27');
  const interestRate = interestRateDecimal.toFixed();

  this.props.dispatch({
    type: 'usr/updateMultiParams',
    payload: { interestRate }
  });
}

// get total balance
export async function getTotalBalanceOfUSDx() {
  const { web3, usrObj, walletAddress } = this.props.usr;
  const totalBalanceRaw = await usrObj.methods.getTotalBalance(walletAddress).call();
  const totalBalanceValue = toFixed(parseFloat(web3.utils.fromWei(totalBalanceRaw)), 5);

  console.log('totalBalanceRaw', totalBalanceRaw);
  this.props.dispatch({
    type: 'usr/updateMultiParams',
    payload: { totalBalanceValue }
  });
}

// get share
// usdx value
export async function getShare() {
  const { web3, usrObj } = this.props.usr;
  const shareRaw = await usrObj.methods.share().call();
  const shareValue = toFixed(parseFloat(web3.utils.fromWei(shareRaw)), 5);

  console.log(`shareRaw: ${shareRaw/1e18}`);
  this.props.dispatch({
    type: 'usr/updateMultiParams',
    payload: { shareValue }
  });
}

// set up contracts
export function setupContracts(dispatch) {
  const { web3, network } = this.props.usr;
  let networkName = network == 0 ? 'main' :'rinkeby';
  dispatch('usrObj', new web3.eth.Contract(USRABI, config[networkName].USR));
  dispatch('usdxObj', new web3.eth.Contract(USDxABI, config[networkName].USDx));
}

// get balance of usr and usdx
export async function getData() {
  getUSRBalance.bind(this)();
  getUSDxBalance.bind(this)();
  getExchangeRate.bind(this)();
  getInterestRate.bind(this)();
  getShare.bind(this)();
  getTotalBalanceOfUSDx.bind(this)();
  allowance.bind(this)();
}

// approval
export async function approval() {
  const { usdxObj, usrObj, walletAddress } = this.props.usr;
  return usdxObj.methods.approve(usrObj.options.address, '-1')
    .send({ from: walletAddress })
    .then(() => {
      window.localStorage.setItem('approved', 'true');
    }
  );
}

// get allowance data
export async function allowance() {
  const { usdxObj, usrObj, walletAddress, network } = this.props.usr;
  const networkName = network == 0 ? 'main' : 'rinkeby';
  const allowanceResult = await usdxObj.methods.allowance(walletAddress, config[networkName].USR).call();

  this.props.dispatch({
    type: 'usr/updateMultiParams',
    payload: {
      allowanceResult: +allowanceResult
    }
  });
}

// init browser wallet
export async function initBrowserWallet(dispatch, prompt = true) {
  if (!dispatch) {
    dispatch = (name, value) => {
      this.props.dispatch({
        type: 'usr/updateParams',
        payload: {
          name,
          value
        }
      });
    };
  }

  dispatch('walletLoading', true);
  // if (!localStorage.getItem('walletKnown') && !prompt) return;

  let web3Provider;

  // Initialize web3 (https://medium.com/coinmonks/web3-js-ethereum-javascript-api-72f7b22e2f0a)
  if (window.ethereum) {
    web3Provider = window.ethereum;
    try {
      // Request account access
      await window.ethereum.enable();
    } catch (error) {
      // User denied account access...
      console.error("User denied account access");
    }

    window.ethereum.on('accountsChanged', (accounts) => {
      initBrowserWallet.bind(this)();
    });
  } else if (window.web3) {
    web3Provider = window.web3.currentProvider;
  } else {
    // If no injected web3 instance is detected, display err
    console.log("Please install MetaMask!");
    dispatch('web3Failure', true);
    return;
  }

  const web3 = new Web3(web3Provider);
  const network = await web3.eth.net.getId();

  dispatch('network', network);
  dispatch('web3Failure', false);
  dispatch('web3', web3);

  const walletType = 'browser';
  const accounts = await web3.eth.getAccounts();
  localStorage.setItem('walletKnown', true);

  dispatch('walletLoading', false);
  dispatch('walletAddress', accounts[0]);
  dispatch('walletType', walletType);

  this.props.dispatch({
    type: 'usr/updateRecentTransactions'
  });

  setupContracts.bind(this)(dispatch);

  getData.bind(this)();
}

export function mintUSRCallback(reject, reHash, receiveUSRValue, storeJoinAmount) {
  if (reject && reject.message) {
    message.error(reject.message);
  }
  if (reHash) {
    let { walletAddress, network } = this.props.usr;
    let transObj = {
      action: 'deposit',
      data: { transactionHash: reHash },
      usr: receiveUSRValue,
      usdx: storeJoinAmount,
      time: timeFormatter(new Date()),
      status: 'init',
      from: walletAddress,
      network
    };

    saveTransactions(transObj);

    this.props.dispatch({
      type: 'usr/updateRecentTransactions'
    });

    this.props.dispatch({
      type: 'usr/updateBtnDisable',
      payload: {
        name: 'deposit',
        disable: false
      }
    });
  }
}

// transfer usdx
export async function mintUSR() {
  let {
    web3,
    usrObj,
    usdxObj,
    network,
    joinAmount,
    walletAddress,
    receiveUSRValue,
    allowanceResult
  } = this.props.usr;

  let storeJoinAmount = joinAmount.toFixed();

  joinAmount = joinAmount.mul(10**18);

  if (allowanceResult) {
    usrObj.methods
      .mint(walletAddress, joinAmount.toFixed())
      .send(
        {
          from: walletAddress,
          gas: 1000000
        },
        (reject, reHash) => {
          mintUSRCallback.bind(this)(reject, reHash, receiveUSRValue, storeJoinAmount);
        }
      )
      .then(res => {
        getData.bind(this)();

        // set the status of transaction
        updateTransactionStatus(res.transactionHash);

        this.props.dispatch({
          type: 'usr/updateRecentTransactions'
        });
      });
  } else {
    usdxObj.methods.approve(usrObj.options.address, '-1')
      .send({ from: walletAddress }, (sendReject, sendHash) => {
        if (sendHash) {
          usrObj.methods
            .mint(walletAddress, joinAmount.toFixed())
            .send(
              {
                from: walletAddress,
                gas: 1000000
              },
              (reject, reHash) => {
                mintUSRCallback.bind(this)(reject, reHash, receiveUSRValue, storeJoinAmount);
              }
            )
            .then(res => {
              getData.bind(this)();

              // set the status of transaction
              updateTransactionStatus(res.transactionHash);

              this.props.dispatch({
                type: 'usr/updateRecentTransactions'
              });
            });
        }
      });
  }
}

// transfer usr
export async function burnUSR() {
  let {
    web3,
    usrObj,
    usdxObj,
    network,
    joinAmount,
    exitAmount,
    walletAddress,
    receiveUSDxValue,
  } = this.props.usr;

  let storeExitAmount = exitAmount.toFixed();

  exitAmount = exitAmount.mul(10**18);

  return usrObj.methods
    .burn(walletAddress, exitAmount.toFixed())
    .send(
      {
        from: walletAddress,
        gas: 1000000
      },
      (reject, reHash) => {
        if (reject && reject.message) {
          message.error(reject.message);
        }
        if (reHash) {
          let transObj = {
            action: 'redeem',
            data: { transactionHash: reHash },
            usr: storeExitAmount,
            usdx: receiveUSDxValue,
            time: timeFormatter(new Date()),
            status: 'init',
            network,
            from: walletAddress
          };

          saveTransactions(transObj);

          this.props.dispatch({
            type: 'usr/updateRecentTransactions'
          });

          this.props.dispatch({
            type: 'usr/updateBtnDisable',
            payload: {
              name: 'redeem',
              disable: false
            }
          });
        }
      }
    )
    .then(res => {
      getData.bind(this)();

      // set the status of transaction
      updateTransactionStatus(res.transactionHash);

      this.props.dispatch({
        type: 'usr/updateRecentTransactions'
      });
    });
}
