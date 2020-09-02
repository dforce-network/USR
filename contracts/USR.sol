pragma solidity 0.5.12;

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/ReentrancyGuard.sol";

import "./library/ERC20Pausable.sol";
import "./library/SafeRatioMath.sol";
import "./Chargeable.sol";
import "./interface/IInterestProvider.sol";

contract ERC20Exchangeable is
    Initializable,
    ReentrancyGuard,
    ERC20Pausable,
    ERC20Detailed,
    Chargeable
{
    using SafeMath for uint256;
    using SafeRatioMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public underlyingToken;

    event Mint(
        address indexed account,
        uint256 indexed underlying,
        uint256 amount,
        uint256 totalSupply,
        uint256 exchangeRate
    );

    event Redeem(
        address indexed account,
        uint256 indexed underlying,
        uint256 amount,
        uint256 totalSupply,
        uint256 exchangeRate
    );

    function initialize(
        string memory _name,
        string memory _symbol,
        address _underlyingToken,
        address _feeRecipient
    ) public initializer {
        ReentrancyGuard.initialize();
        ERC20Pausable.initialize(msg.sender);
        ERC20Detailed.initialize(
            _name,
            _symbol,
            ERC20Detailed(_underlyingToken).decimals()
        );
        Chargeable.initialize(_underlyingToken, _feeRecipient);

        underlyingToken = IERC20(_underlyingToken);
    }

    function checkMint(uint256 amount) internal {}

    function checkRedeem(uint256 amount) internal {}

    function mint(address account, uint256 underlying)
        public
        whenNotPaused
        nonReentrant
        returns (bool)
    {
        // Allow sub contract to do something
        checkMint(underlying);

        uint256 remaining = chargeFee(msg.sig, msg.sender, underlying);
        uint256 exchangeRate = exchangeRate();
        uint256 amount = remaining.rdiv(exchangeRate);

        _mint(account, amount);

        underlyingToken.safeTransferFrom(msg.sender, address(this), remaining);

        emit Mint(account, underlying, amount, totalSupply(), exchangeRate);

        return true;
    }

    function redeem(address account, uint256 amount)
        public
        whenNotPaused
        nonReentrant
        returns (bool)
    {
        uint256 exchangeRate = exchangeRate();
        uint256 underlying = amount.rmul(exchangeRate);

        if (account == msg.sender) {
            _burn(account, amount);
        } else {
            _burnFrom(account, amount);
        }

        // Allow sub contract to do something
        checkRedeem(underlying);

        uint256 remaining = chargeFee(msg.sig, address(this), underlying);
        underlyingToken.safeTransfer(msg.sender, remaining);

        emit Redeem(account, underlying, amount, totalSupply(), exchangeRate);

        return true;
    }

    function redeemUnderlying(address account, uint256 underlying)
        public
        whenNotPaused
        nonReentrant
        returns (bool)
    {
        uint256 fee = calcAdditionalFee(this.redeem.selector, underlying);
        uint256 underlyingWithFee = underlying.add(fee);
        uint256 exchangeRate = exchangeRate();
        uint256 amount = underlyingWithFee.rdivup(exchangeRate);

        if (account == msg.sender) {
            _burn(account, amount);
        } else {
            _burnFrom(account, amount);
        }

        // Allow sub contract to do something
        checkRedeem(underlyingWithFee);

        transferFee(address(this), fee);
        underlyingToken.safeTransfer(msg.sender, underlying);

        emit Redeem(
            account,
            underlyingWithFee,
            amount,
            totalSupply(),
            exchangeRate
        );

        return true;
    }

    function totalUnderlying() public returns (uint256) {
        return underlyingToken.balanceOf(address(this));
    }

    function exchangeRate() public returns (uint256) {
        uint256 totalSupply = totalSupply();
        return
            totalSupply > 0
                ? totalUnderlying().rdiv(totalSupply)
                : SafeRatioMath.base();
    }

    function balanceOfUnderlying(address account) public returns (uint256) {
        uint256 underlying = balanceOf(account).rmul(exchangeRate());

        // Need to take account of fee
        uint256 fee = calcFee(this.redeem.selector, underlying);

        return underlying.sub(fee);
    }

    uint256[50] private ______gap;
}

contract USR is Initializable, DSAuth, ERC20Exchangeable {
    using SafeERC20 for IERC20;

    IInterestProvider public interestProvider;

    event NewInterestProvider(
        address oldInterestProvider,
        address NewInterestProvider
    );

    function initialize(address _underlyingToken, address _interestProvider)
        public
        initializer
    {
        ERC20Exchangeable.initialize(
            "USR",
            "USR",
            _underlyingToken,
            IInterestProvider(_interestProvider).funds()
        );

        owner = msg.sender;
        interestProvider = IInterestProvider(_interestProvider);
        emit NewInterestProvider(address(0), _interestProvider);
    }

    function updateInterestProvider(address _interestProvider)
        external
        auth
        returns (bool)
    {
        address _oldInterestProvider = address(interestProvider);

        require(
            _interestProvider != address(0) &&
                _interestProvider != _oldInterestProvider,
            "updateInterestProvider: interest provider can be not set to 0 or the current one."
        );

        interestProvider = IInterestProvider(_interestProvider);
        emit NewInterestProvider(_oldInterestProvider, _interestProvider);

        return true;
    }

    function totalUnderlying() public returns (uint256) {
        return
            super.totalUnderlying().add(interestProvider.getInterestAmount());
    }

    function checkMint(uint256 amount) internal {
        if (totalSupply() == 0) {
            require(
                amount >= SafeRatioMath.base(),
                "The first mint amount is too small."
            );
        }
    }

    function checkRedeem(uint256 amount) internal {
        uint256 balance = underlyingToken.balanceOf(address(this));

        //There is not enough balance here, need to withdraw from interest provider
        if (amount > balance) {
            interestProvider.withdrawInterest(amount.sub(balance));
        }
    }
}
