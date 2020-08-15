pragma solidity 0.5.12;

import "@openzeppelin/contracts/token/ERC20/ERC20Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";

contract ERC20Exchangeable is ERC20Pausable, ERC20Detailed, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public underlyingToken;

    uint256 constant BASE = 10**18;

    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        address _underlyingToken
    ) public ERC20Detailed(_name, _symbol, _decimals) {
        underlyingToken = IERC20(_underlyingToken);
    }

    function mint(address account, uint256 amount)
        public
        whenNotPaused
        returns (bool)
    {
        underlyingToken.safeTransferFrom(msg.sender, address(this), amount);
        _mint(account, rdiv(amount, exchangeRate()));

        return true;
    }

    function burn(address account, uint256 amount)
        public
        whenNotPaused
        returns (bool)
    {
        _burn(account, amount);
        underlyingToken.safeTransfer(msg.sender, rmul(amount, exchangeRate()));

        return true;
    }

    function exchangeRate() public view returns (uint256) {
        uint256 totalSupply = totalSupply();
        return
            totalSupply > 0
                ? rdiv(underlyingToken.balanceOf(address(this)), totalSupply)
                : BASE;
    }

    // --- Math ---
    function rmul(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = x.mul(y) / BASE;
    }

    function rdiv(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = x.mul(BASE) / y;
    }

    function rdivup(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = x.mul(BASE).add(y.sub(1)) / y;
    }
}
