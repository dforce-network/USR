pragma solidity 0.5.12;

import "../interface/IProfitProvider.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "@nomiclabs/buidler/console.sol";

contract MockProfitProviderUSDx is IProfitProvider {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public USDx;
    address private pool;

    uint256 startingPoint;

    constructor(address _USDx, address _pool) public {
        USDx = IERC20(_USDx);
        pool = _pool;
    }

    function getProfitAmount() public view returns (uint256) {
        console.log(
            "pool balance %d, startingpoint %d",
            USDx.balanceOf(pool),
            startingPoint
        );
        return USDx.balanceOf(pool).sub(startingPoint);
    }

    /**
     * @dev When the total supply of token is 0, it needs to be called to reset the starting point.
     */
    function resetProfit() external {
        startingPoint = getProfitAmount();
    }

    /**
     * @dev Withdraw the interest generated by USDx.
     * @param _amount USDx withdrawal amount.
     * @return Withdraw USDx amount.
     */
    function withdrawProfit(uint256 _amount) external returns (uint256) {
        console.log("About to transfer %d from %s", _amount, address(USDx));
        USDx.safeTransferFrom(pool, msg.sender, _amount);

        return _amount;
    }
}
