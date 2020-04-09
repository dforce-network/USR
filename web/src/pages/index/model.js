// usr modal
export default {
  namespace: 'usr',
  state: {
    walletLoading: false,
    web3Failure: false,
    web3: null,
    walletAddress: '',
    walletType: '',
    usrObj: null,
    usdxObj: null,
    usdxBalance: 0,
    usdxBalanceDecimal: 0,
    usrBalance: 0,
    usrBalanceDecimal: 0,

    joinAmount: 0,
    exitAmount: 0,

    depositLoading: false,
    redeemLoading: false,

    // how many usr you will receive
    receiveUSRValue: 0,
    receiveUSDxValue: 0,

    // exchange rate
    exchangeRate: 1.5,

    usdxShowValue: 0,
    usrShowValue: 0,
  },
  effects: {},
  reducers: {
    updateParams(state, action) {
      return {
        ...state,
        [action.payload.name]: action.payload.value,
      };
    },
    updateMultiParams(state, action) {
      return {
        ...state,
        ...action.payload,
      };
    }
  }
}
