const {expect} = require("chai");
const {loadFixture} = require("ethereum-waffle");
const BN = ethers.BigNumber;

const {fixtureInterestProvider} = require("./helpers/fixtures.js");
const Collaterals = artifacts.require("Collaterals_t.sol");

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

describe("InterestProvider", function () {
  let owner, accounts;

  before(async () => {
    [owner, ...accounts] = await ethers.getSigners();
  });

  describe("deployment()", function () {
    it("Should be able to deploy basic contracts", async function () {
      const {usdx, usr} = await loadFixture(fixtureInterestProvider);
    });

    it("Should be able to get 0 as initial interest amount", async function () {
      const {interestProvider} = await loadFixture(fixtureInterestProvider);

      let interest = await interestProvider.callStatic.getInterestAmount();

      expect(interest).to.equal(0);
    });

    it("Should be able to get 0 as initial interest details", async function () {
      const {usdxContracts, interestProvider} = await loadFixture(
        fixtureInterestProvider
      );

      let interestDetails = await interestProvider.callStatic.getInterestDetails();

      await printInterestDetails(interestDetails, usdxContracts);
    });

    it("Should not be able to withdraw any interest", async function () {
      const {interestProvider} = await loadFixture(fixtureInterestProvider);
      await expect(interestProvider.withdrawInterest(1)).to.be.reverted;
    });
  });

  describe("Mock some interest", function () {
    before(async function () {
      const {usdxContracts, funds} = await loadFixture(fixtureInterestProvider);

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
      const {interestProvider} = await loadFixture(fixtureInterestProvider);

      let interest = await interestProvider.callStatic.getInterestAmount();

      //expect(interest).to.equal(0);
    });

    it("getInterestDetails()", async function () {
      const {usdxContracts, interestProvider} = await loadFixture(
        fixtureInterestProvider
      );

      let interestDetails = await interestProvider.callStatic.getInterestDetails();

      await printInterestDetails(interestDetails, usdxContracts);
    });

    it("withdrawInterest()", async function () {
      const {usdxContracts, interestProvider, owner} = await loadFixture(
        fixtureInterestProvider
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

  describe("setPool() & setFunds()", function () {
    it("setPool()", async function () {
      const {usdxContracts, interestProvider} = await loadFixture(
        fixtureInterestProvider
      );

      await expect(
        interestProvider.setPool(usdxContracts.poolV2.address)
      ).to.be.revertedWith(
        "setPool: dfPool can be not set to 0 or the current one."
      );

      await expect(
        interestProvider.setPool(ethers.constants.AddressZero)
      ).to.be.revertedWith(
        "setPool: dfPool can be not set to 0 or the current one."
      );

      await interestProvider.setPool(interestProvider.address);
      expect(await interestProvider.dfPool()).to.equal(
        interestProvider.address
      );

      // Restore back
      await interestProvider.setPool(usdxContracts.poolV2.address);
    });

    it("setFunds()", async function () {
      const {interestProvider, funds} = await loadFixture(
        fixtureInterestProvider
      );

      await expect(
        interestProvider.setFunds(ethers.constants.AddressZero)
      ).to.be.revertedWith(
        "setFunds: funds can be not set to 0 or the current one."
      );

      await expect(interestProvider.setFunds(funds.address)).to.be.revertedWith(
        "setFunds: funds can be not set to 0 or the current one."
      );

      await interestProvider.setFunds(interestProvider.address);
      expect(await interestProvider.funds()).to.equal(interestProvider.address);

      // Restore back
      await interestProvider.setFunds(funds.address);
    });
  });
});
