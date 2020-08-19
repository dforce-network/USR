pragma solidity ^0.5.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";

contract USDx is ERC20, ERC20Detailed {
    constructor() public ERC20Detailed("USDx", "USDx", 18) {
        _mint(_msgSender(), 1e27);
    }
}
