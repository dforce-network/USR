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
    usdxBalance: '...',
    usdxBalanceDecimal: 0,
    usrBalance: '...',
    usrBalanceDecimal: 0,

    joinAmount: 0,
    exitAmount: 0,

    depositDisable: false,
    redeemDisable: false,

    // how many usr you will receive
    receiveUSRValue: '...',
    receiveUSDxValue: '...',

    // exchange rate
    exchangeRate: '...',
    exchangeRateDecimal: 0,

    // interest rate
    interestRate: '...',

    usdxShowValue: '',
    usrShowValue: '',

    recentTransactions: [],

    shareValue: '...',
    totalBalanceValue: '...',
    totalBalanceDecimal: 0,

    allowanceResult: 0,

    compareDepositTag: 'normal',
    compareRedeemTag: 'normal',

    // Overview
    totalUSDxInUSR: '...',
    liquidityRemaining: '...',
    USDxSavingRate: '...',
    savingOriginationFee: '...'
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
      const transactions = getTransactions(state);
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
    },
    resetInput(state, action) {
      return {
        ...state,
        usdxShowValue: '',
        usrShowValue: '',
        receiveUSRValue: 0,
        receiveUSDxValue: 0
      };
    }
  }
}
