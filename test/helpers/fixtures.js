const {loadFixture} = require("ethereum-waffle");
const BN = ethers.BigNumber;

const USDxV2deploy = require("../../USDx_1.0/test/helpers/USDxV2deploy.js");

// USDx Contracts use web3 and truffle
async function deployUSDxContracts() {
  accounts = await web3.eth.getAccounts();
  let collaterals = new Array("PAX", "TUSD", "USDC");
  var weights = new Array(1, 1, 8);
  return await USDxV2deploy.contractsDeploy(accounts, collaterals, weights);
}

async function initialize(usr, usdx, interestProvider) {
  const [owner, ...accounts] = await ethers.getSigners();

  // There are many initialize due to inheritance, use the full typed signature
  //console.log(usr.functions);
  await usr.functions["initialize(address,address)"](
    usdx.address,
    interestProvider.address
  );

  // Allocate some USDx
  for (const account of accounts) {
    await usdx.transfer(account._address, ethers.utils.parseEther("10000"));
    await usdx
      .connect(account)
      .approve(usr.address, ethers.constants.MaxUint256);
  }
}

async function fixtureInterestProvider([wallet, other], provider) {
  const [owner, ...accounts] = await ethers.getSigners();

  const usdxContracts = await deployUSDxContracts();

  const Funds = await ethers.getContractFactory("Funds");
  const funds = await Funds.deploy();
  await funds.deployed();

  const InterestProvider = await ethers.getContractFactory("InterestProvider");
  const interestProvider = await InterestProvider.deploy(
    usdxContracts.usdxToken.address,
    usdxContracts.store.address,
    usdxContracts.poolV2.address,
    funds.address
  );
  await interestProvider.deployed();

  await funds.setAuthority(usdxContracts.guard.address);
  await usdxContracts.guard.permitx(
    interestProvider.address,
    usdxContracts.poolV2.address
  );
  await usdxContracts.guard.permitx(interestProvider.address, funds.address);

  return {usdxContracts, funds, interestProvider, owner, accounts};
}

async function fixtureUSRWithMockInterestProvider([wallet, other], provider) {
  const [owner, ...accounts] = await ethers.getSigners();

  const USDx = await ethers.getContractFactory("USDx");
  const usdx = await USDx.deploy();
  await usdx.deployed();

  // console.log("USDx address:", usdx.address);

  const MockInterestProvider = await ethers.getContractFactory(
    "MockInterestProvider"
  );

  // let accounts[0] to act as funds
  let funds = accounts[0];
  // console.log("funds address:", funds._address);

  const interestProvider = await MockInterestProvider.deploy(
    usdx.address,
    funds._address
  );
  await interestProvider.deployed();

  // console.log("interestProvider address:", interestProvider.address);

  await usdx
    .connect(funds)
    .approve(interestProvider.address, ethers.constants.MaxUint256);

  const initialInterest = ethers.utils.parseEther("500");
  await usdx.transfer(funds._address, initialInterest);
  expect(await usdx.balanceOf(funds._address)).to.equal(initialInterest);

  const USR = await ethers.getContractFactory("USR");
  const usr = await USR.deploy();
  await usr.deployed();

  await initialize(usr, usdx, interestProvider);

  return {usdx, usr, interestProvider, funds};
}

async function fixtureUSRWithInterestProvider([wallet, other], provider) {
  const [owner, ...accounts] = await ethers.getSigners();

  const {usdxContracts, funds, interestProvider} = await loadFixture(
    fixtureInterestProvider
  );

  const USR = await ethers.getContractFactory("USR");
  const usr = await USR.deploy();
  await usr.deployed();

  await initialize(usdx, usr, interestProvider);

  return {usdx, usr, interestProvider};
}

module.exports = {
  fixtureInterestProvider,
  fixtureUSRWithInterestProvider,
  fixtureUSRWithMockInterestProvider,
};
