pragma solidity 0.5.12;

interface IProfitProvider {
    /**
     * @dev Get the total amount of profit, the amount is based on underlying token.
     */
    function getProfitAmount() external view returns (uint256);

    /**
     * @dev When the total supply of token is 0, it needs to be called to reset the starting point.
     */
    function resetProfit() external;

    /**
     * @dev Withdraw the interest generated by USDx.
     * @param _amount USDx withdrawal amount.
     * @return Withdraw USDx amount.
     */
    function withdrawProfit(uint256 _amount) external returns (uint256);
}
