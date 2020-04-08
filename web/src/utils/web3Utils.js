import Web3 from 'web3';
import config from './config';
import USRABI from '../abi/USR.abi.json';

let Decimal = require('decimal.js-light')
Decimal = require('toformat')(Decimal)

const USDxAddress = config.USDx
const USRAddress = config.USR

export const WadDecimal = Decimal.clone({
  rounding: 1, // round down
  precision: 78,
  toExpNeg: -18,
  toExpPos: 78,
})

export function setupContracts() {

}

export function getData() {

}

export const initBrowserWallet = async function(dispatch, prompt = true) {
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
    })
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

  setupContracts.bind(this)();
  getData.bind(this)();
}
