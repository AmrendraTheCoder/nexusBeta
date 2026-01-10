// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NexusTreasury
 * @notice Holds user deposits for the Nexus payment system
 * @dev Users deposit native tokens, backend credits virtual balance
 */
contract NexusTreasury is ReentrancyGuard, Ownable {
    
    // ============ State Variables ============
    
    /// @notice Tracks on-chain deposits per user
    mapping(address => uint256) public deposits;
    
    /// @notice Total deposits held in contract
    uint256 public totalDeposits;
    
    /// @notice Minimum deposit amount (0.01 native token)
    uint256 public constant MIN_DEPOSIT = 0.01 ether;
    
    /// @notice Whether deposits are paused
    bool public depositsPaused;
    
    // ============ Events ============
    
    event Deposited(
        address indexed user, 
        uint256 amount, 
        uint256 newBalance,
        uint256 timestamp
    );
    
    event Withdrawn(
        address indexed user, 
        uint256 amount, 
        uint256 remainingBalance
    );
    
    event EmergencyWithdraw(
        address indexed owner, 
        uint256 amount
    );
    
    event DepositsPaused(bool paused);
    
    // ============ Errors ============
    
    error DepositTooSmall(uint256 sent, uint256 minimum);
    error InsufficientBalance(uint256 requested, uint256 available);
    error DepositsPausedError();
    error WithdrawFailed();
    error ZeroAmount();
    
    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {}
    
    // ============ External Functions ============
    
    /**
     * @notice Deposit native tokens into the treasury
     * @dev Emits Deposited event for backend to credit virtual balance
     */
    function deposit() external payable nonReentrant {
        if (depositsPaused) revert DepositsPausedError();
        if (msg.value < MIN_DEPOSIT) revert DepositTooSmall(msg.value, MIN_DEPOSIT);
        
        deposits[msg.sender] += msg.value;
        totalDeposits += msg.value;
        
        emit Deposited(
            msg.sender, 
            msg.value, 
            deposits[msg.sender],
            block.timestamp
        );
    }
    
    /**
     * @notice Withdraw funds from treasury
     * @param amount Amount to withdraw in wei
     * @dev Only allows withdrawal of actual deposited funds
     */
    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (deposits[msg.sender] < amount) {
            revert InsufficientBalance(amount, deposits[msg.sender]);
        }
        
        deposits[msg.sender] -= amount;
        totalDeposits -= amount;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert WithdrawFailed();
        
        emit Withdrawn(msg.sender, amount, deposits[msg.sender]);
    }
    
    /**
     * @notice Get user's deposit balance
     * @param user Address to check
     * @return balance Current deposit balance
     */
    function getBalance(address user) external view returns (uint256 balance) {
        return deposits[user];
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Pause or unpause deposits
     * @param paused True to pause, false to unpause
     */
    function setDepositsPaused(bool paused) external onlyOwner {
        depositsPaused = paused;
        emit DepositsPaused(paused);
    }
    
    /**
     * @notice Emergency withdraw all funds (owner only)
     * @dev Only for extreme emergencies, emits event for transparency
     */
    function emergencyWithdrawAll() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        if (!success) revert WithdrawFailed();
        
        emit EmergencyWithdraw(owner(), balance);
    }
    
    // ============ Receive Function ============
    
    /// @notice Allow direct ETH transfers (treated as deposits)
    receive() external payable {
        if (msg.value >= MIN_DEPOSIT && !depositsPaused) {
            deposits[msg.sender] += msg.value;
            totalDeposits += msg.value;
            emit Deposited(msg.sender, msg.value, deposits[msg.sender], block.timestamp);
        }
    }
}
