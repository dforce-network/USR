pragma solidity 0.5.12;

import './library/Pausable';
import './library/SafeMath';

contract LibNote {
    event LogNote(
        bytes4   indexed  sig,
        address  indexed  usr,
        bytes32  indexed  arg1,
        bytes32  indexed  arg2,
        bytes             data
    ) anonymous;

    modifier note {
        _;
        assembly {
            // log an 'anonymous' event with a constant 6 words of calldata
            // and four indexed topics: selector, caller, arg1 and arg2
            let mark := msize                         // end of memory ensures zero
            mstore(0x40, add(mark, 288))              // update free memory pointer
            mstore(mark, 0x20)                        // bytes type data offset
            mstore(add(mark, 0x20), 224)              // bytes size (padded)
            calldatacopy(add(mark, 0x40), 0, 224)     // bytes payload
            log4(mark, 288,                           // calldata
                 shl(224, shr(224, calldataload(0))), // msg.sig
                 caller,                              // msg.sender
                 calldataload(4),                     // arg1
                 calldataload(36)                     // arg2
                )
        }
    }
}

/// core.sol -- USDx Savings Rate

/*
   "Savings USDx" is obtained when USDx is deposited into
   this contract. Each "Savings USDx" accrues USDx interest
   at the "USDx Savings Rate".

   This contract does not implement a user tradeable token
   and is intended to be used with adapters.

         --- `save` your `USDx` in the `core` ---

   - `usr`: the USDx Savings Rate
   - `pie`: user balance of Savings USDx

   - `join`: start saving some USDx
   - `exit`: remove some USDx
   - `drip`: perform rate collection
*/

contract IERC20Token {
    function balanceOf(address account) external view returns (uint);
    function transfer(address recipient, uint amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint amount) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint value);
}

contract InterestModel {
    function getInterestRate() external view returns (uint);
}

contract Core is LibNote, Pausable {
    using SafeMath for uint;
    // --- Data ---
    mapping (address => uint) public pie;  // user Savings USDx
    bool private initialized;              // initialization data

    uint public Pie;  // total Savings USDx
    uint public chi;  // the Rate Accumulator

    uint public rho;  // time of last drip

    InterestModel public interestModel;
    IERC20Token public usdx;

    // --- Event ---
    event NewInterestModel(address indexed owner, address indexed InterestRate, address indexed oldInterestRate);

    // --- Init ---
    function initialize(address _interestModel, address _usdx) public {
        require(!initialized, "Core/already initialized");
        interestModel = InterestModel(_interestModel);
        usdx = IERC20Token(_usdx);
        owner = msg.sender;
        chi = ONE;
        rho = now;
        initialized = true;
    }

    /**
     * The constructor is used here to ensure that the implementation
     * contract is initialized. An uncontrolled implementation
     * contract might lead to misleading state
     * for users who accidentally interact with it.
     */
    constructor(address _interestModel, address _usdx) public {
        initialize(_interestModel, _usdx);
    }

    // --- Math ---
    uint constant ONE = 10 ** 27;
    function rpow(uint x, uint n, uint base) internal pure returns (uint z) {
        assembly {
            switch x case 0 {switch n case 0 {z := base} default {z := 0}}
            default {
                switch mod(n, 2) case 0 { z := base } default { z := x }
                let half := div(base, 2)  // for rounding.
                for { n := div(n, 2) } n { n := div(n,2) } {
                    let xx := mul(x, x)
                    if iszero(eq(div(xx, x), x)) { revert(0,0) }
                    let xxRound := add(xx, half)
                    if lt(xxRound, xx) { revert(0,0) }
                    x := div(xxRound, base)
                    if mod(n,2) {
                        let zx := mul(z, x)
                        if and(iszero(iszero(x)), iszero(eq(div(zx, x), z))) { revert(0,0) }
                        let zxRound := add(zx, half)
                        if lt(zxRound, zx) { revert(0,0) }
                        z := div(zxRound, base)
                    }
                }
            }
        }
    }

    function rmul(uint x, uint y) internal pure returns (uint z) {
        z = x.mul(y) / ONE;
    }

    // --- Administration ---
    function updateInterestModel(address newInterestModel) external note onlyOwner {
        require(newInterestModel != address(interestModel), "Core/same-interest-model-address");
        address _oldInterestModel = address(interestModel);
        interestModel = InterestModel(newInterestModel);
        emit NewInterestModel(msg.sender, newInterestModel, _oldInterestModel);
    }

    // --- Savings Rate Accumulation ---
    function drip() external note returns (uint tmp) {
        require(now >= rho, "Core/invalid-now");
        uint usr = interestModel.getInterestRate();
        tmp = rmul(rpow(usr, now - rho, ONE), chi);
        chi = tmp;
        rho = now;
    }

    // --- Savings USDx Management ---
    function join(uint usrAmount) external note whenNotPaused {
        require(now == rho, "Core/rho-not-updated");
        // TODO:
        uint usdxAmount = rmul(usrAmount, chi);
        usdx.transferFrom(msg.sender, address(this), usdxAmount);
        pie[msg.sender] = pie[msg.sender].add(usrAmount);
        Pie             = Pie.add(usrAmount);
    }

    function exit(uint usrAmount) external note whenNotPaused {
        require(now == rho, "Core/rho-not-updated");
        pie[msg.sender] = pie[msg.sender].sub(usrAmount);
        Pie             = Pie.sub(usrAmount);
        // TODO:
        uint usdxAmount = rmul(usrAmount, chi);
        usdx.transfer(msg.sender, usdxAmount);
    }

    function transferOut(address token, address recipient, uint amount) external onlyManager whenNotPaused returns (bool) {
        IERC20Token(token).transfer(recipient, amount);
        return true;
    }
}


