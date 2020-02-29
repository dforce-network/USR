pragma solidity 0.5.12;

contract Core {
    function chi() external returns (uint256);
    function rho() external returns (uint256);
    function drip() external returns (uint256);
    function join(uint256) external;
    function exit(uint256) external;
}

contract IERC20Token {
    function transfer(address _to, uint _value) public;
    function transferFrom(address _from, address _to, uint _value) public;
    function approve(address _spender, uint _value) public;
}

contract SafeToken {

    function doTransferOut(address _token, address _to, uint _amount) internal returns (bool) {
        IERC20Token token = IERC20Token(_token);
        bool result;

        token.transfer(_to, _amount);

        assembly {
            switch returndatasize()
                case 0 {
                    result := not(0)
                }
                case 32 {
                    returndatacopy(0, 0, 32)
                    result := mload(0)
                }
                default {
                    revert(0, 0)
                }
        }
        return result;
    }

    function doTransferFrom(address _token, address _from, address _to, uint _amount) internal returns (bool) {
        IERC20Token token = IERC20Token(_token);
        bool result;

        token.transferFrom(_from, _to, _amount);

        assembly {
            switch returndatasize()
                case 0 {
                    result := not(0)
                }
                case 32 {
                    returndatacopy(0, 0, 32)
                    result := mload(0)
                }
                default {
                    revert(0, 0)
                }
        }
        return result;
    }

    function doApprove(address _token, address _to, uint _amount) internal returns (bool) {
        IERC20Token token = IERC20Token(_token);
        bool result;

        token.approve(_to, _amount);

        assembly {
            switch returndatasize()
                case 0 {
                    result := not(0)
                }
                case 32 {
                    returndatacopy(0, 0, 32)
                    result := mload(0)
                }
                default {
                    revert(0, 0)
                }
        }
        return result;
    }
}

contract Auth {
    address public owner;
    address public newOwner;
    mapping(address => bool) public admin;

    event OwnerUpdate(address indexed owner, address indexed newOwner);
    event SetAdmin(address indexed owner, address indexed newAdmin);
    event CancelAdmin(address indexed owner, address indexed newAdmin);

    modifier onlyOwner() {
        require(msg.sender == owner, "non-owner");
        _;
    }

    modifier isAdmin() {
        require(admin[msg.sender], "non-admin");
        _;
    }

    function transferOwnership(address newOwner_) external onlyOwner {
        require(newOwner_ != owner, "TransferOwnership: the same owner.");
        newOwner = newOwner_;
    }

    function acceptOwnership() external {
        require(msg.sender == newOwner, "AcceptOwnership: only new owner do this.");
        emit OwnerUpdate(owner, newOwner);
        owner = newOwner;
        newOwner = address(0x0);
    }

    function setAdmin(address _admin) external onlyOwner {
        require(_admin != address(0), "setAdmin: _admin cannot be a zero address.");
        require(!admin[_admin], "setAdmin: Already an admin address.");
        admin[_admin] = true;
        emit SetAdmin(owner, _admin);
    }

    function cancelAdmin(address _admin) external onlyOwner {
        require(_admin != address(0), "setAdmin: _admin cannot be a zero address.");
        require(admin[_admin], "setAdmin: Not an admin address.");
        admin[_admin] = false;
        emit CancelAdmin(owner, _admin);
    }
}

contract RRR is Auth, SafeToken {
    using SafeMath for uint;

    // --- Data ---
    address public token;
    Core public core;

    // --- ERC20 Data ---
    string  public constant name     = "RRR";
    string  public constant symbol   = "RRR";
    string  public constant version  = "1";
    uint8   public constant decimals = 18;
    uint256 public totalSupply;

    mapping (address => uint)                      public balanceOf;
    mapping (address => mapping (address => uint)) public allowance;
    mapping (address => uint)                      public nonces;

    event Approval(address indexed src, address indexed guy, uint wad);
    event Transfer(address indexed src, address indexed dst, uint wad);

    event SetToken(address indexed owner, address indexed newToken, address indexed oldToken);
    event SetCore(address indexed owner, address indexed newCore, address indexed oldCore);

    constructor(address _token, address _core) public {

        owner = msg.sender;
        token = _token;
        core = Core(_core);
        doApprove(_token, _core, uint(-1));
    }

    function setToken(address _token) external onlyOwner {
        require(_token != address(0), "setToken: pot cannot be a zero address.");
        address _oldToken = token;
        require(_oldToken != _token, "setToken: The old and new addresses cannot be the same.");
        token = _token;
        doApprove(_oldToken, address(core), 0);
        emit SetToken(owner, _token, _oldToken);
    }

    function setCore(address _core) external onlyOwner {
        require(_core != address(0), "setCore: pot cannot be a zero address.");
        address _oldCore = address(core);
        require(_oldCore != _core, "setCore: The old and new addresses cannot be the same.");
        core = Core(_core);
        doApprove(token, _oldCore, 0);
        emit SetCore(owner, _core, _oldCore);
    }

    // --- Token ---
    function transfer(address dst, uint wad) external returns (bool) {
        return transferFrom(msg.sender, dst, wad);
    }
    // like transferFrom but Token-denominated
    function move(address src, address dst, uint wad) external returns (bool) {
        uint chi = (now > core.rho()) ? core.drip() : core.chi();
        // rounding up ensures dst gets at least wad Token
        return transferFrom(src, dst, wad.rdivup(chi));
    }
    function transferFrom(address src, address dst, uint wad)
        public returns (bool)
    {
        require(balanceOf[src] >= wad, "chai/insufficient-balance");
        if (src != msg.sender && allowance[src][msg.sender] != uint(-1)) {
            require(allowance[src][msg.sender] >= wad, "chai/insufficient-allowance");
            allowance[src][msg.sender] = allowance[src][msg.sender].sub(wad);
        }
        balanceOf[src] = balanceOf[src].sub(wad);
        balanceOf[dst] = balanceOf[src].add(wad);
        emit Transfer(src, dst, wad);
        return true;
    }
    function approve(address usr, uint wad) external returns (bool) {
        allowance[msg.sender][usr] = wad;
        emit Approval(msg.sender, usr, wad);
        return true;
    }

    function Token(address usr) external returns (uint wad) {
        uint chi = (now > core.rho()) ? core.drip() : core.chi();
        wad = chi.rmul(balanceOf[usr]);
    }
    // wad is denominated in Token
    function join(address dst, uint wad) external {
        uint chi = (now > core.rho()) ? core.drip() : core.chi();
        uint pie = wad.rdiv(chi);
        balanceOf[dst] = balanceOf[dst].add(pie);
        totalSupply = totalSupply.add(pie);

        doTransferFrom(token, msg.sender, address(this), wad);
        core.join(pie);
        emit Transfer(address(0), dst, pie);
    }

    // wad is denominated in (1/chi) * Token
    function exit(address src, uint wad) public {
        require(balanceOf[src] >= wad, "chai/insufficient-balance");
        if (src != msg.sender && allowance[src][msg.sender] != uint(-1)) {
            require(allowance[src][msg.sender] >= wad, "chai/insufficient-allowance");
            allowance[src][msg.sender] = allowance[src][msg.sender].sub(wad);
        }
        balanceOf[src] = balanceOf[src].sub(wad);
        totalSupply = totalSupply.sub(wad);

        uint chi = (now > core.rho()) ? core.drip() : core.chi();
        core.exit(wad);
        doTransferOut(token, msg.sender, wad.rmul(chi));
        emit Transfer(src, address(0), wad);
    }

    // wad is denominated in Token
    function draw(address src, uint wad) external {
        uint chi = (now > core.rho()) ? core.drip() : core.chi();
        // rounding up ensures usr gets at least wad Token
        exit(src, wad.rdivup(chi));
    }
}

library SafeMath {

    uint constant RAY = 10 ** 27;
    function add(uint x, uint y) internal pure returns (uint z) {
        require((z = x + y) >= x);
    }
    function sub(uint x, uint y) internal pure returns (uint z) {
        require((z = x - y) <= x);
    }
    function mul(uint x, uint y) internal pure returns (uint z) {
        require(y == 0 || (z = x * y) / y == x);
    }
    function rmul(uint x, uint y) internal pure returns (uint z) {
        // always rounds down
        z = mul(x, y) / RAY;
    }
    function rdiv(uint x, uint y) internal pure returns (uint z) {
        // always rounds down
        z = mul(x, RAY) / y;
    }
    function rdivup(uint x, uint y) internal pure returns (uint z) {
        // always rounds up
        z = add(mul(x, RAY), sub(y, 1)) / y;
    }
}