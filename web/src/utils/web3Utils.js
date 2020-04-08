import Web3 from 'web3';

export const initBrowserWallet = async function(prompt) {
  const store = this.props.store;

  store.set('walletLoading', true);
  if (!localStorage.getItem('walletKnown') && !prompt) return;

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
  }
  // Legacy dApp browsers...
  else if (window.web3) {
    web3Provider = window.web3.currentProvider;
  }
  // If no injected web3 instance is detected, display err
  else {
    console.log("Please install MetaMask!");
    store.set('web3Failure', true);
    return;
  }

  const web3 = new Web3(web3Provider);
  const network = await web3.eth.net.getId();
  store.set('network', network);
  store.set('web3Failure', false);
  store.set('web3', web3);
  const walletType = 'browser';
  const accounts = await web3.eth.getAccounts();
  localStorage.setItem('walletKnown', true);

  store.set('walletLoading', false);
  store.set('walletAddress', accounts[0]);
  store.set('walletType', walletType);
  setupContracts.bind(this)();
  getData.bind(this)();
}
