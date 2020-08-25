const { expect } = require("chai");
const { loadFixture } = require("ethereum-waffle");
const BN = ethers.BigNumber;

const USDxV2deploy = require("../USDx_1.0/test/helpers/USDxV2deploy.js");

// USDx Contracts use web3 and truffle
async function deployUSDxContracts() {
  accounts = await web3.eth.getAccounts();
  let collaterals = new Array("PAX", "TUSD", "USDC");
  var weights = new Array(1, 1, 8);
  return await USDxV2deploy.contractsDeploy(accounts, collaterals, weights);
}

async function fixtureDeployed([wallet, other], provider) {
  const usdxContracts = await deployUSDxContracts();

  //console.log(usdxContracts);

  const [owner, ...accounts] = await ethers.getSigners();

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
  await usdxContracts.guard.permitx(interestProvider.address, funds.address);

  return { usdxContracts, funds, interestProvider, owner, accounts };
}

describe("InterestProvider", function () {
  let owner, accounts;

  before(async () => {
    [owner, ...accounts] = await ethers.getSigners();
  });

  describe("deployment()", function () {
    it("Should be able to deploy basic contracts", async function () {
      const { usdx, usr } = await loadFixture(fixtureDeployed);
    });

    it("Should be able to get 0 as initial interest amount", async function () {
      const { interestProvider } = await loadFixture(fixtureDeployed);

      let interest = await interestProvider.callStatic.getInterestAmount();

      expect(interest).to.equal(0);
    });

    it("Should be able to get 0 as initial interest details", async function () {
      const { interestProvider } = await loadFixture(fixtureDeployed);

      let interestDetails = await interestProvider.callStatic.getInterestDetails();

      console.log("Interest Details:", interestDetails);
    });

    it("Should not be able to withdraw any interest", async function () {
      const { interestProvider } = await loadFixture(fixtureDeployed);
      await expect(interestProvider.withdrawInterest(1)).to.be.reverted;
    });
  });

  describe("Now we have some interest", function () {
    before(async function () {});
    it("getInterestAmount()", async function () {
      const { interestProvider } = await loadFixture(fixtureDeployed);

      let interest = await interestProvider.callStatic.getInterestAmount();

      expect(interest).to.equal(0);
    });

    it("getInterestDetails()", async function () {
      const { interestProvider } = await loadFixture(fixtureDeployed);

      let interestDetails = await interestProvider.callStatic.getInterestDetails();

      console.log("Interest Details:", interestDetails);
    });

    it("withdrawInterest()", async function () {
      const { usdxContracts, interestProvider, owner } = await loadFixture(
        fixtureDeployed
      );

      let interest = await interestProvider.callStatic.getInterestAmount();
      let amount = interest.div(BN.from(10));

      console.log(
        "Before withdraw, account Balance:",
        (await usdxContracts.usdxToken.balanceOf(owner._address)).toString(),
        "interest:",
        interest.toString()
      );

      await interestProvider.withdrawInterest(amount);

      console.log(
        "After withdraw, account Balance:",
        (await usdxContracts.usdxToken.balanceOf(owner._address)).toString(),
        "interest:",
        (await interestProvider.getInterestAmount()).toString()
      );
    });
  });
});
