pragma solidity 0.5.12;

library SafeMath {
    function add(uint x, uint y) public pure returns (uint z) {
        require((z = x + y) >= x);
    }

    function sub(uint x, uint y) public pure returns (uint z) {
        require((z = x - y) <= x);
    }

    function mul(uint x, uint y) public pure returns (uint z) {
        require(y == 0 || (z = x * y) / y == x);
    }
}
