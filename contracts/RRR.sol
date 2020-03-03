pragma solidity 0.5.12;

import './library/ERC20SafeTransfer';
import './library/IERC20';
import './library/LibNote';
import './library/Pausable';

contract InterestModel {
    function getInterestRate() external view returns (uint);
}

/// RRR.sol -- USDx Savings Rate

/*
   "Savings USDx" is obtained when USDx is deposited into
   this contract. Each "Savings USDx" accrues USDx interest
   at the "USDx Savings Rate".

   This contract does not implement a user tradeable token
   and is intended to be used with adapters.

         --- `save` your `USDx` in the `RRR` ---

   - `usr`: the USDx Savings Rate
   - `pie`: user balance of Savings USDx

   - `join`: start saving some USDx
   - `exit`: remove some USDx
   - `drip`: perform rate collection
*/

contract RRR is LibNote, Pausable, ERC20SafeTransfer {
    using SafeMath for uint;
    // --- Data ---
    // initialization data
    bool private initialized;

    uint public chi;  // the Rate Accumulator
    uint public rho;  // time of last drip
    uint public originationFee;

    address public interestModel;
    address public token;

    // uint public Pie;  // total Savings USDx
    // mapping (address => uint) public pie;  // user Savings USDx

    // --- ERC20 Data ---
    string  public constant name     = "RRR";
    string  public constant symbol   = "RRR";
    string  public constant version  = "1";
    uint8   public constant decimals = 18;
    uint256 public totalSupply;

    mapping (address => uint)                      public balanceOf;
    mapping (address => mapping (address => uint)) public allowance;
    mapping (address => uint)                      public nonces;

    // --- Event ---
    event Approval(address indexed src, address indexed guy, uint wad);
    event Transfer(address indexed src, address indexed dst, uint wad);

    event SetToken(address indexed owner, address indexed newToken, address indexed oldToken);
    event NewInterestModel(address indexed owner, address indexed InterestRate, address indexed oldInterestRate);
    event NewOriginationFee(uint oldOriginationFeeMantissa, uint newOriginationFeeMantissa);

    /**
     * The constructor is used here to ensure that the implementation
     * contract is initialized. An uncontrolled implementation
     * contract might lead to misleading state
     * for users who accidentally interact with it.
     */
    constructor(address _interestModel, address _usdx, uint _originationFee) public {
        initialize(_interestModel, _usdx, _originationFee);
    }

    // --- Init ---
    function initialize(address _interestModel, address _token, uint _originationFee) public {
        require(!initialized, "initialize: already initialized.");
        interestModel = _interestModel;
        token = _token;
        owner = msg.sender;
        chi = ONE;
        rho = now;
        originationFee = _originationFee;
        initialized = true;

        emit NewInterestModel(msg.sender, _interestModel, address(0));
        emit SetToken(msg.sender, _token, address(0));
        emit NewOriginationFee(0, _originationFee);
    }

    // --- Administration ---
    function updateInterestModel(address _newInterestModel) external note onlyOwner {
        require(_newInterestModel != interestModel, "updateInterestModel: same interest model address.");
        address _oldInterestModel = interestModel;
        interestModel = _newInterestModel;
        emit NewInterestModel(msg.sender, _newInterestModel, _oldInterestModel);
    }

    function updateOriginationFee(uint _newOriginationFee) external onlyOwner returns (bool) {
        require(_newOriginationFee < ONE, "updateOriginationFee: fee should be less than ONE.");
        uint _oldOriginationFee = originationFee;
        originationFee = _newOriginationFee;
        emit NewOriginationFee(_oldOriginationFee, _newOriginationFee);

        return true;
    }

    function setToken(address _token) external onlyOwner {
        require(_token != address(0), "setToken: pot cannot be a zero address.");
        address _oldToken = token;
        require(_oldToken != _token, "setToken: The old and new addresses cannot be the same.");
        token = _token;
        emit SetToken(owner, _token, _oldToken);
    }

    function transferOut(address _token, address _recipient, uint _amount) external onlyManager whenNotPaused returns (bool) {
        IERC20(_token).transfer(_recipient, _amount);
        return true;
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
    function rdiv(uint x, uint y) internal pure returns (uint z) {
        z = x.mul(ONE) / y;
    }
    function rdivup(uint x, uint y) internal pure returns (uint z) {
        z = x.mul(ONE).add(y.sub(1)) / y;
    }

    // --- Savings Rate Accumulation ---
    function drip() public note returns (uint _tmp) {
        require(now >= rho, "drip: invalid now.");
        uint _usr = InterestModel(interestModel).getInterestRate();
        _tmp = rmul(rpow(_usr, now - rho, ONE), chi);
        chi = _tmp;
        rho = now;
    }

    // --- Savings USDx Management ---
    function join(address _dst, uint _wad) public note whenNotPaused  {
        require(now == rho, "join: rho not updated.");
        doTransferFrom(token, msg.sender, address(this), _wad);
        uint _pie = rdiv(_wad, chi);
        balanceOf[_dst] = balanceOf[_dst].add(_pie);
        totalSupply = totalSupply.add(_pie);
        emit Transfer(address(0), _dst, _pie);
    }

    function exit(address _src, uint _wad) public note whenNotPaused {
        require(now == rho, "exit: rho not updated.");
        require(balanceOf[_src] >= _wad, "exit: insufficient balance");
        if (_src != msg.sender && allowance[_src][msg.sender] != uint(-1)) {
            require(allowance[_src][msg.sender] >= _wad, "exit: insufficient allowance");
            allowance[_src][msg.sender] = allowance[_src][msg.sender].sub(_wad);
        }
        balanceOf[_src] = balanceOf[_src].sub(_wad);
        totalSupply = totalSupply.sub(_wad);
        uint earningWithoutFee = rmul(_wad, chi);

        doTransferOut(token, msg.sender, rmul(earningWithoutFee, ONE.sub(originationFee)));
        emit Transfer(_src, address(0), _wad);
    }

    // --- Token ---
    function transfer(address _dst, uint _wad) external returns (bool) {
        return transferFrom(msg.sender, _dst, _wad);
    }

    // like transferFrom but Token-denominated
    function move(address _src, address _dst, uint _wad) external returns (bool) {
        uint _chi = (now > rho) ? drip() : chi;
        // rounding up ensures _dst gets at least _wad Token
        return transferFrom(_src, _dst, rdivup(_wad, _chi));
    }

    function transferFrom(address _src, address _dst, uint _wad) public returns (bool)
    {
        require(balanceOf[_src] >= _wad, "transferFrom: insufficient balance");
        if (_src != msg.sender && allowance[_src][msg.sender] != uint(-1)) {
            require(allowance[_src][msg.sender] >= _wad, "transferFrom: insufficient allowance");
            allowance[_src][msg.sender] = allowance[_src][msg.sender].sub(_wad);
        }
        balanceOf[_src] = balanceOf[_src].sub(_wad);
        balanceOf[_dst] = balanceOf[_src].add(_wad);
        emit Transfer(_src, _dst, _wad);
        return true;
    }

    function approve(address usr, uint _wad) external returns (bool) {
        allowance[msg.sender][usr] = _wad;
        emit Approval(msg.sender, usr, _wad);
        return true;
    }

    function Token(address usr) external view returns (uint _wad) {
        uint _chi = rmul(rpow(InterestModel(interestModel).getInterestRate(), now - rho, ONE), chi);
        _wad = rmul(_chi, balanceOf[usr]);
    }

    function getExchangeRate() external view returns (uint) {
        return getFixedExchangeRate(now.sub(rho));
    }

    function getFixedExchangeRate(uint interval) public view returns (uint) {
        uint _scale = ONE;
        return rpow(InterestModel(interestModel).getInterestRate(), interval, _scale).mul(chi) / _scale;
    }

    // _wad is denominated in Token
    function mint(address _dst, uint _wad) external {
        if (now > rho)
            drip();

        join(_dst, _wad);
    }

    // _wad is denominated in (1/chi) * Token
    function burn(address _src, uint _wad) public {
        if (now > rho)
            drip();
        exit(_src, _wad);
    }

    // _wad is denominated in Token
    function draw(address _src, uint _wad) external {
        uint _chi = (now > rho) ? drip() : chi;
        // rounding up ensures usr gets at least _wad Token
        exit(_src, rdivup(_wad, _chi));
    }
}
