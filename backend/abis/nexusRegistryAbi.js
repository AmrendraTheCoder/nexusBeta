/**
 * @fileoverview NexusRegistry Contract ABI
 * Exported for use in backend services
 */

module.exports = [
  "event ServiceRegistered(address indexed provider, string endpoint, uint256 priceInWei, string category)",
  "event ServiceUpdated(address indexed provider, uint256 newPrice, bool active)",
  "event PaymentRecorded(address indexed provider, address indexed payer, uint256 amount, uint256 newReputation)",
  "event PaymentExecutorUpdated(address indexed newExecutor)",
  
  "function registerService(string calldata endpoint, uint256 priceInWei, string calldata category) external",
  "function updateService(uint256 newPrice, bool active) external",
  "function recordPayment(address provider, address payer, uint256 amount) external",
  "function getServicesByCategory(string calldata category) external view returns (address[] memory providers, uint256[] memory prices, uint256[] memory reputations)",
  "function getServiceDetails(address provider) external view returns (string memory endpoint, uint256 priceInWei, string memory category, uint256 reputation, uint256 totalCalls, bool active)",
  "function getProviderCount() external view returns (uint256 count)",
  "function getActiveProviders() external view returns (address[] memory activeProviders)",
  "function setPaymentExecutor(address newExecutor) external",
  "function paymentExecutor() external view returns (address)",
  "function MIN_PRICE() external view returns (uint256)",
  "function services(address) external view returns (string memory endpoint, uint256 priceInWei, string memory category, uint256 reputation, uint256 totalEarned, uint256 totalCalls, bool active, uint256 registeredAt)"
];
