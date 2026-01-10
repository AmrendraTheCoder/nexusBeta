// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NexusRegistry
 * @notice On-chain registry of data service providers for AI agents
 * @dev Providers register endpoints and prices, agents query for services
 */
contract NexusRegistry is Ownable {
    
    // ============ Structs ============
    
    struct Service {
        string endpoint;        // API endpoint URL
        uint256 priceInWei;     // Price per call in wei
        string category;        // Service category (news, sentiment, etc.)
        uint256 reputation;     // Cumulative reputation score
        uint256 totalEarned;    // Total earnings in wei
        uint256 totalCalls;     // Number of successful payments
        bool active;            // Whether service is active
        uint256 registeredAt;   // Registration timestamp
    }
    
    // ============ State Variables ============
    
    /// @notice Mapping of provider address to their service
    mapping(address => Service) public services;
    
    /// @notice List of all provider addresses
    address[] public providerList;
    
    /// @notice Mapping to check if provider exists
    mapping(address => bool) public isProvider;
    
    /// @notice Authorized payment executor (backend master wallet)
    address public paymentExecutor;
    
    /// @notice Minimum price for a service (anti-spam)
    uint256 public constant MIN_PRICE = 0.001 ether;
    
    // ============ Events ============
    
    event ServiceRegistered(
        address indexed provider,
        string endpoint,
        uint256 priceInWei,
        string category
    );
    
    event ServiceUpdated(
        address indexed provider,
        uint256 newPrice,
        bool active
    );
    
    event PaymentRecorded(
        address indexed provider,
        address indexed payer,
        uint256 amount,
        uint256 newReputation
    );
    
    event PaymentExecutorUpdated(address indexed newExecutor);
    
    // ============ Errors ============
    
    error EmptyEndpoint();
    error PriceTooLow(uint256 provided, uint256 minimum);
    error EmptyCategory();
    error NotProvider();
    error NotPaymentExecutor();
    error ProviderNotActive();
    error InsufficientPayment(uint256 sent, uint256 required);
    
    // ============ Modifiers ============
    
    modifier onlyPaymentExecutor() {
        if (msg.sender != paymentExecutor && msg.sender != owner()) {
            revert NotPaymentExecutor();
        }
        _;
    }
    
    modifier onlyActiveProvider(address provider) {
        if (!services[provider].active) revert ProviderNotActive();
        _;
    }
    
    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {
        paymentExecutor = msg.sender;
    }
    
    // ============ Provider Functions ============
    
    /**
     * @notice Register a new service or update existing
     * @param endpoint API endpoint URL
     * @param priceInWei Price per call in wei
     * @param category Service category
     */
    function registerService(
        string calldata endpoint,
        uint256 priceInWei,
        string calldata category
    ) external {
        if (bytes(endpoint).length == 0) revert EmptyEndpoint();
        if (priceInWei < MIN_PRICE) revert PriceTooLow(priceInWei, MIN_PRICE);
        if (bytes(category).length == 0) revert EmptyCategory();
        
        // If new provider, add to list
        if (!isProvider[msg.sender]) {
            providerList.push(msg.sender);
            isProvider[msg.sender] = true;
        }
        
        Service storage service = services[msg.sender];
        service.endpoint = endpoint;
        service.priceInWei = priceInWei;
        service.category = category;
        service.active = true;
        
        if (service.registeredAt == 0) {
            service.registeredAt = block.timestamp;
        }
        
        emit ServiceRegistered(msg.sender, endpoint, priceInWei, category);
    }
    
    /**
     * @notice Update service price and/or active status
     * @param newPrice New price in wei (0 to keep current)
     * @param active Whether service is active
     */
    function updateService(uint256 newPrice, bool active) external {
        if (!isProvider[msg.sender]) revert NotProvider();
        
        Service storage service = services[msg.sender];
        
        if (newPrice > 0) {
            if (newPrice < MIN_PRICE) revert PriceTooLow(newPrice, MIN_PRICE);
            service.priceInWei = newPrice;
        }
        
        service.active = active;
        
        emit ServiceUpdated(msg.sender, service.priceInWei, active);
    }
    
    // ============ Payment Functions ============
    
    /**
     * @notice Record a payment to a provider (called by payment executor)
     * @param provider Provider address
     * @param payer User who paid
     * @param amount Amount paid in wei
     */
    function recordPayment(
        address provider,
        address payer,
        uint256 amount
    ) external onlyPaymentExecutor onlyActiveProvider(provider) {
        Service storage service = services[provider];
        
        service.reputation += 1;
        service.totalEarned += amount;
        service.totalCalls += 1;
        
        emit PaymentRecorded(provider, payer, amount, service.reputation);
    }
    
    // ============ Query Functions ============
    
    /**
     * @notice Get all providers in a category
     * @param category Category to filter by
     * @return providers Array of provider addresses
     * @return prices Array of prices
     * @return reputations Array of reputation scores
     */
    function getServicesByCategory(string calldata category) 
        external 
        view 
        returns (
            address[] memory providers,
            uint256[] memory prices,
            uint256[] memory reputations
        ) 
    {
        // First pass: count matching providers
        uint256 count = 0;
        for (uint256 i = 0; i < providerList.length; i++) {
            Service storage s = services[providerList[i]];
            if (s.active && _stringsEqual(s.category, category)) {
                count++;
            }
        }
        
        // Allocate arrays
        providers = new address[](count);
        prices = new uint256[](count);
        reputations = new uint256[](count);
        
        // Second pass: populate arrays
        uint256 index = 0;
        for (uint256 i = 0; i < providerList.length; i++) {
            Service storage s = services[providerList[i]];
            if (s.active && _stringsEqual(s.category, category)) {
                providers[index] = providerList[i];
                prices[index] = s.priceInWei;
                reputations[index] = s.reputation;
                index++;
            }
        }
        
        return (providers, prices, reputations);
    }
    
    /**
     * @notice Get full service details for a provider
     * @param provider Provider address
     * @return endpoint API endpoint
     * @return priceInWei Price per call
     * @return category Service category
     * @return reputation Reputation score
     * @return totalCalls Total successful calls
     * @return active Whether service is active
     */
    function getServiceDetails(address provider) 
        external 
        view 
        returns (
            string memory endpoint,
            uint256 priceInWei,
            string memory category,
            uint256 reputation,
            uint256 totalCalls,
            bool active
        ) 
    {
        Service storage s = services[provider];
        return (
            s.endpoint,
            s.priceInWei,
            s.category,
            s.reputation,
            s.totalCalls,
            s.active
        );
    }
    
    /**
     * @notice Get total number of providers
     * @return count Number of registered providers
     */
    function getProviderCount() external view returns (uint256 count) {
        return providerList.length;
    }
    
    /**
     * @notice Get all active providers
     * @return activeProviders Array of active provider addresses
     */
    function getActiveProviders() external view returns (address[] memory activeProviders) {
        uint256 count = 0;
        for (uint256 i = 0; i < providerList.length; i++) {
            if (services[providerList[i]].active) count++;
        }
        
        activeProviders = new address[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < providerList.length; i++) {
            if (services[providerList[i]].active) {
                activeProviders[index] = providerList[i];
                index++;
            }
        }
        
        return activeProviders;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Set the payment executor address
     * @param newExecutor New executor address
     */
    function setPaymentExecutor(address newExecutor) external onlyOwner {
        paymentExecutor = newExecutor;
        emit PaymentExecutorUpdated(newExecutor);
    }
    
    // ============ Internal Functions ============
    
    /**
     * @notice Compare two strings for equality
     * @param a First string
     * @param b Second string
     * @return equal Whether strings are equal
     */
    function _stringsEqual(string storage a, string calldata b) 
        internal 
        view 
        returns (bool equal) 
    {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }
}
