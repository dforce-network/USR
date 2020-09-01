const {expect} = require("chai");
const {loadFixture} = require("ethereum-waffle");
const USRTruffle = artifacts.require("USR");

const BASE = ethers.utils.parseEther("1");
const MINT_SELECTOR = "0x40c10f19";
const REDEEM_SELECTOR = "0x1e9a6950";

async function fixtureDeployed([wallet, other], provider) {
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

  // const usrTruffle = await USRTruffle.at(usr.address);
  // console.log(usrTruffle.methods);

  // await usrTruffle.methods["initialize(address,address)"](
  //   usdx.address,
  //   interestProvider.address
  // );

  return {usdx, usr, interestProvider, funds};
}

async function fixtureInitialized([wallet, other], provider) {
  const [owner, ...accounts] = await ethers.getSigners();

  const {usdx, usr, interestProvider, funds} = await loadFixture(
    fixtureDeployed
  );

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

  return {usdx, usr, interestProvider, funds};
}

describe("USR", function () {
  let owner, accounts;

  before(async () => {
    [owner, ...accounts] = await ethers.getSigners();
  });

  describe("Initializable", async function () {
    it("Should be able to initialize", async function () {
      const {usr} = await loadFixture(fixtureInitialized);
      expect(await usr.name()).to.equal("USR");
    });

    it("Should not be able to initialize again", async function () {
      const {usr, usdx, interestProvider, funds} = await loadFixture(
        fixtureInitialized
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
      const {usr} = await loadFixture(fixtureInitialized);

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
      const {usr} = await loadFixture(fixtureInitialized);

      let account = accounts[1];
      await expect(usr.unpause())
        .to.emit(usr, "Unpaused")
        .withArgs(owner._address);

      await usr
        .connect(account)
        .mint(account._address, ethers.utils.parseEther("100"));

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

      await usr
        .connect(accounts[2])
        .transfer(account._address, ethers.utils.parseEther("100"));
    });
  });

  describe("Chargeable", function () {
    it("Should be able to update fee recipient", async function () {
      const {usdx, usr, interestProvider} = await loadFixture(
        fixtureInitialized
      );

      let recipient = accounts[accounts.length - 1]._address;
      await usr.updateFeeRecipient(recipient);
      expect(await usr.feeRecipient()).to.equal(recipient);
    });

    it("Should be able to charge some fee when mint", async function () {
      const {usdx, usr, interestProvider} = await loadFixture(
        fixtureInitialized
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
        fixtureInitialized
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
        fixtureInitialized
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

    it("Should be able to update fee to zero", async function () {
      const {usr} = await loadFixture(fixtureInitialized);
      await usr.updateOriginationFee(REDEEM_SELECTOR, 0);
      await usr.updateOriginationFee(MINT_SELECTOR, 0);
    });
  });

  describe("ERC20Exchangeable", function () {
    it("Initial exchange rate should be 1.0", async function () {
      const {usr} = await loadFixture(fixtureInitialized);

      //console.log(ethers.utils.formatEther(await usr.totalSupply()));

      expect(await usr.callStatic.exchangeRate()).to.equal(
        ethers.utils.parseEther("1.0")
      );
    });

    it("Should be able to update exchange rate", async function () {
      const {usdx, usr, interestProvider} = await loadFixture(
        fixtureInitialized
      );

      expect(await usr.callStatic.exchangeRate()).to.equal(
        ethers.utils.parseEther("1.0")
      );

      let account = accounts[1];

      let amount = ethers.utils.parseEther("1000");
      await usr.connect(account).mint(account._address, amount);

      // Mock some profit by direct transfer
      await usdx.transfer(usr.address, ethers.utils.parseEther("500"));

      expect(await usr.callStatic.exchangeRate()).to.equal(
        ethers.utils.parseEther("1.5")
      );

      // await usr
      //   .connect(account)
      //   .redeem(account._address, await usr.balanceOf(account._address));
    });

    it("Should be able to get underlying balance", async function () {
      const {usdx, usr, interestProvider} = await loadFixture(
        fixtureInitialized
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

      // Restore the original state
      await usr
        .connect(account)
        .redeemUnderlying(account._address, balancesAfter.usrUnderlying);
    });
  });

  describe("Mint/Redeem/RedeemUnderlying", function () {
    it("Should not be able to mint < 0 when totalSupply is 0", async function () {
      const {usdx, usr, interestProvider} = await loadFixture(
        fixtureInitialized
      );

      let account = accounts[1];
      let amount = ethers.utils.parseEther("0.85");
      await expect(
        usr.connect(account).mint(account._address, amount)
      ).to.be.revertedWith("The first mint amount is too small");
    });

    it("Should be able to mint with mock profit provider", async function () {
      const {usdx, usr, interestProvider} = await loadFixture(
        fixtureInitialized
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

      // Mock some profit
      await usdx.transfer(
        await interestProvider.funds(),
        ethers.utils.parseEther("500")
      );

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

    it("Should be able to redeem with mock profit provider", async function () {
      const {usdx, usr, interestProvider} = await loadFixture(
        fixtureInitialized
      );

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

    it("Should be able to redeemUnderlying with mock profit provider", async function () {
      const {usdx, usr, interestProvider} = await loadFixture(
        fixtureInitialized
      );

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
  });
});
