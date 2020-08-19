pragma solidity 0.5.12;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";

import "./ERC20Pausable.sol";
import "./Chargeable.sol";
import "./SafeRatioMath.sol";
import "./interface/IProfitProvider.sol";

contract ERC20Exchangeable is
    Initializable,
    ERC20Pausable,
    ERC20Detailed,
    Chargeable
{
    using SafeMath for uint256;
    using SafeRatioMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public underlyingToken;

    function initialize(
        string memory _name,
        string memory _symbol,
        address _underlyingToken,
        address _feeRecipient
    ) public initializer {
        ERC20Detailed.initialize(
            _name,
            _symbol,
            ERC20Detailed(_underlyingToken).decimals()
        );
        Chargeable.initialize(_underlyingToken, _feeRecipient);

        underlyingToken = IERC20(_underlyingToken);
    }

    function mint(address account, uint256 amount)
        public
        whenNotPaused
        returns (bool)
    {
        uint256 remaining = chargeFee(msg.sig, msg.sender, amount);

        _mint(account, remaining.rdiv(exchangeRate()));

        underlyingToken.safeTransferFrom(msg.sender, address(this), remaining);

        return true;
    }

    function burn(address account, uint256 amount)
        public
        whenNotPaused
        returns (bool)
    {
        uint256 underlying = amount.rmul(exchangeRate());

        if (account == msg.sender) {
            _burn(account, amount);
        } else {
            _burnFrom(account, amount);
        }

        uint256 remaining = chargeFee(msg.sig, address(this), underlying);
        underlyingToken.safeTransfer(msg.sender, remaining);

        return true;
    }

    function underlyingBalance() public returns (uint256) {
        return underlyingToken.balanceOf(address(this));
    }

    function exchangeRate() public returns (uint256) {
        uint256 totalSupply = totalSupply();
        return
            totalSupply > 0
                ? underlyingBalance().rdiv(totalSupply)
                : SafeRatioMath.base();
    }
}

contract USR is Initializable, DSAuth, ERC20Exchangeable {
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
        ERC20Exchangeable.initialize(
            "USR",
            "USR",
            _underlyingToken,
            IProfitProvider(_profitProvider).profitFunds()
        );

        owner = msg.sender;
        profitProvider = IProfitProvider(_profitProvider);
        emit NewProfitProvider(address(0), _profitProvider);
    }

    function updateProfitProvider(address _profitProvider)
        external
        auth
        returns (bool)
    {
        address _oldProfitProvider = address(profitProvider);

        require(
            _profitProvider != _oldProfitProvider,
            "updateProfitProvider: same profit provider address."
        );

        profitProvider = IProfitProvider(_profitProvider);
        emit NewProfitProvider(_oldProfitProvider, _profitProvider);

        return true;
    }

    function underlyingBalance() public returns (uint256) {
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
        uint256 target = amount.rmul(exchangeRate());
        uint256 balance = underlyingToken.balanceOf(address(this));

        // There is not enough balance here, need to withdraw from profit provider
        if (target > balance) {
            profitProvider.withdrawProfit(target.sub(balance));
        }

        return super.burn(account, amount);
    }
}
