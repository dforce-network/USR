var fs = require("fs");
const bre = require("@nomiclabs/buidler");

async function copyUSDxArtifacts() {
  const USDxArtifacts = [
    "Utils",
    "ReentrancyGuard",
    "DSValue",
    "DSThing",
    "DSNote",
    "DSMath",
    "DSGuardEvents",
    "DSGuard",
    "DSAuthority",
    "DSAuthEvents",
    "DSAuth",
    "UpgradeabilityProxy",
    "Proxy",
    "DFProxy",
    "AdminUpgradeabilityProxy",
    "AddressUtils",
    "DFUpgrader",
    "IERC20Token",
    "IERC20",
    "IDSWrappedToken",
    "IDSToken",
    "ERC20SafeTransfer",
    "DSWrappedToken",
    "ERC20Events",
    "ERC20",
    "DSTokenBase",
    "DSToken",
    "DSStop",
    "SafeMath",
    "Collaterals_t",
    "IDTokenController",
    "IDToken",
    "IDFStore",
    "IDFPoolV2",
    "IDFPool",
    "IDFFunds",
    "IDFCollateral",
    "DFStore",
    "DFPoolV2",
    "DFPoolV1",
    "DFPool",
    "DFFunds",
    "DFCollateral",
    "iMedianizer",
    "UniswapV2Library",
    "Oracle",
    "PriceFeed",
    "Medianizer",
    "DTokenController",
    "DToken",
    "Migrations",
    "IDFProtocol",
    "IDFEngine",
    "DFSetting",
    "DFProtocolView",
    "DFProtocol",
    "DFEngineV2",
    "DFEngine",
  ];

  USDxArtifacts.forEach((file) => {
    fs.copyFileSync(
      "./artifacts/" + file + ".json",
      "./build/" + file + ".json"
    );
  });
}

module.exports = {
  onCompileComplete: copyUSDxArtifacts,
  skipFiles: ["library", "interface", "mock", "Migrations.sol", "USRProxy.sol"],

  mocha: {
    grep: "(Skipped in coverage)", // We have some cases need to be skipped
    invert: true, // Run the grep's inverse set.
  },
};
