pragma solidity 0.5.12;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Pausable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";

import "./interface/IProfitProvider.sol";

contract ERC20Exchangeable is Initializable, ERC20Pausable, ERC20Detailed {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public underlyingToken;

    uint256 constant BASE = 10**18;

    function initialize(
        string memory _name,
        string memory _symbol,
        address _underlyingToken
    ) public initializer {
        ERC20Pausable.initialize(msg.sender);
        ERC20Detailed.initialize(
            _name,
            _symbol,
            ERC20Detailed(_underlyingToken).decimals()
        );
        underlyingToken = IERC20(_underlyingToken);
    }

    function mint(address account, uint256 amount)
        public
        whenNotPaused
        returns (bool)
    {
        _mint(account, rdiv(amount, exchangeRate()));
        underlyingToken.safeTransferFrom(msg.sender, address(this), amount);

        return true;
    }

    function burn(address account, uint256 amount)
        public
        whenNotPaused
        returns (bool)
    {
        uint256 underlying = rmul(amount, exchangeRate());

        if (account != msg.sender) {
            _burnFrom(account, amount);
        } else {
            _burn(account, amount);
        }

        underlyingToken.safeTransfer(msg.sender, underlying);

        return true;
    }

    function underlyingBalance() public view returns (uint256) {
        return underlyingToken.balanceOf(address(this));
    }

    function exchangeRate() public view returns (uint256) {
        uint256 totalSupply = totalSupply();
        return totalSupply > 0 ? rdiv(underlyingBalance(), totalSupply) : BASE;
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

contract USR is Initializable, ERC20Exchangeable, Ownable {
    using SafeERC20 for IERC20;

    IProfitProvider profitProvider;

    event NewProfitProvider(
        address oldProfitProvider,
        address NewProfitProvider
    );

    function initialize(address _underlyingToken, address _profitProvider)
        public
        initializer
    {
        ERC20Exchangeable.initialize("USR", "USR", _underlyingToken);
        Ownable.initialize(msg.sender);

        profitProvider = IProfitProvider(_profitProvider);
        emit NewProfitProvider(address(0), _profitProvider);
    }

    function updateProfitProvider(address _profitProvider)
        external
        onlyOwner
        returns (bool)
    {
        require(
            _profitProvider != _profitProvider,
            "updateProfitProvider: same profit provider address."
        );
        IProfitProvider _oldProfitProvider = profitProvider;
        profitProvider = IProfitProvider(_profitProvider);
        emit NewProfitProvider(address(_oldProfitProvider), _profitProvider);

        return true;
    }

    function underlyingBalance() public view returns (uint256) {
        return super.underlyingBalance().add(profitProvider.getProfitAmount());
    }

    function mint(address account, uint256 amount)
        public
        whenNotPaused
        returns (bool)
    {
        if (totalSupply() == 0) {
            profitProvider.resetProfit();
        }

        return super.mint(account, amount);
    }

    function burn(address account, uint256 amount)
        public
        whenNotPaused
        returns (bool)
    {
        uint256 target = rmul(amount, exchangeRate());
        uint256 balance = underlyingToken.balanceOf(address(this));

        // There is not enough balance here, need to withdraw from profit provider
        if (target > balance) {
            uint256 withdrawn = profitProvider.withdrawProfit(
                target.sub(balance)
            );

            require(
                withdrawn.add(balance) >= target,
                "burn: Not enough underlying token to withdraw"
            );
        }

        return super.burn(account, amount);
    }
}
