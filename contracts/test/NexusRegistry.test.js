const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NexusRegistry", function () {
  let registry;
  let owner;
  let provider1;
  let provider2;
  let executor;
  let user;

  const MIN_PRICE = ethers.parseEther("0.001");

  beforeEach(async function () {
    [owner, provider1, provider2, executor, user] = await ethers.getSigners();
    
    const NexusRegistry = await ethers.getContractFactory("NexusRegistry");
    registry = await NexusRegistry.deploy();
    await registry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await registry.owner()).to.equal(owner.address);
    });

    it("Should set owner as initial payment executor", async function () {
      expect(await registry.paymentExecutor()).to.equal(owner.address);
    });

    it("Should start with zero providers", async function () {
      expect(await registry.getProviderCount()).to.equal(0);
    });
  });

  describe("Service Registration", function () {
    const endpoint = "https://api.example.com/news";
    const price = ethers.parseEther("0.1");
    const category = "news";

    it("Should allow provider to register service", async function () {
      await expect(registry.connect(provider1).registerService(endpoint, price, category))
        .to.emit(registry, "ServiceRegistered")
        .withArgs(provider1.address, endpoint, price, category);
      
      expect(await registry.isProvider(provider1.address)).to.equal(true);
      expect(await registry.getProviderCount()).to.equal(1);
    });

    it("Should store correct service details", async function () {
      await registry.connect(provider1).registerService(endpoint, price, category);
      
      const details = await registry.getServiceDetails(provider1.address);
      expect(details.endpoint).to.equal(endpoint);
      expect(details.priceInWei).to.equal(price);
      expect(details.category).to.equal(category);
      expect(details.active).to.equal(true);
      expect(details.reputation).to.equal(0);
    });

    it("Should reject empty endpoint", async function () {
      await expect(registry.connect(provider1).registerService("", price, category))
        .to.be.revertedWithCustomError(registry, "EmptyEndpoint");
    });

    it("Should reject price below minimum", async function () {
      const lowPrice = ethers.parseEther("0.0001");
      await expect(registry.connect(provider1).registerService(endpoint, lowPrice, category))
        .to.be.revertedWithCustomError(registry, "PriceTooLow");
    });

    it("Should reject empty category", async function () {
      await expect(registry.connect(provider1).registerService(endpoint, price, ""))
        .to.be.revertedWithCustomError(registry, "EmptyCategory");
    });

    it("Should allow updating existing registration", async function () {
      await registry.connect(provider1).registerService(endpoint, price, category);
      
      const newEndpoint = "https://api.v2.example.com/news";
      const newPrice = ethers.parseEther("0.2");
      
      await registry.connect(provider1).registerService(newEndpoint, newPrice, category);
      
      const details = await registry.getServiceDetails(provider1.address);
      expect(details.endpoint).to.equal(newEndpoint);
      expect(details.priceInWei).to.equal(newPrice);
      
      // Should not duplicate in provider list
      expect(await registry.getProviderCount()).to.equal(1);
    });
  });

  describe("Service Update", function () {
    beforeEach(async function () {
      await registry.connect(provider1).registerService(
        "https://api.example.com",
        ethers.parseEther("0.1"),
        "news"
      );
    });

    it("Should allow provider to update price", async function () {
      const newPrice = ethers.parseEther("0.2");
      
      await expect(registry.connect(provider1).updateService(newPrice, true))
        .to.emit(registry, "ServiceUpdated")
        .withArgs(provider1.address, newPrice, true);
      
      const details = await registry.getServiceDetails(provider1.address);
      expect(details.priceInWei).to.equal(newPrice);
    });

    it("Should allow provider to deactivate service", async function () {
      await registry.connect(provider1).updateService(0, false);
      
      const details = await registry.getServiceDetails(provider1.address);
      expect(details.active).to.equal(false);
    });

    it("Should reject non-provider update", async function () {
      await expect(registry.connect(provider2).updateService(ethers.parseEther("0.2"), true))
        .to.be.revertedWithCustomError(registry, "NotProvider");
    });
  });

  describe("Payment Recording", function () {
    beforeEach(async function () {
      await registry.connect(provider1).registerService(
        "https://api.example.com",
        ethers.parseEther("0.1"),
        "news"
      );
      await registry.setPaymentExecutor(executor.address);
    });

    it("Should allow payment executor to record payment", async function () {
      const amount = ethers.parseEther("0.1");
      
      await expect(registry.connect(executor).recordPayment(provider1.address, user.address, amount))
        .to.emit(registry, "PaymentRecorded")
        .withArgs(provider1.address, user.address, amount, 1);
      
      const details = await registry.getServiceDetails(provider1.address);
      expect(details.reputation).to.equal(1);
      expect(details.totalCalls).to.equal(1);
    });

    it("Should accumulate reputation over multiple payments", async function () {
      const amount = ethers.parseEther("0.1");
      
      await registry.connect(executor).recordPayment(provider1.address, user.address, amount);
      await registry.connect(executor).recordPayment(provider1.address, user.address, amount);
      await registry.connect(executor).recordPayment(provider1.address, user.address, amount);
      
      const details = await registry.getServiceDetails(provider1.address);
      expect(details.reputation).to.equal(3);
      expect(details.totalCalls).to.equal(3);
    });

    it("Should reject payment recording from non-executor", async function () {
      await expect(registry.connect(user).recordPayment(provider1.address, user.address, ethers.parseEther("0.1")))
        .to.be.revertedWithCustomError(registry, "NotPaymentExecutor");
    });

    it("Should reject payment to inactive provider", async function () {
      await registry.connect(provider1).updateService(0, false);
      
      await expect(registry.connect(executor).recordPayment(provider1.address, user.address, ethers.parseEther("0.1")))
        .to.be.revertedWithCustomError(registry, "ProviderNotActive");
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      // Register multiple providers
      await registry.connect(provider1).registerService(
        "https://news1.example.com",
        ethers.parseEther("0.1"),
        "news"
      );
      await registry.connect(provider2).registerService(
        "https://sentiment.example.com",
        ethers.parseEther("0.2"),
        "sentiment"
      );
    });

    it("Should return services by category", async function () {
      const [providers, prices, reputations] = await registry.getServicesByCategory("news");
      
      expect(providers.length).to.equal(1);
      expect(providers[0]).to.equal(provider1.address);
      expect(prices[0]).to.equal(ethers.parseEther("0.1"));
    });

    it("Should return empty for non-existent category", async function () {
      const [providers, prices, reputations] = await registry.getServicesByCategory("nonexistent");
      
      expect(providers.length).to.equal(0);
    });

    it("Should exclude inactive providers from category query", async function () {
      await registry.connect(provider1).updateService(0, false);
      
      const [providers, , ] = await registry.getServicesByCategory("news");
      expect(providers.length).to.equal(0);
    });

    it("Should return all active providers", async function () {
      const activeProviders = await registry.getActiveProviders();
      
      expect(activeProviders.length).to.equal(2);
      expect(activeProviders).to.include(provider1.address);
      expect(activeProviders).to.include(provider2.address);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update payment executor", async function () {
      await expect(registry.setPaymentExecutor(executor.address))
        .to.emit(registry, "PaymentExecutorUpdated")
        .withArgs(executor.address);
      
      expect(await registry.paymentExecutor()).to.equal(executor.address);
    });

    it("Should reject non-owner from updating executor", async function () {
      await expect(registry.connect(user).setPaymentExecutor(executor.address))
        .to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });
  });
});
