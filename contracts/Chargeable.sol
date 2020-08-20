pragma solidity 0.5.12;

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";

import "./library/DSAuth.sol";
import "./library/SafeRatioMath.sol";

contract Chargeable is Initializable, DSAuth {
    using SafeMath for uint256;
    using SafeRatioMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public token;
    address public feeRecipient;

    mapping(bytes4 => uint256) public originationFee;

    event NewFeeReceipient(address oldfeeRecipient, address newfeeRecipient);
    event NewOriginationFee(
        bytes4 sig,
        uint256 oldOriginationFee,
        uint256 newOriginationFee
    );

    function initialize(address _token, address _feeRecipient)
        public
        initializer
    {
        owner = msg.sender;
        token = IERC20(_token);
        feeRecipient = _feeRecipient;
    }

    function updateFeeRecipient(address _feeRecipient)
        external
        auth
        returns (bool)
    {
        require(
            _feeRecipient != address(0) && _feeRecipient != address(this),
            "updateRecipient: incorrect fee recipient address."
        );

        address _oldFeeRecipient = feeRecipient;

        require(
            _oldFeeRecipient != _feeRecipient,
            "updateRecipient: same fee recipient address."
        );

        feeRecipient = _feeRecipient;
        emit NewFeeReceipient(_oldFeeRecipient, _feeRecipient);

        return true;
    }

    function updateOriginationFee(bytes4 _sig, uint256 _newOriginationFee)
        external
        auth
    {
        require(
            _newOriginationFee < SafeRatioMath.base(),
            "updateOriginationFee: incorrect fee."
        );
        uint256 _oldOriginationFee = originationFee[_sig];
        require(
            _oldOriginationFee != _newOriginationFee,
            "updateOriginationFee: fee has already set to this value."
        );

        originationFee[_sig] = _newOriginationFee;
        emit NewOriginationFee(_sig, _oldOriginationFee, _newOriginationFee);
    }

    function calcAdditionalFee(bytes4 _sig, uint256 _amount)
        internal
        view
        returns (uint256)
    {
        uint256 _originationFee = originationFee[_sig];
        return
            _amount.rdivup(SafeRatioMath.base().sub(_originationFee)).sub(
                _amount
            );
    }

    function transferFee(address _account, uint256 _amount) internal {
        if (_account == address(this)) {
            token.safeTransfer(feeRecipient, _amount);
        } else {
            token.safeTransferFrom(_account, feeRecipient, _amount);
        }
    }

    function chargeFee(
        bytes4 _sig,
        address _account,
        uint256 _amount
    ) internal returns (uint256) {
        uint256 _originationFee = originationFee[_sig];

        if (_originationFee == 0) {
            return _amount;
        }

        uint256 remaining = _amount.rmul(
            SafeRatioMath.base().sub(_originationFee)
        );

        transferFee(_account, _amount.sub(remaining));

        return remaining;
    }

    uint256[50] private ______gap;
}
