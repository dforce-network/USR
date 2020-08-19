pragma solidity 0.5.12;

import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";

import "./library/DSAuth.sol";

interface IProfitFunds {
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

contract ProfitProviderUSDx is DSAuth {
    using SafeMath for uint256;

    bool private initialized; // Flag of initialize data

    address public USDx;
    address public dfStore;
    address public dfPool;
    address public dfCollateral;
    address public profitFunds;

    address public dTokenController;

    uint256 public baseProfit;

    uint256 constant BASE = 10**18;

    event NewPool(address _oldPool, address _newPool);
    event NewCollateral(address _oldCollateral, address _newCollateral);
    event NewFunds(address _oldFunds, address _newFunds);
    event NewDTokenController(
        address _oldNewDTokenController,
        address _newNewDTokenController
    );

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
        address _profitFunds,
        address _dTokenController
    ) public {
        initialize(
            _USDx,
            _dfStore,
            _dfPool,
            _dfCollateral,
            _profitFunds,
            _dTokenController
        );
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
        address _profitFunds,
        address _dTokenController
    ) public {
        require(!initialized, "initialize: Already initialized!");
        owner = msg.sender;
        USDx = _USDx;
        dfStore = _dfStore;
        dfPool = _dfPool;
        dfCollateral = _dfCollateral;
        profitFunds = _profitFunds;
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
        address _oldFunds = profitFunds;
        require(
            _newFunds != address(0) && _newFunds != _oldFunds,
            "setFunds: profitFunds can be not set to 0 or the current one."
        );
        profitFunds = _newFunds;
        emit NewFunds(_oldFunds, _newFunds);
    }

    /**
     * @dev Authorized function to set a new dToken controller contract.
     * @param _newDTokenController New dToken controller contract address.
     */
    function setDTokenController(address _newDTokenController) external auth {
        address _oldDTokenController = dTokenController;
        require(
            _newDTokenController != address(0) &&
                _newDTokenController != _oldDTokenController,
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

    function resetProfit() external auth {
        baseProfit = getProfit();
    }

    struct withdrawLocalVars {
        address[] xTokens;
        address dfPool;
        address profitFunds;
        address token;
        uint256 remaining;
        uint256 xProfit;
        uint256 xTotalProfit;
        uint256 withdrawAmount;
        uint256 withdrawXAmount;
    }

    function withdrawProfit(uint256 _amount) external auth {
        withdrawLocalVars memory _local;

        _local.xTokens = IDFStore(dfStore).getMintedTokenList();
        _local.dfPool = dfPool;
        _local.profitFunds = profitFunds;
        _local.remaining = _amount;
        for (uint256 i = 0; i < _local.xTokens.length; i++) {
            (_local.token, _local.xProfit) = getProfitByXToken(
                _local.xTokens[i]
            );
            _local.xTotalProfit = _local.xTotalProfit.add(_local.xProfit);

            if (_local.xProfit > 0 && _local.remaining > 0) {
                _local.withdrawXAmount = _local.xProfit > _local.remaining
                    ? _local.remaining
                    : _local.xProfit;
                _local.withdrawAmount = IDSWrappedToken(_local.xTokens[i])
                    .reverseByMultiple(_local.withdrawXAmount);

                IDFPoolV2(_local.dfPool).transferOutSrc(
                    _local.token,
                    _local.profitFunds,
                    _local.withdrawAmount
                );
                _local.remaining = _local.remaining.sub(_local.withdrawXAmount);
            }
        }
        require(
            _local.remaining == 0 &&
                _amount <= _local.xTotalProfit.sub(baseProfit),
            "withdrawProfit: not enough profit"
        );
        IProfitFunds(_local.profitFunds).transferOut(USDx, msg.sender, _amount);
    }

    function getProfitAmount() external returns (uint256) {
        uint256 _profit = getProfit();
        uint256 _baseProfit = baseProfit;
        return _profit > _baseProfit ? _profit.sub(_baseProfit) : 0;
    }

    struct ProfitLocalVars {
        address[] xTokens;
        uint256 xProfit;
        uint256 xTotalProfit;
    }

    function getProfit() public returns (uint256) {
        ProfitLocalVars memory _local;

        _local.xTokens = IDFStore(dfStore).getMintedTokenList();
        for (uint256 i = 0; i < _local.xTokens.length; i++) {
            (, _local.xProfit) = getProfitByXToken(_local.xTokens[i]);
            _local.xTotalProfit = _local.xTotalProfit.add(_local.xProfit);
        }
        return _local.xTotalProfit;
    }

    struct ProfitDetailsLocalVars {
        address[] xTokens;
        uint256[] xProfits;
        address[] tokens;
        uint256[] profits;
    }

    function getProfitDetails()
        external
        returns (
            address[] memory,
            uint256[] memory,
            address[] memory,
            uint256[] memory
        )
    {
        ProfitDetailsLocalVars memory _local;
        _local.xTokens = IDFStore(dfStore).getMintedTokenList();
        _local.xProfits = new uint256[](_local.xTokens.length);
        _local.tokens = new address[](_local.xTokens.length);
        _local.profits = new uint256[](_local.xTokens.length);
        for (uint256 i = 0; i < _local.xTokens.length; i++) {
            (_local.tokens[i], _local.xProfits[i]) = getProfitByXToken(
                _local.xTokens[i]
            );
            _local.profits[i] = IDSWrappedToken(_local.xTokens[i])
                .reverseByMultiple(_local.xProfits[i]);
        }
        return (_local.tokens, _local.profits, _local.xTokens, _local.xProfits);
    }

    struct ProfitInfoLocalVars {
        address token;
        uint256 xBalance;
        uint256 xPrincipal;
    }

    function getProfitByXToken(address _xToken)
        public
        returns (address, uint256)
    {
        ProfitInfoLocalVars memory _local;

        _local.token = IDSWrappedToken(_xToken).getSrcERC20();
        _local.xBalance = IDSWrappedToken(_xToken).changeByMultiple(
            getUnderlying(_local.token)
        );
        _local.xPrincipal = IERC20(_xToken).balanceOf(dfCollateral);
        return (
            _local.token,
            _local.xBalance > _local.xPrincipal
                ? _local.xBalance.sub(_local.xPrincipal)
                : 0
        );
    }

    struct DTokenLocalVars {
        address dToken;
        uint256 exchangeRate;
        uint256 feeRate;
        uint256 grossAmount;
        // uint256 baseAmount;
        // uint256 netAmount;
    }

    function getUnderlying(address _underlying) public returns (uint256) {
        DTokenLocalVars memory _local;
        _local.dToken = IDTokenController(dTokenController).getDToken(
            _underlying
        );
        if (_local.dToken == address(0)) return 0;

        (, _local.exchangeRate, , _local.feeRate, ) = IDToken(_local.dToken)
            .getBaseData();

        _local.grossAmount = rmul(
            IERC20(_local.dToken).balanceOf(dfPool),
            _local.exchangeRate
        );
        return _local.grossAmount.sub(rmul(_local.grossAmount, _local.feeRate));
        // _local.netAmount = _local.grossAmount.sub(rmul(_local.grossAmount, _local.feeRate));
        // _local.baseAmount = 10**uint256(IERC20(_local.dToken).decimals());

        // return _local.netAmount > _local.baseAmount ? _local.netAmount.sub(_local.baseAmount) : 0;
    }
}
