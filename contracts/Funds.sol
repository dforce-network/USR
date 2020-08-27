pragma solidity 0.5.12;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";

import "./library/DSAuth.sol";

contract Funds is DSAuth {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  function transferOut(
    address _token,
    address _to,
    uint256 _amount
  ) external auth {
    require(_to != address(0), "transferOut: address invalid.");
    IERC20(_token).safeTransfer(_to, _amount);
  }
}
