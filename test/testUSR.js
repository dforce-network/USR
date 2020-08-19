const { expect } = require("chai");
const { loadFixture } = require("ethereum-waffle");

const BN = ethers.BigNumber;

const UINT256_MAX = BN.from(2).pow(BN.from(256)).sub(BN.from(1)).toString(); // unit256(-1)
const BASE = ethers.utils.parseEther("1");

const MINT_SELECTOR = "0x40c10f19";
const BURN_SELECTOR = "0x9dc29fac";

async function fixtureMockProfitProvider([wallet, other], provider) {
  const [owner, ...accounts] = await ethers.getSigners();

  const USDx = await ethers.getContractFactory("USDx");
  const usdx = await USDx.deploy();
  await usdx.deployed();

  // console.log("USDx address:", usdx.address);

  const MockProfitProvider = await ethers.getContractFactory(
    "MockProfitProviderUSDx"
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

  await usdx.connect(funds).approve(profitProvider.address, UINT256_MAX);
  await usdx.transfer(funds._address, ethers.utils.parseEther("500000000"));

  expect(await usdx.balanceOf(funds._address)).to.equal(
    ethers.utils.parseEther("500000000").toString()
  );

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
      ethers.utils.parseEther("1000000000").toString()
    );

    expect(await usr.name()).to.equal("USR");
    expect(await usr.callStatic.exchangeRate()).to.equal(
      ethers.utils.parseEther("1.0").toString()
    );
  });

  describe("Exchange Rate", function () {
    it("Should be able to update exchange rate", async function () {
      const { usdx, usr } = await loadFixture(fixtureMockProfitProvider);

      let account = accounts[1];
      await usdx.transfer(account._address, ethers.utils.parseEther("10000"));
      await usdx.connect(account).approve(usr.address, UINT256_MAX);

      await usr
        .connect(account)
        .mint(account._address, ethers.utils.parseEther("1000"));

      // Mock some profit by direct transfer
      await usdx.transfer(usr.address, ethers.utils.parseEther("500"));

      expect(await usr.callStatic.exchangeRate()).to.equal(
        ethers.utils.parseEther("1.5").toString()
      );
    });
  });

  describe("Mint/Burn", function () {
    it("Should be able to mint/burn with mock profit provider", async function () {
      const { usdx, usr, profitProvider } = await loadFixture(
        fixtureMockProfitProvider
      );

      let account = accounts[1];
      await usr
        .connect(account)
        .mint(account._address, ethers.utils.parseEther("500"));

      // Mock some profit
      await usdx.transfer(
        await profitProvider.profitFunds(),
        ethers.utils.parseEther("500")
      );

      let exchangeRate = await usr.callStatic.exchangeRate();
      console.log(
        "Exchange Rate:",
        ethers.utils.formatEther(await usr.callStatic.exchangeRate())
      );

      let balancesBefore = {
        usr: await usr.balanceOf(account._address),
        usdx: await usdx.balanceOf(account._address),
      };

      console.log(
        "Account has",
        ethers.utils.formatEther(balancesBefore.usr),
        "USR",
        ethers.utils.formatEther(balancesBefore.usdx),
        "USDx"
      );

      await usr.connect(account).burn(account._address, balancesBefore.usr);

      let balancesAfter = {
        usr: await usr.balanceOf(account._address),
        usdx: await usdx.balanceOf(account._address),
      };

      console.log(
        "Account has",
        ethers.utils.formatEther(balancesAfter.usr),
        "USR",
        ethers.utils.formatEther(balancesAfter.usdx),
        "USDx"
      );

      let changed = {
        usr: balancesAfter.usr.sub(balancesBefore.usr),
        usdx: balancesAfter.usdx.sub(balancesBefore.usdx),
      };

      expect(
        exchangeRate
          .mul(changed.usr)
          .div(ethers.utils.parseEther("1"))
          .add(changed.usdx)
      ).to.equal(0);
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
      expect(await usr.originationFee(MINT_SELECTOR)).to.equal(fee.toString());

      let account = accounts[1];
      let balancesBefore = {
        usr: await usr.balanceOf(account._address),
        usdx: await usdx.balanceOf(account._address),
      };

      console.log(
        "Account has",
        ethers.utils.formatEther(balancesBefore.usr),
        "USR",
        ethers.utils.formatEther(balancesBefore.usdx),
        "USDx"
      );

      let exchangeRate = await usr.callStatic.exchangeRate();
      console.log(
        "Exchange Rate:",
        ethers.utils.formatEther(await usr.callStatic.exchangeRate())
      );

      await usr
        .connect(account)
        .mint(account._address, ethers.utils.parseEther("500"));

      let balancesAfter = {
        usr: await usr.balanceOf(account._address),
        usdx: await usdx.balanceOf(account._address),
      };

      console.log(
        "Account has",
        ethers.utils.formatEther(balancesAfter.usr),
        "USR",
        ethers.utils.formatEther(balancesAfter.usdx),
        "USDx"
      );

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
          .toString()
      ).to.equal(changed.usr.abs().toString());
    });

    it("Should be able to charge some fee when burn", async function () {
      const { usdx, usr, profitProvider } = await loadFixture(
        fixtureMockProfitProvider
      );

      let fee = ethers.utils.parseEther("0.05");
      await usr.updateOriginationFee(BURN_SELECTOR, fee);
      expect(await usr.originationFee(BURN_SELECTOR)).to.equal(fee.toString());

      let account = accounts[1];

      let exchangeRate = await usr.callStatic.exchangeRate();
      console.log(
        "Exchange Rate:",
        ethers.utils.formatEther(await usr.callStatic.exchangeRate())
      );

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

      await usr.connect(account).burn(account._address, balancesBefore.usr);

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
          .toString()
      ).to.equal(changed.usdx.abs().toString());
    });
  });
});
