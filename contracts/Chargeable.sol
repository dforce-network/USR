pragma solidity 0.5.12;

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";

import "./library/DSAuth.sol";

contract Chargeable is Initializable, DSAuth {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public token;
    address feeRecipient;
    uint256 public originationFee;

    uint256 constant BASE = 10**18;

    event NewFeeReceipient(address oldfeeRecipient, address newfeeRecipient);
    event NewOriginationFee(
        uint256 oldOriginationFee,
        uint256 newOriginationFee
    );

    function initialize(address _token) public initializer {
        owner = msg.sender;
        token = IERC20(_token);
        feeRecipient = address(this);
    }

    function updateFeeRecipient(address _feeRecipient)
        external
        auth
        returns (bool)
    {
        address _oldFeeRecipient = feeRecipient;

        require(
            _oldFeeRecipient != _feeRecipient,
            "updateRecipient: same fee recipient address."
        );

        feeRecipient = _feeRecipient;
        emit NewFeeReceipient(_oldFeeRecipient, _feeRecipient);

        return true;
    }

    function updateOriginationFee(uint256 _newOriginationFee)
        external
        auth
        returns (bool)
    {
        require(
            _newOriginationFee < BASE / 10,
            "updateOriginationFee: fee should be less than ten percent."
        );

        uint256 _oldOriginationFee = originationFee;
        require(
            _oldOriginationFee != _newOriginationFee,
            "updateOriginationFee: same fee value."
        );

        originationFee = _newOriginationFee;
        emit NewOriginationFee(_oldOriginationFee, _newOriginationFee);

        return true;
    }

    function chargeFee(uint256 amount) internal returns (uint256) {
        if (originationFee == 0) {
            return amount;
        }

        uint256 remaining = amount.mul(BASE.sub(originationFee)).div(BASE);

        if (feeRecipient != address(this)) {
            token.safeTransfer(feeRecipient, amount.sub(remaining));
        }

        return remaining;
    }

    uint256[50] private ______gap;
}
