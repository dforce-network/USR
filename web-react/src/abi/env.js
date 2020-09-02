function env() {
  if (process.env.NODE_ENV === "development") {
    return {
      ENV: "development",
      URL_getBanlanceInfo: "https://testapi.dforce.network/api/v1/baseInfo/",
      ADDRESS: {
        main: {
          USDx: "0xeb269732ab75A6fD61Ea60b06fE994cD32a83549",
          dUSDx: "0xeF004C5CdFaaB19299B3ED66f14Ec010Fe5F20d0",
        },
        kovan: {
          USDx: "0x617e288A149502eC0b7f8282Ccaef093C1C1fAbF",
          dUSDx: "0x8Fbde3988CEB8C62D52cCe6FCBFf535127a6f6cf",
        },
      }
    };
  } else {
    return {
      ENV: "production",
      // URL_getBanlanceInfo: "https://testapi.dforce.network/api/v1/baseInfo/", // test
      URL_getBanlanceInfo: "https://usr.dforce.network/api/v1/baseInfo/",
      ADDRESS: {
        main: {
          USDx: "0xeb269732ab75A6fD61Ea60b06fE994cD32a83549",
          dUSDx: "0xeF004C5CdFaaB19299B3ED66f14Ec010Fe5F20d0",
        },
        kovan: {
          USDx: "0x617e288A149502eC0b7f8282Ccaef093C1C1fAbF",
          dUSDx: "0x8Fbde3988CEB8C62D52cCe6FCBFf535127a6f6cf",
        },
      }
    };
  }
}
export default env();
