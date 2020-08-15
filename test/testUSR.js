const { expect } = require("chai");

describe("ERC20Exchangeable", function () {
  let owner, accounts;
  let usdx, usr;

  before(async () => {
    [owner, accounts] = await ethers.getSigners();
  });

  it("Should be able to deploy basic contracts", async function () {
    const USDx = await ethers.getContractFactory("USDx");
    usdx = await USDx.deploy();

    //const USDx = await ethers.getContractFactory("ERC20Detailed");
    //const usdx = await USDx.deploy("USDx", "USDx", 18);

    await usdx.deployed();

    expect(await usdx.name()).to.equal("USDx");
    expect(await usdx.balanceOf(owner._address)).to.equal(
      "1000000000000000000000000000"
    );

    // let balance = await usdx.balanceOf(owner._address);
    // console.log("Balance of", owner._address, ":", balance.toString());

    const ERC20Exchangeable = await ethers.getContractFactory(
      "ERC20Exchangeable"
    );
    usr = await ERC20Exchangeable.deploy("USR", "USR", 18, usdx.address);

    await usr.deployed();
    expect(await usr.name()).to.equal("USR");
    expect(await usr.exchangeRate()).to.equal("1000000000000000000");

    // let exchangeRate = await usr.exchangeRate();
    // console.log("Initial Exchange Rate:", exchangeRate.toString());
  });

  it("Should be able to update exchange rate", async function () {
    await usdx.approve(usr.address, 1000e6);
    await usr.mint(owner._address, 1000e6);
    await usdx.transfer(usr.address, 500e6);

    expect(await usr.exchangeRate()).to.equal("1500000000000000000");
  });
});
