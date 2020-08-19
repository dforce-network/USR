const ProfitProvider = artifacts.require("InterestProvider");
const ProfitFunds = artifacts.require("Funds");
const USR = artifacts.require("USR");

let usdx_contract = "0x617e288A149502eC0b7f8282Ccaef093C1C1fAbF";
let dfStore_contract = "0x65FFb400937314248b7Fb627Ba1ec8D14b9dca0f";
let dfPool_contract = "0x38511020a5B340cdE56e57Ce9bFBd13572C62Eb1";


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
        profitFunds.address,
    );
    let profitProvider = await ProfitProvider.deployed();

    // Deploy USR contract
    await deployer.deploy(USR)
    usr = await USR.deployed();
    await usr.initialize(usdx_contract, profitProvider.address)

    console.log("------------");
    console.log("Deployed contracts are: ");
    console.log("Funds contract address: ", profitFunds.address);
    console.log("InterestProvider contract address: ", profitProvider.address);
    console.log("USR contract address: ", usr.address);
};
