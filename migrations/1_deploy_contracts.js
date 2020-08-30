const DSGuard = artifacts.require("DSGuard");
const USRProxy = artifacts.require("USRProxy");
const InterestProvider = artifacts.require("InterestProvider");
const Funds = artifacts.require("Funds");
const USR = artifacts.require("USR");

let USDx = "0x617e288A149502eC0b7f8282Ccaef093C1C1fAbF";
let dfGuard = "0x6f663eac7F0d8303B7E40FBB45e0E41AFdbBdd17";
let dfStore = "0x65FFb400937314248b7Fb627Ba1ec8D14b9dca0f";
let dfPool = "0x38511020a5B340cdE56e57Ce9bFBd13572C62Eb1";
let count = 0;

module.exports = async function(deployer, network, accounts) {
    let contractDeployer = accounts[0];
    let owner = accounts[0];

    function print(str) {
        count++;
        console.log(`\n${count} #######`, str);
    }

    function printTx(str) {
        console.log(`\n-#######`, str);
    }

    function perror(str) {
        console.log(`\n!!!!!!!`, str);
    }
    // if (network == 'kovan') {
    //     usdx = await USDx.at(USDx);
    // }
    // Deploys profit funds
    await deployer.deploy(DSGuard, {'from': owner});
    let Guard = await DSGuard.deployed();

    await deployer.deploy(Funds, {'from': owner});
    let funds = await Funds.deployed();

    // Deploys profit provider
    let interestProviderImplementation = await deployer.deploy(
        InterestProvider,
        USDx,
        dfStore,
        dfPool,
        funds.address,
    );
    await deployer.deploy(USRProxy, interestProviderImplementation.address);
    let interestProviderProxy = await USRProxy.deployed();
    let interestProvider = await InterestProvider.at(interestProviderProxy.address);
    await interestProvider.initialize(USDx, dfStore, dfPool, funds.address, {'from': owner}).then(result => {
        print("interestProvider.initialize");
        printTx(result.tx);
    }).catch(error => {
        perror("interestProvider.initialize");
        console.log(error);
    })

    // Deploy USR contract
    let usrImplementation = await deployer.deploy(USR);
    await deployer.deploy(USRProxy, usrImplementation.address);
    let usrProxy = await USRProxy.deployed();
    let usr = await USR.at(usrProxy.address);
    await usr.methods["initialize(address,address)"](USDx, interestProvider.address, {'from': owner}).then(result => {
        print("usr.initialize");
        printTx(result.tx);
    }).catch(error => {
        perror("usr.initialize");
        console.log(error);
    })

    await funds.setAuthority(Guard.address, {'from': owner}).then(result => {
        print("funds.setAuthority");
        printTx(result.tx);
    }).catch(error => {
        perror("funds.setAuthority");
        console.log(error);
    })

    await interestProvider.setAuthority(Guard.address, {'from': owner}).then(result => {
        print("interestProvider.setAuthority");
        printTx(result.tx);
    }).catch(error => {
        perror("interestProvider.setAuthority");
        console.log(error);
    })

    await usr.setAuthority(Guard.address, {'from': owner}).then(result => {
        print("usr.setAuthority");
        printTx(result.tx);
    }).catch(error => {
        perror("usr.setAuthority");
        console.log(error);
    })

    await Guard.permitx(interestProvider.address, funds.address, {'from': owner}).then(result => {
        print("Guard.permitx interestProvider funds");
        printTx(result.tx);
    }).catch(error => {
        perror("Guard.permitx interestProvider funds");
        console.log(error);
    })

    await Guard.permitx(usr.address, interestProvider.address, {'from': owner}).then(result => {
        print("Guard.permitx usr interestProvider");
        printTx(result.tx);
    }).catch(error => {
        perror("Guard.permitx usr interestProvider");
        console.log(error);
    })

    let dfGuardContracts = await DSGuard.at(dfGuard);

    await dfGuardContracts.permitx(interestProvider.address, dfPool, {'from': owner}).then(result => {
        print("dfGuardContracts.permitx interestProvider dfPool");
        printTx(result.tx);
    }).catch(error => {
        perror("dfGuardContracts.permitx interestProvider dfPool");
        console.log(error);
    })

    console.log('----------------------------------\n');
    console.log('Guard:             ' + Guard.address);
    console.log('\n');
    console.log('Funds:             ' + funds.address);
    console.log('\n');
    console.log('InterestProvider:  ' + interestProvider.address);
    console.log('implementation:    ' + interestProviderImplementation.address);
    console.log('\n');
    console.log('dfPool:            ' + dfPool);
    console.log('USDx:              ' + USDx);
    console.log('\n');
    console.log('USR:               ' + usr.address);
    console.log('implementation:    ' + usrImplementation.address);

};
