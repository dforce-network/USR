const USDx = artifacts.require("USDx");
const ProfitProvider = artifacts.require("ProfitProviderUSDx");
const ProfitFunds = artifacts.require("ProfitFunds");
const USR = artifacts.require("USR");

let usdx_contract = "0x43Aa962BD176688d2FfBeCe76b8686828f258BEC";
let dfStore_contract = "0x6e47742f0c31c717D5B4921a22044715E3007f81";
let dfPool_contract = "0xdb90960836a5b6b352c004fC70FfBb15C3f1edE1";
let dfCollateral_contract = "0x5cCa6C7f4D9bBc8f956Ac40cF6C172c6279294D0";
let dTokenController_contract = "0xF1b95BebBF98bCE74C31fdB0e6548Cf943d17a08";


module.exports = async function(deployer, network, accounts) {
    let contractDeployer = accounts[0];
    let guardOwner = accounts[1];
    let proxyAdmin = accounts[1];
    // if (network == 'kovan') {
    //     usdx = await USDx.at(usdx_contract);
    // }
    // Deploys profit funds
    await deployer.deploy(ProfitFunds);
    let profitFunds = await ProfitFunds.deployed();

    // Deploys profit provider
    await deployer.deploy(
        ProfitProvider,
        usdx_contract,
        dfStore_contract,
        dfPool_contract,
        dfCollateral_contract,
        profitFunds.address,
        dTokenController_contract
    );
    let profitProvider = await ProfitProvider.deployed();

    // Deploy USR contract
    await deployer.deploy(USR)
    usr = await USR.deployed(usdx_contract, profitProvider.address);

    console.log("------------");
    console.log("Deployed contracts are: ");
    console.log("profitFunds contract address: ", profitFunds.address);
    console.log("profitProvider contract address: ", profitProvider.address);
    console.log("USR contract address: ", usr.address);
};
