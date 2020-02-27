pragma solidity 0.5.12;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an owner that can be granted exclusive access to
 * specific functions.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner, and the modifier `onlyAdmin`, which can be applied to your
 * functions to restrict their use to the admin.
 */
contract Ownable {
    address public owner;
    address public newOwner;
    mapping(address => bool) public admin;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event SetAdmin(address indexed owner, address indexed newAdmin);
    event CancelAdmin(address indexed owner, address indexed newAdmin);

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "non-owner");
        _;
    }

    /**
     * @dev Returns true if the caller is a admin.
     */
    modifier onlyAdmin() {
        require(admin[msg.sender], "non-admin");
        _;
    }

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() public {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner_`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner_) external onlyOwner {
        require(newOwner_ != owner, "TransferOwnership: the same owner.");
        newOwner = newOwner_;
    }

    /**
     * @dev Accepts ownership of the contract.
     * Can only be called by the settting new owner(newOwner).
     */
    function acceptOwnership() external {
        require(msg.sender == newOwner, "AcceptOwnership: only new owner do this.");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
        newOwner = address(0x0);
    }

    /**
     * @dev Set a new account (`_admin`) as an admin to have part of the owner's right.
     * Can only be called by the current owner.
     */
    function setAdmin(address _admin) external onlyOwner {
        require(_admin != address(0), "SetAdmin: _admin cannot be a zero address.");
        require(!admin[_admin], "SetAdmin: Already an admin address.");
        admin[_admin] = true;
        emit SetAdmin(owner, _admin);
    }

    /**
     * @dev Cancel a previous admin account to loose part of the owner's right.
     * Can only be called by the current owner.
     */
    function cancelAdmin(address _admin) external onlyOwner {
        require(_admin != address(0), "CancelAdmin: _admin cannot be a zero address.");
        require(admin[_admin], "CancelAdmin: Not an admin address.");
        admin[_admin] = false;
        emit CancelAdmin(owner, _admin);
    }
}
