/**
 * @fileoverview NexusTreasury Contract ABI
 * Exported for use in backend services
 */

module.exports = [
  "event Deposited(address indexed user, uint256 amount, uint256 newBalance, uint256 timestamp)",
  "event Withdrawn(address indexed user, uint256 amount, uint256 remainingBalance)",
  "event EmergencyWithdraw(address indexed owner, uint256 amount)",
  "event DepositsPaused(bool paused)",
  
  "function deposit() external payable",
  "function withdraw(uint256 amount) external",
  "function getBalance(address user) external view returns (uint256)",
  "function deposits(address) external view returns (uint256)",
  "function totalDeposits() external view returns (uint256)",
  "function MIN_DEPOSIT() external view returns (uint256)",
  "function depositsPaused() external view returns (bool)"
];
