const { expect } = require("chai");
const { loadFixture } = require("ethereum-waffle");

const BN = require("bn.js");

const UINT256_MAX = new BN(2).pow(new BN(256)).sub(new BN(1)).toString(); // unit256(-1)

async function fixtureMockProfitProvider([wallet, other], provider) {
  const [owner, ...accounts] = await ethers.getSigners();

  const USDx = await ethers.getContractFactory("USDx");
  const usdx = await USDx.deploy();
  await usdx.deployed();

  // console.log("USDx address:", usdx.address);

  const MockProfitProvider = await ethers.getContractFactory(
    "MockProfitProviderUSDx"
  );

  // let accounts[0] to act as pool
  let pool = accounts[0];
  // console.log("pool address:", pool._address);

  const profitProvider = await MockProfitProvider.deploy(
    usdx.address,
    pool._address
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

  await usdx.connect(pool).approve(profitProvider.address, UINT256_MAX);
  await usdx.transfer(pool._address, ethers.utils.parseEther("500000000"));

  expect(await usdx.balanceOf(pool._address)).to.equal(
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
    expect(await usr.exchangeRate()).to.equal(
      ethers.utils.parseEther("1.0").toString()
    );
  });

  it("Should be able to update exchange rate", async function () {
    const { usdx, usr } = await loadFixture(fixtureMockProfitProvider);

    let account = accounts[1];
    await usdx.transfer(account._address, ethers.utils.parseEther("10000"));
    await usdx.connect(account).approve(usr.address, UINT256_MAX);

    await usr
      .connect(account)
      .mint(account._address, ethers.utils.parseEther("1000"));

    // Mock some profit by direct transfer
    await usdx.transfer(usr.address, ethers.utils.parseEther("400"));

    expect(await usr.exchangeRate()).to.equal(
      ethers.utils.parseEther("1.4").toString()
    );
  });

  it("Should be able to mint/burn with mock profit provider", async function () {
    const { usdx, usr, profitProvider } = await loadFixture(
      fixtureMockProfitProvider
    );

    let account = accounts[1];
    await usr
      .connect(account)
      .mint(account._address, ethers.utils.parseEther("500"));

    // Mock some profit
    await usdx.transfer(accounts[0]._address, ethers.utils.parseEther("500"));

    let exchangeRate = await usr.exchangeRate();
    console.log(
      "Exchange Rate:",
      ethers.utils.formatEther(await usr.exchangeRate())
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
