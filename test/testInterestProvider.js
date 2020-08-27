const {expect} = require("chai");
const {loadFixture} = require("ethereum-waffle");
const BN = ethers.BigNumber;

const USDxV2deploy = require("../USDx_1.0/test/helpers/USDxV2deploy.js");

const Collaterals = artifacts.require("Collaterals_t.sol");

// USDx Contracts use web3 and truffle
async function deployUSDxContracts() {
  accounts = await web3.eth.getAccounts();
  let collaterals = new Array("PAX", "TUSD", "USDC");
  var weights = new Array(1, 1, 8);
  return await USDxV2deploy.contractsDeploy(accounts, collaterals, weights);
}

async function printInterestDetails(details, contracts) {
  console.log("Interest Details:");
  for (const i in details[0]) {
    let srcToken = contracts.srcTokens.find((t) => t.address == details[0][i]);
    let name = await srcToken.name();

    console.log(
      name,
      "Src Amount:",
      details[1][i].toString(),
      "Wrap Amount ",
      ethers.utils.formatEther(details[3][i])
    );
  }
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

  await usdxContracts.guard.permitx(
    interestProvider.address,
    usdxContracts.poolV2.address
  );
  await usdxContracts.guard.permitx(interestProvider.address, funds.address);

  return {usdxContracts, funds, interestProvider, owner, accounts};
}

describe("InterestProvider", function () {
  let owner, accounts;

  before(async () => {
    [owner, ...accounts] = await ethers.getSigners();
  });

  describe("deployment()", function () {
    it("Should be able to deploy basic contracts", async function () {
      const {usdx, usr} = await loadFixture(fixtureDeployed);
    });

    it("Should be able to get 0 as initial interest amount", async function () {
      const {interestProvider} = await loadFixture(fixtureDeployed);

      let interest = await interestProvider.callStatic.getInterestAmount();

      expect(interest).to.equal(0);
    });

    it("Should be able to get 0 as initial interest details", async function () {
      const {usdxContracts, interestProvider} = await loadFixture(
        fixtureDeployed
      );

      let interestDetails = await interestProvider.callStatic.getInterestDetails();

      await printInterestDetails(interestDetails, usdxContracts);
    });

    it("Should not be able to withdraw any interest", async function () {
      const {interestProvider} = await loadFixture(fixtureDeployed);
      await expect(interestProvider.withdrawInterest(1)).to.be.reverted;
    });
  });

  describe("Mock some interest", function () {
    before(async function () {
      const {usdxContracts, funds} = await loadFixture(fixtureDeployed);

      let amount = ethers.utils.parseEther("10000");
      await usdxContracts.protocol.oneClickMinting(0, amount);

      // Mock some interest
      for (const wrapToken of usdxContracts.wrapTokens) {
        let srcToken = await Collaterals.at(await wrapToken.getSrcERC20());
        let dTokenAddress = await usdxContracts.dTokenController.getDToken(
          srcToken.address
        );

        //console.log((await srcToken.balanceOf(owner._address)).toString());
        await srcToken.transfer(
          dTokenAddress,
          await wrapToken.reverseByMultiple(amount.div(10))
        );
      }

      // Deposit some USDx in funds
      await usdxContracts.usdxToken.transfer(funds.address, amount);
      //   await funds.transferOut(
      //     usdxContracts.usdxToken.address,
      //     accounts[1]._address,
      //     100
      //   );
    });

    it("getInterestAmount()", async function () {
      const {interestProvider} = await loadFixture(fixtureDeployed);

      let interest = await interestProvider.callStatic.getInterestAmount();

      //expect(interest).to.equal(0);
    });

    it("getInterestDetails()", async function () {
      const {usdxContracts, interestProvider} = await loadFixture(
        fixtureDeployed
      );

      let interestDetails = await interestProvider.callStatic.getInterestDetails();

      await printInterestDetails(interestDetails, usdxContracts);
    });

    it("withdrawInterest()", async function () {
      const {usdxContracts, interestProvider, owner} = await loadFixture(
        fixtureDeployed
      );

      let interest = await interestProvider.callStatic.getInterestAmount();
      let amount = interest;

      // BN.js => ethers.BigNumber
      let balanceBefore = BN.from(
        (await usdxContracts.usdxToken.balanceOf(owner._address)).toString()
      );

      console.log(
        "Before withdraw, account Balance:",
        ethers.utils.formatEther(balanceBefore),
        "interest:",
        ethers.utils.formatEther(interest)
      );

      console.log("Withdrawing ", ethers.utils.formatEther(amount));
      await interestProvider.withdrawInterest(amount);

      let balanceAfter = BN.from(
        (await usdxContracts.usdxToken.balanceOf(owner._address)).toString()
      );

      console.log(
        "After withdraw, account Balance:",
        ethers.utils.formatEther(balanceAfter),
        "interest:",
        ethers.utils.formatEther(
          await interestProvider.callStatic.getInterestAmount()
        )
      );

      expect(balanceAfter.sub(balanceBefore)).to.equal(amount);
    });
  });
});
