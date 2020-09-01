function env() {
  if (process.env.NODE_ENV === "development") {
    return {
      ENV: "development",
      URL_getBanlanceInfo: "https://testapi.dforce.network/api/v1/baseInfo/",
      ADDRESS: {
        main: {},
        kovan: {
          USDx: "0x617e288A149502eC0b7f8282Ccaef093C1C1fAbF",
          dUSDx: "0x8Fbde3988CEB8C62D52cCe6FCBFf535127a6f6cf",
        },
      }
    };
  } else {
    return {
      ENV: "production",
      URL_getBanlanceInfo: "https://testapi.dforce.network/api/v1/baseInfo/",
      ADDRESS: {
        main: {},
        kovan: {
          USDx: "0x617e288A149502eC0b7f8282Ccaef093C1C1fAbF",
          dUSDx: "0x8Fbde3988CEB8C62D52cCe6FCBFf535127a6f6cf",
        },
      }
    };
  }
}
export default env();
