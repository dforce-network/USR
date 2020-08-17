pragma solidity 0.5.12;

contract DSAuthority {
    function canCall(
        address src,
        address dst,
        bytes4 sig
    ) public view returns (bool);
}

contract DSAuthEvents {
    event LogSetAuthority(address indexed authority);
    event LogSetOwner(address indexed owner);
    event OwnerUpdate(address indexed owner, address indexed newOwner);
}

contract DSAuth is DSAuthEvents {
    DSAuthority public authority;
    address public owner;
    address public newOwner;

    constructor() public {
        owner = msg.sender;
        emit LogSetOwner(msg.sender);
    }

    // Warning: you should absolutely sure you want to give up authority!!!
    function disableOwnership() public onlyOwner {
        owner = address(0);
        emit OwnerUpdate(msg.sender, owner);
    }

    function transferOwnership(address newOwner_) public onlyOwner {
        require(newOwner_ != owner, "TransferOwnership: the same owner.");
        newOwner = newOwner_;
    }

    function acceptOwnership() public {
        require(
            msg.sender == newOwner,
            "AcceptOwnership: only new owner do this."
        );
        emit OwnerUpdate(owner, newOwner);
        owner = newOwner;
        newOwner = address(0x0);
    }

    ///[snow] guard is Authority who inherit DSAuth.
    function setAuthority(DSAuthority authority_) public onlyOwner {
        authority = authority_;
        emit LogSetAuthority(address(authority));
    }

    modifier onlyOwner {
        require(isOwner(msg.sender), "ds-auth-non-owner");
        _;
    }

    function isOwner(address src) internal view returns (bool) {
        return bool(src == owner);
    }

    modifier auth {
        require(isAuthorized(msg.sender, msg.sig), "ds-auth-unauthorized");
        _;
    }

    function isAuthorized(address src, bytes4 sig)
        internal
        view
        returns (bool)
    {
        if (src == address(this)) {
            return true;
        } else if (src == owner) {
            return true;
        } else if (authority == DSAuthority(0)) {
            return false;
        } else {
            return authority.canCall(src, address(this), sig);
        }
    }
}

library SafeMath {
    function add(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require((z = x + y) >= x, "ds-math-add-overflow");
    }

    function sub(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require((z = x - y) <= x, "ds-math-sub-underflow");
    }

    function mul(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require(y == 0 || (z = x * y) / y == x, "ds-math-mul-overflow");
    }

    function div(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require(y > 0, "ds-math-div-overflow");
        z = x / y;
    }
}

contract DistributionMap is DSAuth {
    using SafeMath for uint256;

    /**
     * @dev List all recipients contract address.
     */
    address[] public recipients;

    /**
     * @dev Deposit ratio of each recipients contract.
     *      Notice: the sum of all deposit ratio should be 1000000.
     */
    mapping(address => uint256) public proportions;

    uint256 public constant totalProportion = 1000000;
    uint256 public baseProportion;

    /**
     * @dev map: handlerAddress -> true/false,
     *      Whether the recipients has been added or not.
     */
    mapping(address => bool) public isRecipientActive;


    /************************/
    /*** Admin Operations ***/
    /************************/

    /**
     * @dev Replace current recipients with _recipients and corresponding _proportions,
     * @param _recipients The list of new recipients, the 1st one will act as default hanlder.
     * @param _proportions The list of corresponding proportions.
     */
    function setRecipients(
        address[] memory _recipients,
        uint256[] memory _proportions
    ) internal {
        require(
            _recipients.length == _proportions.length && _recipients.length > 0,
            "setRecipients: recipients & proportions should not have 0 or different lengths"
        );

        uint256 _sum = 0;
        for (uint256 i = 0; i < _recipients.length; i++) {
            require(
                _recipients[i] != address(0),
                "setRecipients: recipients address invalid"
            );

            // Do not allow to set the same recipients twice
            require(
                !isRecipientActive[_recipients[i]],
                "setRecipients: recipients address already exists"
            );

            _sum = _sum.add(_proportions[i]);

            recipients.push(_recipients[i]);
            proportions[_recipients[i]] = _proportions[i];
            isRecipientActive[_recipients[i]] = true;
        }

        // The sum of proportions should be 1000000.
        require(
            _sum.add(baseProportion) == totalProportion,
            "the sum of proportions must be 1000000"
        );
    }

    /**
     * @dev Update proportions of the recipients.
     * @param _recipients List of the recipients to update.
     * @param _proportions List of the corresponding proportions to update.
     */
    function updateProportions(
        address[] calldata _recipients,
        uint256[] calldata _proportions
    ) external auth {
        require(
            _recipients.length == _proportions.length &&
                recipients.length == _proportions.length,
            "updateProportions: recipients & proportions must match the current length"
        );

        uint256 _sum = 0;
        for (uint256 i = 0; i < _proportions.length; i++) {
            for (uint256 j = 0; j < i; j++) {
                require(
                    _recipients[i] != _recipients[j],
                    "updateProportions: input recipients contract address is duplicate"
                );
            }
            require(
                isRecipientActive[_recipients[i]],
                "updateProportions: the recipients contract address does not exist"
            );
            _sum = _sum.add(_proportions[i]);

            proportions[_recipients[i]] = _proportions[i];
        }

        // The sum of `proportions` should be 1000000.
        require(
            _sum.add(baseProportion) == totalProportion,
            "the sum of proportions must be 1000000"
        );
    }

    /**
     * @dev Add new recipients.
     *      Notice: the corresponding proportion of the new recipients is 0.
     * @param _recipients List of the new recipients to add.
     */
    function addRecipients(address[] calldata _recipients) external auth {
        for (uint256 i = 0; i < _recipients.length; i++) {
            require(
                !isRecipientActive[_recipients[i]],
                "addRecipients: recipients address already exists"
            );
            require(
                _recipients[i] != address(0),
                "addRecipients: recipients address invalid"
            );

            recipients.push(_recipients[i]);
            proportions[_recipients[i]] = 0;
            isRecipientActive[_recipients[i]] = true;
        }
    }

    /**
     * @dev Reset recipients and corresponding proportions, will delete the old ones.
     * @param _recipients The list of new recipients.
     * @param _proportions the list of corresponding proportions.
     */
    function resetRecipients(
        address[] calldata _recipients,
        uint256[] calldata _proportions
    ) external auth {
        address[] memory _oldHandlers = recipients;
        for (uint256 i = 0; i < _oldHandlers.length; i++) {
            delete proportions[_oldHandlers[i]];
            delete isRecipientActive[_oldHandlers[i]];
        }
        delete recipients;

        setRecipients(_recipients, _proportions);
    }

    /**
     * @dev update baseProportion.
     * @param _baseProportion baseProportion to update.
     */
    function updateBaseProportion(uint256 _baseProportion) external auth {
        require(
            _baseProportion != baseProportion,
            "updateBaseProportion: Old and new value cannot be the same."
        );
        baseProportion = _baseProportion;
    }

    /***********************/
    /*** User Operations ***/
    /***********************/

    /**
     * @dev Query the current recipients and the corresponding proportions.
     * @return Return two arrays, the current recipients,
     *         and the corresponding proportions.
     */
    function getRecipients()
        external
        view
        returns (address[] memory, uint256[] memory)
    {
        address[] memory _recipients = recipients;
        uint256[] memory _proportions = new uint256[](_recipients.length);
        for (uint256 i = 0; i < _proportions.length; i++)
            _proportions[i] = proportions[_recipients[i]];

        return (_recipients, _proportions);
    }
}

/**
 * @dev Interface of the ERC20 standard as defined in the EIP. Does not include
 * the optional functions; to access them see {ERC20Detailed}.
 */
interface IERC20 {
    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint);

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address recipient, uint amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address sender, address recipient, uint amount) external returns (bool);

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint value);

    // This function is not a standard ERC20 interface, just for compitable with market.
    function decimals() external view returns (uint8);
}

contract ERC20SafeTransfer {
    function doTransferOut(address _token, address _to, uint _amount) internal returns (bool) {
        IERC20 token = IERC20(_token);
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
        IERC20 token = IERC20(_token);
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
}

interface IDSWrappedToken {
    function changeByMultiple(uint _amount) external view returns (uint);
    function reverseByMultiple(uint _xAmount) external view returns (uint);
    function getSrcERC20() external view returns (address);
}

interface IDFStore {
    function getMintedTokenList() external view returns (address[] memory);
}

interface IDFPoolV2 {
    function transferOutSrc(address _tokenID, address _to, uint _amount) external returns (bool);
}

interface IDTokenController {
    function getDToken(address _token) external view returns (address);
}

interface IDToken {

    function getBaseData()
        external
        returns (
            uint256,
            uint256,
            uint256,
            uint256,
            uint256
        );
}

contract ProfitProviderUSDx is DistributionMap, ERC20SafeTransfer {
    using SafeMath for uint256;

    bool private initialized; // Flag of initialize data

    address public USDx;
    address public dfStore;
    address public dfPool;
    address public dfCollateral;
    address public dfFunds;

    address public dTokenController;

    uint256 public baseProfit;

    uint256 constant BASE = 10**18;

    event NewPool(address _oldPool, address _newPool);
    event NewCollateral(address _oldCollateral, address _newCollateral);
    event NewFunds(address _oldFunds, address _newFunds);
    event NewDTokenController(address _oldNewDTokenController, address _newNewDTokenController);

    /**
     * The constructor is used here to ensure that the implementation
     * contract is initialized. An uncontrolled implementation
     * contract might lead to misleading state
     * for users who accidentally interact with it.
     */
    constructor(
        address _USDx,
        address _dfStore,
        address _dfPool,
        address _dfCollateral,
        address _dfFunds,
        address _dTokenController
    ) public {
        initialize(_USDx, _dfStore, _dfPool, _dfCollateral, _dfFunds, _dTokenController);
    }

    /************************/
    /*** Admin Operations ***/
    /************************/

    // --- Init ---
    function initialize(
        address _USDx,
        address _dfStore,
        address _dfPool,
        address _dfCollateral,
        address _dfFunds,
        address _dTokenController
    ) public {
        require(!initialized, "initialize: Already initialized!");
        owner = msg.sender;
        USDx = _USDx;
        dfStore = _dfStore;
        dfPool = _dfPool;
        dfCollateral = _dfCollateral;
        dfFunds = _dfFunds;
        dTokenController = _dTokenController;        
        initialized = true;
    }

    /**
     * @dev Authorized function to set a new pool contract.
     * @param _newPool New pool contract address.
     */
    function setPool(address _newPool) external auth {
        address _oldPool = dfPool;
        require(
            _newPool != address(0) && _newPool != _oldPool,
            "setPool: dfPool can be not set to 0 or the current one."
        );
        dfPool = _newPool;
        emit NewPool(_oldPool, _newPool);
    }

    /**
     * @dev Authorized function to set a new collateral contract.
     * @param _newCollateral New collateral contract address.
     */
    function setCollateral(address _newCollateral) external auth {
        address _oldCollateral = dfCollateral;
        require(
            _newCollateral != address(0) && _newCollateral != _oldCollateral,
            "setCollateral: dfCollateral can be not set to 0 or the current one."
        );
        dfCollateral = _newCollateral;
        emit NewCollateral(_oldCollateral, _newCollateral);
    }

    /**
     * @dev Authorized function to set a new funds contract.
     * @param _newFunds New funds contract address.
     */
    function setFunds(address _newFunds) external auth {
        address _oldFunds = dfFunds;
        require(
            _newFunds != address(0) && _newFunds != _oldFunds,
            "setFunds: dfFunds can be not set to 0 or the current one."
        );
        dfFunds = _newFunds;
        emit NewFunds(_oldFunds, _newFunds);
    }

    /**
     * @dev Authorized function to set a new dToken controller contract.
     * @param _newDTokenController New dToken controller contract address.
     */
    function setDTokenController(address _newDTokenController) external auth {
        address _oldDTokenController = dTokenController;
        require(
            _newDTokenController != address(0) && _newDTokenController != _oldDTokenController,
            "setDTokenController: dTokenController can be not set to 0 or the current one."
        );
        dTokenController = _newDTokenController;
        emit NewDTokenController(_oldDTokenController, _newDTokenController);
    }

    function rmul(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = x.mul(y) / BASE;
    }

    function rdiv(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = x.mul(BASE).div(y);
    }

    function rdivup(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = x.mul(BASE).add(y.sub(1)).div(y);
    }
  
    function swap(address _input, uint _inputAmount, address _output, uint _outputAmount, address _receiver) internal {
        require(doTransferOut(_input, dfFunds, _inputAmount), "swap: failed");
        require(doTransferOut(_output, _receiver, _outputAmount), "swap: failed");
    }

    function resetProfit() external {
        require(isRecipientActive[msg.sender], "resetProfit: the recipients contract address does not exist");
        baseProfit = getUSDxProfitAmount();
    }

    struct withdrawLocalVars {
        address[] xTokens;
        address token;
        address USDx;
        address dfCollateral;
        address dfPool;
        address receiver;
        uint256 xAmount;
        uint256 xBalance;
        uint256 amount;
        uint256 withdrawAmount;
        uint256 withdrawXAmount;
        uint256 sum;
    }
    function withdrawProfit(uint256 _amount) external {
        withdrawLocalVars memory _local;
        _local.receiver = msg.sender;
        require(isRecipientActive[_local.receiver], "withdrawProfit: the recipients contract address does not exist");

        _local.sum = _amount;
        _local.USDx = USDx;
        _local.dfCollateral = dfCollateral;
        _local.dfPool = dfPool;
        _local.xTokens = IDFStore(dfStore).getMintedTokenList();
        for (uint i = 0; i < _local.xTokens.length && _local.sum > 0; i++) {

            _local.xBalance = IERC20(_local.xTokens[i]).balanceOf(_local.dfCollateral);

            _local.token = IDSWrappedToken(_local.xTokens[i]).getSrcERC20();

            _local.xAmount = IDSWrappedToken(_local.xTokens[i]).changeByMultiple(getUnderlyingAmountOfDToken(_local.token)); 
            _local.xAmount = _local.xAmount > _local.xBalance ? _local.xAmount.sub(_local.xBalance) : 0;

            if (_local.xAmount > 0) {

                _local.withdrawXAmount = _local.xAmount > _local.sum ? _local.sum : _local.xAmount;
                _local.withdrawAmount = IDSWrappedToken(_local.xTokens[i]).reverseByMultiple(_local.withdrawXAmount);

                IDFPoolV2(_local.dfPool).transferOutSrc(_local.token, address(this), _local.withdrawAmount);
                swap(_local.token, _local.withdrawAmount, _local.USDx, _local.withdrawXAmount, _local.receiver);
                _local.sum = _local.sum.sub(_local.withdrawXAmount);
            }
		}
    }

    function getProfitAmount() external returns (uint256) {
        return proportions[msg.sender].mul(getUSDxProfitAmount().sub(baseProfit)).div(totalProportion);
    }

    function getUSDxProfitAmount() public returns (uint256) {
        uint256 _totalAmount;
        (, , , uint256[] memory _amounts) = getProfit();
        for (uint i = 0; i < _amounts.length; i++)
            _totalAmount = _totalAmount.add(_amounts[i]);
        return _totalAmount;
    }

    struct ProfitLocalVars {
        address[] xTokens;
        uint256[] xAmounts;
        address[] tokens;
        uint256[] amounts;
        address dfCollateral;
        uint256 xAmount;
        uint256 xBalance;
    }
    function getProfit() public returns (address[] memory, uint256[] memory, address[] memory, uint256[] memory) {
        ProfitLocalVars memory _local;
        _local.xTokens = IDFStore(dfStore).getMintedTokenList();
        _local.xAmounts = new uint256[](_local.xTokens.length);
        _local.tokens = new address[](_local.xTokens.length);
        _local.amounts = new uint256[](_local.xTokens.length);
        _local.dfCollateral = dfCollateral;
        for (uint i = 0; i < _local.xTokens.length; i++) {

            _local.tokens[i] = IDSWrappedToken(_local.xTokens[i]).getSrcERC20();
            _local.xAmount = IDSWrappedToken(_local.xTokens[i]).changeByMultiple(getUnderlyingAmountOfDToken(_local.tokens[i]));
            _local.xBalance = IERC20(_local.xTokens[i]).balanceOf(_local.dfCollateral);
            
            _local.xAmounts[i] = _local.xAmount > _local.xBalance ? _local.xAmount.sub(_local.xBalance) : 0;
            _local.amounts[i] = IDSWrappedToken(_local.xTokens[i]).reverseByMultiple(_local.xAmounts[i]);
		}
        return (_local.tokens, _local.amounts, _local.xTokens, _local.xAmounts);
    }

    struct DTokenLocalVars {
        address dToken;
        uint256 exchangeRate;
        uint256 feeRate;
        uint256 grossAmount;
        uint256 baseAmount;
        uint256 amount;
    }
    function getUnderlyingAmountOfDToken(address _underlying) public returns (uint256) {
        DTokenLocalVars memory _local;
        _local.dToken = IDTokenController(dTokenController).getDToken(_underlying);
        (, _local.exchangeRate, , _local.feeRate,) = IDToken(_local.dToken).getBaseData();

        _local.grossAmount = rmul(IERC20(_local.dToken).balanceOf(dfPool), _local.exchangeRate);
        _local.amount = _local.grossAmount.sub(rmul(_local.grossAmount, _local.feeRate));
        _local.baseAmount = 10**uint256(IERC20(_local.dToken).decimals());

        return _local.amount > _local.baseAmount ? _local.amount.sub(_local.baseAmount) : 0;
    }
}
