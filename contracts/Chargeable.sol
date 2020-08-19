pragma solidity 0.5.12;

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";

import "./library/DSAuth.sol";

contract Chargeable is Initializable, DSAuth {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public token;
    address public feeRecipient;

    mapping(bytes4 => uint256) public originationFee;

    uint256 constant BASE = 10**18;

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
            _newOriginationFee < BASE,
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

    function chargeFee(
        bytes4 _sig,
        address _account,
        uint256 _amount
    ) internal returns (uint256) {
        uint256 _originationFee = originationFee[_sig];

        if (_originationFee == 0) {
            return _amount;
        }

        uint256 remaining = _amount.mul(BASE.sub(_originationFee)).div(BASE);

        if (_account == address(this)) {
            token.safeTransfer(feeRecipient, _amount.sub(remaining));
        } else {
            token.safeTransferFrom(
                _account,
                feeRecipient,
                _amount.sub(remaining)
            );
        }

        return remaining;
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

    uint256[50] private ______gap;
}
