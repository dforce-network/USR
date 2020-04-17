import { message } from 'antd';

message.config({
  top: 100,
  maxCount: 1,
  duration: 3
});

export default {
  "defaultWeb3Provider": "https://mainnet.infura.io/v3/8facbab2998b411ea0cef95ae90b66f1",
  main: {
    "USDx": "0x1CBd0C8d16dd9C8f450c781b5c3e3623F95f7344",
    "USR": "0x8F015c9cF90d48AFd30d51157e8574392c0c2b81"
  },
  rinkeby: {
    "USDx": "0xD96cC7f80C1cb595eBcdC072531e1799B3a2436E",
    "USR": "0x1f2B68512A0e4C2CcEFAd0af60E699B22588362a"
    // "USDx": "0x1CBd0C8d16dd9C8f450c781b5c3e3623F95f7344",
    // "USR": "0x8F015c9cF90d48AFd30d51157e8574392c0c2b81",
  }
};
