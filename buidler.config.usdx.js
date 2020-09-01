usePlugin("@nomiclabs/buidler-truffle5");

// You have to export an object to set up your config
// This object can have the following optional entries:
// defaultNetwork, networks, solc, and paths.
// Go to https://buidler.dev/config/ to learn more
module.exports = {
  // This is a sample solc configuration that specifies which version of solc to use
  solc: {
    version: "0.5.12",
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
  paths: {
    sources: "./USDx_1.0/contracts/",
  },
};
