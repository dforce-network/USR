const { expect } = require("chai");
const { loadFixture } = require("ethereum-waffle");

const BASE = ethers.utils.parseEther("1");
const MINT_SELECTOR = "0x40c10f19";
const REDEEM_SELECTOR = "0x1e9a6950";

async function fixtureMockProfitProvider([wallet, other], provider) {
  const [owner, ...accounts] = await ethers.getSigners();

  const USDx = await ethers.getContractFactory("USDx");
  const usdx = await USDx.deploy();
  await usdx.deployed();

  // console.log("USDx address:", usdx.address);

  const MockProfitProvider = await ethers.getContractFactory(
    "MockInterestProvider"
  );

  // let accounts[0] to act as funds
  let funds = accounts[0];
  // console.log("funds address:", funds._address);

  const profitProvider = await MockProfitProvider.deploy(
    usdx.address,
    funds._address
  );
  await profitProvider.deployed();

  // console.log("profitProvider address:", profitProvider.address);

  const USR = await ethers.getContractFactory("USR");
  const usr = await USR.deploy();
  await usr.deployed();

  // There are many initialize due to inheritance, use the full typed signature
  //console.log(usr.functions);
  await usr.functions["initialize(address,address)"](
    usdx.address,
    profitProvider.address
  );

  // console.log("USR address:", usr.address);

  await usdx
    .connect(funds)
    .approve(profitProvider.address, ethers.constants.MaxUint256);

  const initialInterest = ethers.utils.parseEther("500");
  await usdx.transfer(funds._address, initialInterest);

  expect(await usdx.balanceOf(funds._address)).to.equal(initialInterest);

  return { usdx, usr, profitProvider };
}

describe("USR", function () {
  let owner, accounts;

  before(async () => {
    [owner, ...accounts] = await ethers.getSigners();
  });

  it("Should be able to deploy basic contracts", async function () {
    const { usdx, usr } = await loadFixture(fixtureMockProfitProvider);

    expect(await usdx.name()).to.equal("USDx");
    expect(await usdx.totalSupply()).to.equal(
      ethers.utils.parseEther("1000000000")
    );

    expect(await usr.name()).to.equal("USR");
    expect(await usr.callStatic.exchangeRate()).to.equal(
      ethers.utils.parseEther("1.0")
    );
  });

  describe("Exchangeble", function () {
    it("Should be able to update exchange rate", async function () {
      const { usdx, usr } = await loadFixture(fixtureMockProfitProvider);

      let account = accounts[1];
      await usdx.transfer(account._address, ethers.utils.parseEther("10000"));
      await usdx
        .connect(account)
        .approve(usr.address, ethers.constants.MaxUint256);

      await usr
        .connect(account)
        .mint(account._address, ethers.utils.parseEther("1000"));

      // Mock some profit by direct transfer
      await usdx.transfer(usr.address, ethers.utils.parseEther("500"));

      // There are 500 initial interest in funds
      expect(await usr.callStatic.exchangeRate()).to.equal(
        ethers.utils.parseEther("2.0")
      );
    });
  });

  describe("Mint/Redeem/RedeemUnderlying", function () {
    it("Should be able to mint with mock profit provider", async function () {
      const { usdx, usr, profitProvider } = await loadFixture(
        fixtureMockProfitProvider
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
        await profitProvider.funds(),
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
      const { usdx, usr, profitProvider } = await loadFixture(
        fixtureMockProfitProvider
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
      const { usdx, usr, profitProvider } = await loadFixture(
        fixtureMockProfitProvider
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

  describe("Fee", function () {
    it("Should be able to update fee recipient", async function () {
      const { usdx, usr, profitProvider } = await loadFixture(
        fixtureMockProfitProvider
      );

      let recipient = accounts[accounts.length - 1]._address;
      await usr.updateFeeRecipient(recipient);
      expect(await usr.feeRecipient()).to.equal(recipient);
    });

    it("Should be able to charge some fee when mint", async function () {
      const { usdx, usr, profitProvider } = await loadFixture(
        fixtureMockProfitProvider
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
      const { usdx, usr, profitProvider } = await loadFixture(
        fixtureMockProfitProvider
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
    });

    it("Should be able to charge some fee when redeemUnderlying", async function () {
      const { usdx, usr, profitProvider } = await loadFixture(
        fixtureMockProfitProvider
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
        usdx: await usdx.balanceOf(account._address),
      };

      // console.log(
      //   "Account has",
      //   ethers.utils.formatEther(balancesBefore.usr),
      //   "USR",
      //   ethers.utils.formatEther(balancesBefore.usdx),
      //   "USDx"
      // );

      let redeemUnderlying = amount
        .mul(BASE.sub(await usr.originationFee(MINT_SELECTOR)))
        .div(BASE)
        .mul(BASE.sub(await usr.originationFee(REDEEM_SELECTOR)))
        .div(BASE);

      await usr
        .connect(account)
        .redeemUnderlying(account._address, redeemUnderlying);

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

      expect(changed.usdx).to.equal(redeemUnderlying);
    });
  });

  describe("Pause", function () {
    it("Should be able to pause", async function () {
      const { usdx, usr, profitProvider } = await loadFixture(
        fixtureMockProfitProvider
      );

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
      const { usdx, usr, profitProvider } = await loadFixture(
        fixtureMockProfitProvider
      );

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
    });
  });
});
