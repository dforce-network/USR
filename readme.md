# Audit Scope

The audit scope is the core logic of USR token and its proxy contract.

- Includes:

    1. The following processes and reference functions in ./contracts/USR.sol:

        - Mint: saving USDx and get USR token

        - Burn/Withdraw: redeem USDx by repaying USR token

        *Notice: Some basic functions are not include in audit scope.*

    2. The implementation of proxy function in ./contracts/USRProxy.sol

- Excludes:

    1. All functions and condition judgements that do not exist in ./contracts/USR.sol.

    2. All mathematical functions:

        - function rpow(uint x, uint n, uint base)
        - function rmul(uint x, uint y)
        - function rdiv(uint x, uint y)
        - function rdivup(uint x, uint y)
        - function mulScale(uint x, uint y)
        - function divScale(uint x, uint y)
