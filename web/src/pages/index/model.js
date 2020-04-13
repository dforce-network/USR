// usr modal
import { getTransactions } from '@utils';

export default {
  namespace: 'usr',
  state: {
    network: 0,

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

    depositDisable: false,
    redeemDisable: false,

    // how many usr you will receive
    receiveUSRValue: 0,
    receiveUSDxValue: 0,

    // exchange rate
    exchangeRate: 1.5,
    // interest rate
    interestRate: 0,

    usdxShowValue: '',
    usrShowValue: '',

    recentTransactions: [],

    shareValue: 0,
    totalBalanceValue: 0,

    depositBalanceEnough: true,
    redeemBalanceEnough: true
  },
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
    },
    updateRecentTransactions(state) {
      const transactions = getTransactions();
      return {
        ...state,
        recentTransactions: [...transactions],
      };
    },
    updateBtnDisable(state, action) {
      if (action.payload.name === 'deposit') {
        if (action.payload.notChange) {
          return {
            ...state,
            depositDisable: !!action.payload.disable
          };
        }
        return {
          ...state,
          usdxShowValue: '',
          receiveUSRValue: 0,
          depositDisable: !!action.payload.disable
        };
      } else {
        if (action.payload.notChange) {
          return {
            ...state,
            redeemDisable: !!action.payload.disable
          };
        }
        return {
          ...state,
          usrShowValue: '',
          receiveUSDxValue: 0,
          redeemDisable: !!action.payload.disable
        };
      }
    }
  }
}
