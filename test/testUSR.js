const {expect} = require("chai");
const BN = ethers.BigNumber;
const USRTruffle = artifacts.require("USR");

const {
  loadFixture,
  fixtureUSRWithMockInterestProvider,
  fixtureUSRWithInterestProvider,
} = require("./helpers/fixtures.js");

const BASE = ethers.utils.parseEther("1");
const MINT_SELECTOR = "0x40c10f19";
const REDEEM_SELECTOR = "0x1e9a6950";

function unifyBN(num) {
  return BN.from(num.toString());
}

describe("USR with Mock Interest Provider", function () {
  let owner, accounts;

  before(async () => {
    [owner, ...accounts] = await ethers.getSigners();
  });

  describe("Initializable", function () {
    it("Should be able to initialize", async function () {
      const {usr} = await loadFixture(fixtureUSRWithMockInterestProvider);
      expect(await usr.name()).to.equal("USR");
    });

    it("Should not be able to initialize again", async function () {
      const {usr, usdx, interestProvider, funds} = await loadFixture(
        fixtureUSRWithMockInterestProvider
      );

      await expect(
        usr.functions["initialize(address,address)"](
          usdx.address,
          interestProvider.address
        )
      ).to.be.revertedWith("Contract instance has already been initialized");

      // Try to initialize() all overloaded ones
      // const initializeFuncs = Object.entries(usr.functions).filter(([k, v]) =>
      //   k.startsWith("initialize(")
      // );

      // initializeFuncs.forEach(([k, v]) => {
      //   console.log(k, v);
      // });

      // Here are what we also have for now
      // initialize(string,string,uint8);
      // initialize();
      // initialize(string,string,address,address);
      // initialize(address);

      await expect(
        usr.functions["initialize(string,string,uint8)"]("USR", "USR", 18)
      ).to.be.revertedWith("Contract instance has already been initialized");

      await expect(usr.functions["initialize()"]()).to.be.revertedWith(
        "Contract instance has already been initialized"
      );

      await expect(
        usr.functions["initialize(string,string,address,address)"](
          "USR",
          "USR",
          usdx.address,
          funds._address // Here funds is an account
        )
      ).to.be.revertedWith("Contract instance has already been initialized");

      await expect(
        usr.functions["initialize(address)"](owner._address)
      ).to.be.revertedWith("Contract instance has already been initialized");
    });
  });

  describe("ERC20Pausable", function () {
    it("Should be able to pause", async function () {
      const {usr} = await loadFixture(fixtureUSRWithMockInterestProvider);

      let account = accounts[1];

      await usr
        .connect(account)
        .mint(account._address, ethers.utils.parseEther("1000"));

      await expect(usr.pause()).to.emit(usr, "Paused").withArgs(owner._address);

      await expect(
        usr
          .connect(account)
          .mint(account._address, ethers.utils.parseEther("100"))
      ).to.be.reverted;
      await expect(
        usr
          .connect(account)
          .redeem(account._address, ethers.utils.parseEther("100"))
      ).to.be.reverted;
      await expect(
        usr
          .connect(account)
          .redeemUnderlying(account._address, ethers.utils.parseEther("100"))
      ).to.be.reverted;
      await expect(
        usr
          .connect(account)
          .approve(accounts[2]._address, ethers.utils.parseEther("100"))
      ).to.be.reverted;
      await expect(
        usr
          .connect(account)
          .transfer(accounts[2]._address, ethers.utils.parseEther("100"))
      ).to.be.reverted;
    });

    it("Should be able to unpause ", async function () {
      const {usr} = await loadFixture(fixtureUSRWithMockInterestProvider);

      let account = accounts[1];

      await usr.pause();

      await expect(usr.unpause())
        .to.emit(usr, "Unpaused")
        .withArgs(owner._address);

      await usr
        .connect(account)
        .mint(account._address, ethers.utils.parseEther("500"));

      await usr
        .connect(account)
        .redeem(account._address, ethers.utils.parseEther("100"));

      await usr
        .connect(account)
        .redeemUnderlying(account._address, ethers.utils.parseEther("100"));

      await usr
        .connect(account)
        .approve(accounts[2]._address, ethers.utils.parseEther("100"));

      await usr
        .connect(account)
        .transfer(accounts[2]._address, ethers.utils.parseEther("100"));
    });
  });

  describe("Chargeable", function () {
    it("Should be able to update fee recipient", async function () {
      const {usdx, usr, interestProvider} = await loadFixture(
        fixtureUSRWithMockInterestProvider
      );

      let recipient = accounts[accounts.length - 1]._address;
      await usr.updateFeeRecipient(recipient);
      expect(await usr.feeRecipient()).to.equal(recipient);
    });

    it("Should be able to charge some fee when mint", async function () {
      const {usdx, usr, interestProvider} = await loadFixture(
        fixtureUSRWithMockInterestProvider
      );

      let fee = ethers.utils.parseEther("0.05");
      await usr.updateOriginationFee(MINT_SELECTOR, fee);
      expect(await usr.originationFee(MINT_SELECTOR)).to.equal(fee);

      let account = accounts[1];
      let balancesBefore = {
        usr: await usr.balanceOf(account._address),
        usdx: await usdx.balanceOf(account._address),
      };

      // console.log(
      //   "Account has",
      //   ethers.utils.formatEther(balancesBefore.usr),
      //   "USR",
      //   ethers.utils.formatEther(balancesBefore.usdx),
      //   "USDx"
      // );

      let exchangeRate = await usr.callStatic.exchangeRate();
      // console.log(
      //   "Exchange Rate:",
      //   ethers.utils.formatEther(await usr.callStatic.exchangeRate())
      // );

      await usr
        .connect(account)
        .mint(account._address, ethers.utils.parseEther("500"));

      let balancesAfter = {
        usr: await usr.balanceOf(account._address),
        usdx: await usdx.balanceOf(account._address),
      };

      // console.log(
      //   "Account has",
      //   ethers.utils.formatEther(balancesAfter.usr),
      //   "USR",
      //   ethers.utils.formatEther(balancesAfter.usdx),
      //   "USDx"
      // );

      let changed = {
        usr: balancesAfter.usr.sub(balancesBefore.usr),
        usdx: balancesAfter.usdx.sub(balancesBefore.usdx),
      };

      // usr = usdx * (BASE - fee)/BASE * BASE/exchangeRate
      expect(
        changed.usdx
          .mul(BASE.sub(fee))
          .div(BASE)
          .mul(BASE)
          .div(exchangeRate)
          .abs()
      ).to.equal(changed.usr.abs());
    });

    it("Should be able to charge some fee when redeem", async function () {
      const {usdx, usr, interestProvider} = await loadFixture(
        fixtureUSRWithMockInterestProvider
      );

      let fee = ethers.utils.parseEther("0.05");
      await usr.updateOriginationFee(REDEEM_SELECTOR, fee);
      expect(await usr.originationFee(REDEEM_SELECTOR)).to.equal(fee);

      let account = accounts[1];

      let exchangeRate = await usr.callStatic.exchangeRate();
      // console.log(
      //   "Exchange Rate:",
      //   ethers.utils.formatEther(await usr.callStatic.exchangeRate())
      // );

      let balancesBefore = {
        usr: await usr.balanceOf(account._address),
        usrUnderlying: await usr.callStatic.balanceOfUnderlying(
          account._address
        ),
        usdx: await usdx.balanceOf(account._address),
      };

      // console.log(
      //   "Account has",
      //   ethers.utils.formatEther(balancesBefore.usr),
      //   "USR",
      //   ethers.utils.formatEther(balancesBefore.usdx),
      //   "USDx"
      // );

      await usr.connect(account).redeem(account._address, balancesBefore.usr);

      let balancesAfter = {
        usr: await usr.balanceOf(account._address),
        usdx: await usdx.balanceOf(account._address),
      };

      // console.log(
      //   "Account has",
      //   ethers.utils.formatEther(balancesAfter.usr),
      //   "USR",
      //   ethers.utils.formatEther(balancesAfter.usdx),
      //   "USDx"
      // );

      let changed = {
        usr: balancesAfter.usr.sub(balancesBefore.usr),
        usdx: balancesAfter.usdx.sub(balancesBefore.usdx),
      };

      // usdx = usr * exchangeRate/BASE * (BASE - fee)/BASE
      expect(
        changed.usr
          .mul(exchangeRate)
          .div(BASE)
          .mul(BASE.sub(fee))
          .div(BASE)
          .abs()
      ).to.equal(changed.usdx.abs());

      // Also check balanceOfUnderlying
      expect(balancesBefore.usrUnderlying).to.equal(changed.usdx.abs());
    });

    it("Should be able to charge some fee when redeemUnderlying", async function () {
      const {usdx, usr, interestProvider} = await loadFixture(
        fixtureUSRWithMockInterestProvider
      );

      let account = accounts[1];

      let amount = ethers.utils.parseEther("500");

      await usr.connect(account).mint(account._address, amount);

      let fee = await usr.originationFee(REDEEM_SELECTOR);
      let exchangeRate = await usr.callStatic.exchangeRate();
      // console.log(
      //   "Exchange Rate:",
      //   ethers.utils.formatEther(await usr.callStatic.exchangeRate())
      // );

      let balancesBefore = {
        usr: await usr.balanceOf(account._address),
        usrUnderlying: await usr.callStatic.balanceOfUnderlying(
          account._address
        ),
        usdx: await usdx.balanceOf(account._address),
      };

      // console.log(
      //   "Account has",
      //   ethers.utils.formatEther(balancesBefore.usr),
      //   "USR",
      //   ethers.utils.formatEther(balancesBefore.usdx),
      //   "USDx"
      // );

      await usr
        .connect(account)
        .redeemUnderlying(account._address, balancesBefore.usrUnderlying);

      let balancesAfter = {
        usr: await usr.balanceOf(account._address),
        usdx: await usdx.balanceOf(account._address),
      };

      // console.log(
      //   "Account has",
      //   ethers.utils.formatEther(balancesAfter.usr),
      //   "USR",
      //   ethers.utils.formatEther(balancesAfter.usdx),
      //   "USDx"
      // );

      let changed = {
        usr: balancesAfter.usr.sub(balancesBefore.usr),
        usdx: balancesAfter.usdx.sub(balancesBefore.usdx),
      };

      // usdx = usr * exchangeRate/BASE * (BASE - fee)/BASE
      expect(
        changed.usr
          .mul(exchangeRate)
          .div(BASE)
          .mul(BASE.sub(fee))
          .div(BASE)
          .abs()
      ).to.equal(changed.usdx.abs());

      expect(changed.usdx).to.equal(balancesBefore.usrUnderlying);
    });
  });

  describe("ERC20Exchangeable", function () {
    it("Initial exchange rate should be 1.0", async function () {
      const {usr} = await loadFixture(fixtureUSRWithMockInterestProvider);

      expect(await usr.callStatic.exchangeRate()).to.equal(
        ethers.utils.parseEther("1.0")
      );
    });

    it("Should be able to update exchange rate", async function () {
      const {usdx, usr, funds} = await loadFixture(
        fixtureUSRWithMockInterestProvider
      );

      let account = accounts[1];

      let amount = ethers.utils.parseEther("1000");
      await usr.connect(account).mint(account._address, amount);

      // Mock some profit by direct transfer
      await usdx.transfer(funds._address, ethers.utils.parseEther("500"));

      expect(await usr.callStatic.exchangeRate()).to.equal(
        ethers.utils.parseEther("1.5")
      );
    });

    it("Should be able to get underlying balance", async function () {
      const {usdx, usr, funds} = await loadFixture(
        fixtureUSRWithMockInterestProvider
      );

      let account = accounts[1];

      let exchangeRate = await usr.callStatic.exchangeRate();
      // console.log(
      //   "Exchange Rate:",
      //   ethers.utils.formatEther(await usr.callStatic.exchangeRate())
      // );

      let balancesBefore = {
        usrUnderlying: await usr.callStatic.balanceOfUnderlying(
          account._address
        ),
        usdx: await usdx.balanceOf(account._address),
      };

      await usr
        .connect(account)
        .mint(account._address, ethers.utils.parseEther("500"));

      // Mock some profit by direct transfer
      await usdx.transfer(funds._address, ethers.utils.parseEther("500"));

      let balancesAfter = {
        usrUnderlying: await usr.callStatic.balanceOfUnderlying(
          account._address
        ),
        usdx: await usdx.balanceOf(account._address),
      };

      let changed = {
        usrUnderlying: balancesAfter.usrUnderlying.sub(
          balancesBefore.usrUnderlying
        ),
        usdx: balancesAfter.usdx.sub(balancesBefore.usdx),
      };

      // usrUnderlying = usdx
      // There could be some loss of underlying due to the precision
      let loss = changed.usdx.abs().sub(changed.usrUnderlying.abs());
      expect(loss.mul(BASE)).to.lte(exchangeRate);
    });
  });

  describe("Mint/Redeem/RedeemUnderlying", function () {
    it("Should not be able to mint < 0 when totalSupply is 0", async function () {
      const {usdx, usr, interestProvider} = await loadFixture(
        fixtureUSRWithMockInterestProvider
      );

      let account = accounts[1];
      let amount = ethers.utils.parseEther("0.85");
      await expect(
        usr.connect(account).mint(account._address, amount)
      ).to.be.revertedWith("The first mint amount is too small");
    });

    it("Should be able to mint", async function () {
      const {usdx, usr, funds} = await loadFixture(
        fixtureUSRWithMockInterestProvider
      );

      let account = accounts[1];

      let exchangeRate = await usr.callStatic.exchangeRate();
      // console.log(
      //   "Exchange Rate:",
      //   ethers.utils.formatEther(await usr.callStatic.exchangeRate())
      // );

      let balancesBefore = {
        usr: await usr.balanceOf(account._address),
        usdx: await usdx.balanceOf(account._address),
      };

      await usr
        .connect(account)
        .mint(account._address, ethers.utils.parseEther("500"));

      // console.log(
      //   "Account has",
      //   ethers.utils.formatEther(balancesBefore.usr),
      //   "USR",
      //   ethers.utils.formatEther(balancesBefore.usdx),
      //   "USDx"
      // );

      let balancesAfter = {
        usr: await usr.balanceOf(account._address),
        usdx: await usdx.balanceOf(account._address),
      };

      // console.log(
      //   "Account has",
      //   ethers.utils.formatEther(balancesAfter.usr),
      //   "USR",
      //   ethers.utils.formatEther(balancesAfter.usdx),
      //   "USDx"
      // );

      let changed = {
        usr: balancesAfter.usr.sub(balancesBefore.usr),
        usdx: balancesAfter.usdx.sub(balancesBefore.usdx),
      };

      // usr = usdx * BASE/exchangeRate
      expect(changed.usdx.mul(BASE).div(exchangeRate).abs()).to.equal(
        changed.usr.abs()
      );
    });

    it("Should be able to redeem", async function () {
      const {usdx, usr, funds} = await loadFixture(
        fixtureUSRWithMockInterestProvider
      );

      let account = accounts[1];

      let amount = ethers.utils.parseEther("500");
      await usr.connect(account).mint(account._address, amount);

      // Mock some profit by direct transfer
      await usdx.transfer(funds._address, ethers.utils.parseEther("500"));

      let exchangeRate = await usr.callStatic.exchangeRate();
      // console.log(
      //   "Exchange Rate:",
      //   ethers.utils.formatEther(await usr.callStatic.exchangeRate())
      // );

      let balancesBefore = {
        usr: await usr.balanceOf(account._address),
        usdx: await usdx.balanceOf(account._address),
      };

      // console.log(
      //   "Account has",
      //   ethers.utils.formatEther(balancesBefore.usr),
      //   "USR",
      //   ethers.utils.formatEther(balancesBefore.usdx),
      //   "USDx"
      // );

      await usr.connect(account).redeem(account._address, balancesBefore.usr);

      let balancesAfter = {
        usr: await usr.balanceOf(account._address),
        usdx: await usdx.balanceOf(account._address),
      };

      // console.log(
      //   "Account has",
      //   ethers.utils.formatEther(balancesAfter.usr),
      //   "USR",
      //   ethers.utils.formatEther(balancesAfter.usdx),
      //   "USDx"
      // );

      let changed = {
        usr: balancesAfter.usr.sub(balancesBefore.usr),
        usdx: balancesAfter.usdx.sub(balancesBefore.usdx),
      };

      // usdx = usr * exchangeRate/BASE
      expect(changed.usr.mul(exchangeRate).div(BASE).abs()).to.equal(
        changed.usdx.abs()
      );
    });

    it("Should be able to redeem from another account", async function () {
      const {usdx, usr, funds} = await loadFixture(
        fixtureUSRWithMockInterestProvider
      );

      let account = accounts[1];
      let from = accounts[2];

      let amount = ethers.utils.parseEther("500");

      await usr.connect(from).mint(from._address, amount);
      await usr.connect(from).approve(account._address, amount);

      // Mock some profit by direct transfer
      await usdx.transfer(funds._address, ethers.utils.parseEther("500"));

      let exchangeRate = await usr.callStatic.exchangeRate();
      // console.log(
      //   "Exchange Rate:",
      //   ethers.utils.formatEther(await usr.callStatic.exchangeRate())
      // );

      let balancesBefore = {
        usr: await usr.balanceOf(from._address),
        usdx: await usdx.balanceOf(account._address),
      };

      // console.log(
      //   "Account has",
      //   ethers.utils.formatEther(balancesBefore.usr),
      //   "USR",
      //   ethers.utils.formatEther(balancesBefore.usdx),
      //   "USDx"
      // );

      await usr.connect(account).redeem(from._address, balancesBefore.usr);

      let balancesAfter = {
        usr: await usr.balanceOf(from._address),
        usdx: await usdx.balanceOf(account._address),
      };

      // console.log(
      //   "Account has",
      //   ethers.utils.formatEther(balancesAfter.usr),
      //   "USR",
      //   ethers.utils.formatEther(balancesAfter.usdx),
      //   "USDx"
      // );

      let changed = {
        usr: balancesAfter.usr.sub(balancesBefore.usr),
        usdx: balancesAfter.usdx.sub(balancesBefore.usdx),
      };

      // usdx = usr * exchangeRate/BASE
      expect(changed.usr.mul(exchangeRate).div(BASE).abs()).to.equal(
        changed.usdx.abs()
      );
    });

    it("Should be able to redeemUnderlying", async function () {
      const {usdx, usr, funds} = await loadFixture(
        fixtureUSRWithMockInterestProvider
      );

      let account = accounts[1];
      let amount = ethers.utils.parseEther("500");

      await usr.connect(account).mint(account._address, amount);

      // Mock some profit by direct transfer
      await usdx.transfer(funds._address, ethers.utils.parseEther("500"));

      let exchangeRate = await usr.callStatic.exchangeRate();
      // console.log(
      //   "Exchange Rate:",
      //   ethers.utils.formatEther(await usr.callStatic.exchangeRate())
      // );

      let balancesBefore = {
        usr: await usr.balanceOf(account._address),
        usdx: await usdx.balanceOf(account._address),
      };

      // console.log(
      //   "Account has",
      //   ethers.utils.formatEther(balancesBefore.usr),
      //   "USR",
      //   ethers.utils.formatEther(balancesBefore.usdx),
      //   "USDx"
      // );

      await usr.connect(account).redeemUnderlying(account._address, amount);

      let balancesAfter = {
        usr: await usr.balanceOf(account._address),
        usdx: await usdx.balanceOf(account._address),
      };

      // console.log(
      //   "Account has",
      //   ethers.utils.formatEther(balancesAfter.usr),
      //   "USR",
      //   ethers.utils.formatEther(balancesAfter.usdx),
      //   "USDx"
      // );

      let changed = {
        usr: balancesAfter.usr.sub(balancesBefore.usr),
        usdx: balancesAfter.usdx.sub(balancesBefore.usdx),
      };

      // usdx = usr * exchangeRate/BASE
      expect(changed.usr.mul(exchangeRate).div(BASE).abs()).to.equal(
        changed.usdx.abs()
      );

      expect(changed.usdx.abs()).to.equal(amount);
    });

    it("Should be able to redeemUnderlying from another account", async function () {
      const {usdx, usr, funds} = await loadFixture(
        fixtureUSRWithMockInterestProvider
      );

      let account = accounts[1];
      let from = accounts[2];

      let amount = ethers.utils.parseEther("500");

      await usr.connect(from).mint(from._address, amount);
      await usr.connect(from).approve(account._address, amount);

      // Mock some profit by direct transfer
      await usdx.transfer(funds._address, ethers.utils.parseEther("500"));

      let exchangeRate = await usr.callStatic.exchangeRate();
      // console.log(
      //   "Exchange Rate:",
      //   ethers.utils.formatEther(await usr.callStatic.exchangeRate())
      // );

      let balancesBefore = {
        usr: await usr.balanceOf(from._address),
        usdx: await usdx.balanceOf(account._address),
      };

      // console.log(
      //   "Account has",
      //   ethers.utils.formatEther(balancesBefore.usr),
      //   "USR",
      //   ethers.utils.formatEther(balancesBefore.usdx),
      //   "USDx"
      // );

      await usr.connect(account).redeemUnderlying(from._address, amount);

      let balancesAfter = {
        usr: await usr.balanceOf(from._address),
        usdx: await usdx.balanceOf(account._address),
      };

      // console.log(
      //   "Account has",
      //   ethers.utils.formatEther(balancesAfter.usr),
      //   "USR",
      //   ethers.utils.formatEther(balancesAfter.usdx),
      //   "USDx"
      // );

      let changed = {
        usr: balancesAfter.usr.sub(balancesBefore.usr),
        usdx: balancesAfter.usdx.sub(balancesBefore.usdx),
      };

      // usdx = usr * exchangeRate/BASE
      expect(changed.usr.mul(exchangeRate).div(BASE).abs()).to.equal(
        changed.usdx.abs()
      );

      expect(changed.usdx.abs()).to.equal(amount);
    });
  });

  describe("Interest Provider", function () {
    it("updateInterestProvider()", async function () {
      const {usr, interestProvider} = await loadFixture(
        fixtureUSRWithMockInterestProvider
      );

      await expect(
        usr.updateInterestProvider(ethers.constants.AddressZero)
      ).to.be.revertedWith(
        "updateInterestProvider: interest provider can be not set to 0 or the current one."
      );

      await expect(
        usr.updateInterestProvider(interestProvider.address)
      ).to.be.revertedWith(
        "updateInterestProvider: interest provider can be not set to 0 or the current one."
      );

      await usr.updateInterestProvider(usr.address);
      expect(await usr.interestProvider()).to.equal(usr.address);

      // Restore back
      await usr.updateInterestProvider(interestProvider.address);
    });
  });
});

describe("USR with Real Interest Provider", function () {
  let owner, accounts;

  before(async () => {
    [owner, ...accounts] = await ethers.getSigners();
  });

  describe("ERC20Exchangeable", function () {
    it("Initial exchange rate should be 1.0", async function () {
      const {usr} = await loadFixture(fixtureUSRWithInterestProvider);

      //console.log(ethers.utils.formatEther(await usr.totalSupply()));

      expect(await usr.callStatic.exchangeRate()).to.equal(
        ethers.utils.parseEther("1.0")
      );
    });

    it("Should be able to update exchange rate", async function () {
      const {usdxContracts, usr} = await loadFixture(
        fixtureUSRWithInterestProvider
      );

      const usdx = usdxContracts.usdxToken;

      expect(await usr.callStatic.exchangeRate()).to.equal(
        ethers.utils.parseEther("1.0")
      );

      let account = accounts[1];

      let amount = ethers.utils.parseEther("1000");
      await usr.connect(account).mint(account._address, amount);

      // Mock some profit
      for (srcToken of usdxContracts.srcTokens) {
        let dTokenAddr = await usdxContracts.dTokenController.getDToken(
          srcToken.address
        );

        let decimals = await srcToken.decimals();
        let amount = BN.from(500).mul(BN.from(10).pow(decimals));

        await srcToken.transfer(dTokenAddr, amount);
      }

      // expect(await usr.callStatic.exchangeRate()).to.equal(
      //   ethers.utils.parseEther("1.5")
      // );
    });

    it("Should be able to get underlying balance", async function () {
      const {usdxContracts, usr, interestProvider} = await loadFixture(
        fixtureUSRWithInterestProvider
      );

      const usdx = usdxContracts.usdxToken;

      let account = accounts[1];

      let exchangeRate = await usr.callStatic.exchangeRate();
      // console.log(
      //   "Exchange Rate:",
      //   ethers.utils.formatEther(await usr.callStatic.exchangeRate())
      // );

      let balancesBefore = {
        usrUnderlying: await usr.callStatic.balanceOfUnderlying(
          account._address
        ),
        usdx: unifyBN(await usdx.balanceOf(account._address)),
      };

      await usr
        .connect(account)
        .mint(account._address, ethers.utils.parseEther("500"));

      let balancesAfter = {
        usrUnderlying: await usr.callStatic.balanceOfUnderlying(
          account._address
        ),
        usdx: unifyBN(await usdx.balanceOf(account._address)),
      };

      let changed = {
        usrUnderlying: balancesAfter.usrUnderlying.sub(
          balancesBefore.usrUnderlying
        ),
        usdx: balancesAfter.usdx.sub(balancesBefore.usdx),
      };

      // usrUnderlying = usdx
      // There could be some loss of underlying due to the precision
      let loss = changed.usdx.abs().sub(changed.usrUnderlying.abs());
      expect(loss.mul(BASE)).to.lte(exchangeRate);

      //console.log(balancesAfter.usrUnderlying.toString());
    });
  });

  describe("Mint/Redeem/RedeemUnderlying", function () {
    it("Should not be able to mint < 0 when totalSupply is 0", async function () {
      const {usdxContracts, usr, interestProvider} = await loadFixture(
        fixtureUSRWithInterestProvider
      );

      const usdx = usdxContracts.usdxToken;

      let account = accounts[1];
      let amount = ethers.utils.parseEther("0.85");
      await expect(
        usr.connect(account).mint(account._address, amount)
      ).to.be.revertedWith("The first mint amount is too small");
    });

    it("Should be able to mint", async function () {
      const {usdxContracts, usr, interestProvider} = await loadFixture(
        fixtureUSRWithInterestProvider
      );

      const usdx = usdxContracts.usdxToken;

      let account = accounts[1];

      let exchangeRate = await usr.callStatic.exchangeRate();
      // console.log(
      //   "Exchange Rate:",
      //   ethers.utils.formatEther(await usr.callStatic.exchangeRate())
      // );

      let balancesBefore = {
        usr: await usr.balanceOf(account._address),
        usdx: unifyBN(await usdx.balanceOf(account._address)),
      };

      await usr
        .connect(account)
        .mint(account._address, ethers.utils.parseEther("500"));

      // Mock some profit
      for (srcToken of usdxContracts.srcTokens) {
        let dTokenAddr = await usdxContracts.dTokenController.getDToken(
          srcToken.address
        );

        let decimals = await srcToken.decimals();
        let amount = BN.from(500).mul(BN.from(10).pow(decimals));

        await srcToken.transfer(dTokenAddr, amount);
      }

      // console.log(
      //   "Account has",
      //   ethers.utils.formatEther(balancesBefore.usr),
      //   "USR",
      //   ethers.utils.formatEther(balancesBefore.usdx),
      //   "USDx"
      // );

      let balancesAfter = {
        usr: await usr.balanceOf(account._address),
        usdx: unifyBN(await usdx.balanceOf(account._address)),
      };

      // console.log(
      //   "Account has",
      //   ethers.utils.formatEther(balancesAfter.usr),
      //   "USR",
      //   ethers.utils.formatEther(balancesAfter.usdx),
      //   "USDx"
      // );

      let changed = {
        usr: balancesAfter.usr.sub(balancesBefore.usr),
        usdx: balancesAfter.usdx.sub(balancesBefore.usdx),
      };

      // usr = usdx * BASE/exchangeRate
      expect(changed.usdx.mul(BASE).div(exchangeRate).abs()).to.equal(
        changed.usr.abs()
      );
    });

    it("Should be able to redeem", async function () {
      const {usdxContracts, usr, interestProvider} = await loadFixture(
        fixtureUSRWithInterestProvider
      );

      const usdx = usdxContracts.usdxToken;

      let account = accounts[1];

      let amount = ethers.utils.parseEther("500");
      await usr.connect(account).mint(account._address, amount);

      let exchangeRate = await usr.callStatic.exchangeRate();
      // console.log(
      //   "Exchange Rate:",
      //   ethers.utils.formatEther(await usr.callStatic.exchangeRate())
      // );

      let balancesBefore = {
        usr: await usr.balanceOf(account._address),
        usdx: unifyBN(await usdx.balanceOf(account._address)),
      };

      // console.log(
      //   "Account has",
      //   ethers.utils.formatEther(balancesBefore.usr),
      //   "USR",
      //   ethers.utils.formatEther(balancesBefore.usdx),
      //   "USDx"
      // );

      await usr.connect(account).redeem(account._address, balancesBefore.usr);

      let balancesAfter = {
        usr: await usr.balanceOf(account._address),
        usdx: unifyBN(await usdx.balanceOf(account._address)),
      };

      // console.log(
      //   "Account has",
      //   ethers.utils.formatEther(balancesAfter.usr),
      //   "USR",
      //   ethers.utils.formatEther(balancesAfter.usdx),
      //   "USDx"
      // );

      let changed = {
        usr: balancesAfter.usr.sub(balancesBefore.usr),
        usdx: balancesAfter.usdx.sub(balancesBefore.usdx),
      };

      // usdx = usr * exchangeRate/BASE
      expect(changed.usr.mul(exchangeRate).div(BASE).abs()).to.equal(
        changed.usdx.abs()
      );
    });

    it("Should be able to redeemUnderlying", async function () {
      const {usdxContracts, usr, interestProvider} = await loadFixture(
        fixtureUSRWithInterestProvider
      );

      const usdx = usdxContracts.usdxToken;

      let account = accounts[1];
      let amount = ethers.utils.parseEther("500");

      await usr.connect(account).mint(account._address, amount);

      let exchangeRate = await usr.callStatic.exchangeRate();
      // console.log(
      //   "Exchange Rate:",
      //   ethers.utils.formatEther(await usr.callStatic.exchangeRate())
      // );

      let balancesBefore = {
        usr: await usr.balanceOf(account._address),
        usdx: unifyBN(await usdx.balanceOf(account._address)),
      };

      // console.log(
      //   "Account has",
      //   ethers.utils.formatEther(balancesBefore.usr),
      //   "USR",
      //   ethers.utils.formatEther(balancesBefore.usdx),
      //   "USDx"
      // );

      await usr.connect(account).redeemUnderlying(account._address, amount);

      let balancesAfter = {
        usr: await usr.balanceOf(account._address),
        usdx: unifyBN(await usdx.balanceOf(account._address)),
      };

      // console.log(
      //   "Account has",
      //   ethers.utils.formatEther(balancesAfter.usr),
      //   "USR",
      //   ethers.utils.formatEther(balancesAfter.usdx),
      //   "USDx"
      // );

      let changed = {
        usr: balancesAfter.usr.sub(balancesBefore.usr),
        usdx: balancesAfter.usdx.sub(balancesBefore.usdx),
      };

      // usdx = usr * exchangeRate/BASE
      expect(changed.usr.mul(exchangeRate).div(BASE).abs()).to.equal(
        changed.usdx.abs()
      );

      expect(changed.usdx.abs()).to.equal(amount);
    });
  });
});
