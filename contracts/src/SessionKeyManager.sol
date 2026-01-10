// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title SessionKeyManager
 * @notice Manages session keys for automated workflow execution
 * @dev Allows users to create limited-permission keys for the d8n engine
 */
contract SessionKeyManager {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ============ Structs ============
    
    struct SessionKey {
        address key;           // The session key address
        address owner;         // The wallet that created this session key
        uint256 validAfter;    // Timestamp when key becomes valid
        uint256 validUntil;    // Timestamp when key expires
        uint256 maxValue;      // Maximum ETH value per transaction
        uint256 spentValue;    // Total value spent via this key
        bool active;           // Whether the key is currently active
        bytes4[] allowedFunctions;  // Function selectors this key can call
    }

    // ============ State Variables ============
    
    /// @notice Mapping from session key address to its configuration
    mapping(address => SessionKey) public sessionKeys;
    
    /// @notice Mapping from owner to their session key addresses
    mapping(address => address[]) public ownerSessionKeys;
    
    /// @notice Nonces for replay protection
    mapping(address => uint256) public nonces;

    // ============ Events ============
    
    event SessionKeyCreated(
        address indexed owner,
        address indexed sessionKey,
        uint256 validUntil,
        uint256 maxValue
    );
    
    event SessionKeyRevoked(
        address indexed owner,
        address indexed sessionKey
    );
    
    event SessionKeyUsed(
        address indexed sessionKey,
        address indexed target,
        uint256 value,
        bytes4 functionSelector
    );

    // ============ Errors ============
    
    error SessionKeyNotActive();
    error SessionKeyExpired();
    error SessionKeyNotYetValid();
    error ExceedsMaxValue(uint256 requested, uint256 remaining);
    error FunctionNotAllowed(bytes4 selector);
    error InvalidSignature();
    error NotSessionKeyOwner();
    error SessionKeyAlreadyExists();

    // ============ External Functions ============
    
    /**
     * @notice Create a new session key
     * @param sessionKeyAddress The address of the session key
     * @param validUntil When the session key expires
     * @param maxValue Maximum cumulative value this key can spend
     * @param allowedFunctions Array of function selectors this key can call
     */
    function createSessionKey(
        address sessionKeyAddress,
        uint256 validUntil,
        uint256 maxValue,
        bytes4[] calldata allowedFunctions
    ) external {
        if (sessionKeys[sessionKeyAddress].active) {
            revert SessionKeyAlreadyExists();
        }

        sessionKeys[sessionKeyAddress] = SessionKey({
            key: sessionKeyAddress,
            owner: msg.sender,
            validAfter: block.timestamp,
            validUntil: validUntil,
            maxValue: maxValue,
            spentValue: 0,
            active: true,
            allowedFunctions: allowedFunctions
        });

        ownerSessionKeys[msg.sender].push(sessionKeyAddress);

        emit SessionKeyCreated(msg.sender, sessionKeyAddress, validUntil, maxValue);
    }

    /**
     * @notice Revoke a session key
     * @param sessionKeyAddress The session key to revoke
     */
    function revokeSessionKey(address sessionKeyAddress) external {
        SessionKey storage sk = sessionKeys[sessionKeyAddress];
        
        if (sk.owner != msg.sender) {
            revert NotSessionKeyOwner();
        }

        sk.active = false;

        emit SessionKeyRevoked(msg.sender, sessionKeyAddress);
    }

    /**
     * @notice Validate and execute a transaction using a session key
     * @param sessionKeyAddress The session key to use
     * @param target The contract to call
     * @param value The ETH value to send
     * @param data The calldata for the transaction
     * @param signature The signature from the session key
     */
    function executeWithSessionKey(
        address sessionKeyAddress,
        address target,
        uint256 value,
        bytes calldata data,
        bytes calldata signature
    ) external returns (bytes memory) {
        SessionKey storage sk = sessionKeys[sessionKeyAddress];

        // Validate session key state
        _validateSessionKey(sk, value);

        // Check function is allowed
        if (sk.allowedFunctions.length > 0 && data.length >= 4) {
            _checkFunctionAllowed(sk.allowedFunctions, bytes4(data[:4]));
        }

        // Verify signature
        _verifySignature(sessionKeyAddress, target, value, data, signature);

        // Update spent value
        sk.spentValue += value;

        // Execute transaction and emit event
        return _executeCall(sessionKeyAddress, target, value, data);
    }

    /**
     * @notice Internal: Validate session key state and limits
     */
    function _validateSessionKey(SessionKey storage sk, uint256 value) internal view {
        if (!sk.active) revert SessionKeyNotActive();
        if (block.timestamp < sk.validAfter) revert SessionKeyNotYetValid();
        if (block.timestamp > sk.validUntil) revert SessionKeyExpired();

        uint256 remaining = sk.maxValue - sk.spentValue;
        if (value > remaining) {
            revert ExceedsMaxValue(value, remaining);
        }
    }

    /**
     * @notice Internal: Check if function selector is allowed
     */
    function _checkFunctionAllowed(bytes4[] storage allowedFunctions, bytes4 selector) internal view {
        bool allowed = false;
        for (uint i = 0; i < allowedFunctions.length; i++) {
            if (allowedFunctions[i] == selector) {
                allowed = true;
                break;
            }
        }
        if (!allowed) revert FunctionNotAllowed(selector);
    }

    /**
     * @notice Internal: Verify session key signature
     */
    function _verifySignature(
        address sessionKeyAddress,
        address target,
        uint256 value,
        bytes calldata data,
        bytes calldata signature
    ) internal {
        uint256 currentNonce = nonces[sessionKeyAddress];
        nonces[sessionKeyAddress] = currentNonce + 1;
        
        bytes32 messageHash = keccak256(abi.encodePacked(
            sessionKeyAddress,
            target,
            value,
            data,
            currentNonce
        ));
        
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address recovered = ethSignedHash.recover(signature);
        
        if (recovered != sessionKeyAddress) {
            revert InvalidSignature();
        }
    }

    /**
     * @notice Internal: Execute the call and emit event
     */
    function _executeCall(
        address sessionKeyAddress,
        address target,
        uint256 value,
        bytes calldata data
    ) internal returns (bytes memory) {
        bytes4 functionSelector;
        if (data.length >= 4) {
            functionSelector = bytes4(data[:4]);
        }

        (bool success, bytes memory result) = target.call{value: value}(data);
        require(success, "Execution failed");

        emit SessionKeyUsed(sessionKeyAddress, target, value, functionSelector);

        return result;
    }

    // ============ View Functions ============

    /**
     * @notice Get all session keys for an owner
     */
    function getSessionKeys(address owner) external view returns (address[] memory) {
        return ownerSessionKeys[owner];
    }

    /**
     * @notice Check if a session key is valid
     */
    function isSessionKeyValid(address sessionKeyAddress) external view returns (bool) {
        SessionKey storage sk = sessionKeys[sessionKeyAddress];
        return sk.active && 
               block.timestamp >= sk.validAfter && 
               block.timestamp <= sk.validUntil;
    }

    /**
     * @notice Get remaining value allowance for a session key
     */
    function getRemainingValue(address sessionKeyAddress) external view returns (uint256) {
        SessionKey storage sk = sessionKeys[sessionKeyAddress];
        return sk.maxValue - sk.spentValue;
    }

    /**
     * @notice Get session key details
     */
    function getSessionKeyDetails(address sessionKeyAddress) external view returns (
        address owner,
        uint256 validAfter,
        uint256 validUntil,
        uint256 maxValue,
        uint256 spentValue,
        bool active
    ) {
        SessionKey storage sk = sessionKeys[sessionKeyAddress];
        return (sk.owner, sk.validAfter, sk.validUntil, sk.maxValue, sk.spentValue, sk.active);
    }

    // ============ Receive Function ============
    
    receive() external payable {}
}
