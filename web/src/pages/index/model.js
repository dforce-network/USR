// usr modal
export default {
  namespace: 'usr',
  state: {
    walletLoading: false,
    web3Failure: false,
    web3: null,
    walletAddress: '',
    walletType: ''
  },
  effects: {},
  reducers: {
    updateParams(state, action) {
      return {
        ...state,
        [action.payload.name]: action.payload.value,
      };
    }
  }
}
