pragma solidity 0.5.12;

import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";

import "./library/DSAuth.sol";

interface IFunds {
    function transferOut(
        address _token,
        address _to,
        uint256 _amount
    ) external returns (bool);
}

interface IDSWrappedToken {
    function changeByMultiple(uint256 _amount) external view returns (uint256);

    function reverseByMultiple(uint256 _xAmount)
        external
        view
        returns (uint256);

    function getSrcERC20() external view returns (address);
}

interface IDFStore {
    function getMintedTokenList() external view returns (address[] memory);
}

interface IDFPoolV2 {
    function transferOutSrc(
        address _token,
        address _to,
        uint256 _amount
    ) external returns (bool);

    function getInterestByXToken(address _xToken)
        external
        returns (address, uint256);

    function getUnderlying(address _underlying) external returns (uint256);
}

contract InterestProvider is DSAuth {
    using SafeMath for uint256;

    bool private initialized; // Flag of initialize data

    address public USDx;
    address public dfStore;
    address public dfPool;
    address public funds;

    event NewPool(address _oldPool, address _newPool);
    event NewFunds(address _oldFunds, address _newFunds);

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
        address _funds
    ) public {
        initialize(_USDx, _dfStore, _dfPool, _funds);
    }

    /************************/
    /*** Admin Operations ***/
    /************************/

    // --- Init ---
    function initialize(
        address _USDx,
        address _dfStore,
        address _dfPool,
        address _funds
    ) public {
        require(!initialized, "initialize: Already initialized!");
        owner = msg.sender;
        USDx = _USDx;
        dfStore = _dfStore;
        dfPool = _dfPool;
        funds = _funds;
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
     * @dev Authorized function to set a new funds contract.
     * @param _newFunds New funds contract address.
     */
    function setFunds(address _newFunds) external auth {
        address _oldFunds = funds;
        require(
            _newFunds != address(0) && _newFunds != _oldFunds,
            "setFunds: funds can be not set to 0 or the current one."
        );
        funds = _newFunds;
        emit NewFunds(_oldFunds, _newFunds);
    }

    struct withdrawLocalVars {
        address[] xTokens;
        address dfPool;
        address funds;
        address token;
        uint256 remaining;
        uint256 xInterest;
        uint256 xTotalInterest;
        uint256 withdrawAmount;
        uint256 withdrawXAmount;
    }

    function withdrawInterest(uint256 _amount) external auth {
        withdrawLocalVars memory _local;

        _local.xTokens = IDFStore(dfStore).getMintedTokenList();
        _local.dfPool = dfPool;
        _local.funds = funds;
        _local.remaining = _amount;
        for (uint256 i = 0; i < _local.xTokens.length; i++) {
            (_local.token, _local.xInterest) = IDFPoolV2(_local.dfPool)
                .getInterestByXToken(_local.xTokens[i]);
            _local.xTotalInterest = _local.xTotalInterest.add(_local.xInterest);

            if (_local.xInterest > 0 && _local.remaining > 0) {
                _local.withdrawXAmount = _local.xInterest > _local.remaining
                    ? _local.remaining
                    : _local.xInterest;
                _local.withdrawAmount = IDSWrappedToken(_local.xTokens[i])
                    .reverseByMultiple(_local.withdrawXAmount);

                IDFPoolV2(_local.dfPool).transferOutSrc(
                    _local.token,
                    _local.funds,
                    _local.withdrawAmount
                );
                _local.remaining = _local.remaining.sub(_local.withdrawXAmount);
            }
        }
        require(
            _local.remaining == 0 && _amount <= _local.xTotalInterest,
            "withdrawInterest: not enough interest"
        );
        IFunds(_local.funds).transferOut(USDx, msg.sender, _amount);
    }

    struct InterestLocalVars {
        address[] xTokens;
        address dfPool;
        uint256 xInterest;
        uint256 xTotalInterest;
    }

    function getInterestAmount() external returns (uint256) {
        InterestLocalVars memory _local;

        _local.xTokens = IDFStore(dfStore).getMintedTokenList();
        _local.dfPool = dfPool;
        for (uint256 i = 0; i < _local.xTokens.length; i++) {
            (, _local.xInterest) = IDFPoolV2(_local.dfPool).getInterestByXToken(
                _local.xTokens[i]
            );
            _local.xTotalInterest = _local.xTotalInterest.add(_local.xInterest);
        }
        return _local.xTotalInterest;
    }

    struct InterestDetailsLocalVars {
        address[] xTokens;
        uint256[] xInterests;
        address[] tokens;
        uint256[] interests;
        address dfPool;
    }

    function getInterestDetails()
        external
        returns (
            address[] memory,
            uint256[] memory,
            address[] memory,
            uint256[] memory
        )
    {
        InterestDetailsLocalVars memory _local;
        _local.xTokens = IDFStore(dfStore).getMintedTokenList();
        _local.xInterests = new uint256[](_local.xTokens.length);
        _local.tokens = new address[](_local.xTokens.length);
        _local.interests = new uint256[](_local.xTokens.length);
        _local.dfPool = dfPool;
        for (uint256 i = 0; i < _local.xTokens.length; i++) {
            (_local.tokens[i], _local.xInterests[i]) = IDFPoolV2(_local.dfPool)
                .getInterestByXToken(_local.xTokens[i]);
            _local.interests[i] = IDSWrappedToken(_local.xTokens[i])
                .reverseByMultiple(_local.xInterests[i]);
        }
        return (
            _local.tokens,
            _local.interests,
            _local.xTokens,
            _local.xInterests
        );
    }
}
