pragma solidity 0.5.12;

contract InterestModel {

    address public owner;
    address public newOwner;
    mapping(address => bool) public admin;

    uint public interestRate;

    event OwnerUpdate(address indexed owner, address indexed newOwner);
    event SetAdmin(address indexed owner, address indexed newAdmin);
    event CancelAdmin(address indexed owner, address indexed newAdmin);
    event SetInterestRate(address indexed admin, uint indexed InterestRate, uint indexed oldInterestRate);

    modifier onlyOwner() {
        require(msg.sender == owner, "non-owner");
        _;
    }

    modifier isAdmin() {
        require(admin[msg.sender], "non-admin");
        _;
    }

    constructor () public {
        owner = msg.sender;
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

    function setInterestRate(uint _interestRate) external isAdmin {
        require(interestRate != _interestRate, "setInterestRate: Old and new values cannot be the same.");
        uint _oldInterestRate = interestRate;
        interestRate = _interestRate;
        emit SetInterestRate(msg.sender, _interestRate, _oldInterestRate);
    }

    function getInterestRate() external view returns (uint) {

        return interestRate;
    }
}
