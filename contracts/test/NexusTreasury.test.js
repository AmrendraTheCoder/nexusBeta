const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NexusTreasury", function () {
  let treasury;
  let owner;
  let user1;
  let user2;

  const MIN_DEPOSIT = ethers.parseEther("0.01");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const NexusTreasury = await ethers.getContractFactory("NexusTreasury");
    treasury = await NexusTreasury.deploy();
    await treasury.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await treasury.owner()).to.equal(owner.address);
    });

    it("Should start with zero total deposits", async function () {
      expect(await treasury.totalDeposits()).to.equal(0);
    });

    it("Should start with deposits not paused", async function () {
      expect(await treasury.depositsPaused()).to.equal(false);
    });
  });

  describe("Deposits", function () {
    it("Should accept deposits above minimum", async function () {
      const depositAmount = ethers.parseEther("1.0");
      
      const tx = await treasury.connect(user1).deposit({ value: depositAmount });
      const receipt = await tx.wait();
      
      // Check event was emitted with correct user and amount
      const depositEvent = receipt.logs.find(log => {
        try {
          return treasury.interface.parseLog(log)?.name === "Deposited";
        } catch { return false; }
      });
      expect(depositEvent).to.not.be.undefined;
      
      const parsedEvent = treasury.interface.parseLog(depositEvent);
      expect(parsedEvent.args[0]).to.equal(user1.address); // user
      expect(parsedEvent.args[1]).to.equal(depositAmount); // amount
      expect(parsedEvent.args[2]).to.equal(depositAmount); // newBalance
      
      expect(await treasury.deposits(user1.address)).to.equal(depositAmount);
      expect(await treasury.totalDeposits()).to.equal(depositAmount);
    });

    it("Should reject deposits below minimum", async function () {
      const smallAmount = ethers.parseEther("0.001");
      
      await expect(treasury.connect(user1).deposit({ value: smallAmount }))
        .to.be.revertedWithCustomError(treasury, "DepositTooSmall");
    });

    it("Should accumulate deposits for same user", async function () {
      const deposit1 = ethers.parseEther("1.0");
      const deposit2 = ethers.parseEther("2.0");
      
      await treasury.connect(user1).deposit({ value: deposit1 });
      await treasury.connect(user1).deposit({ value: deposit2 });
      
      expect(await treasury.deposits(user1.address)).to.equal(deposit1 + deposit2);
    });

    it("Should track deposits from multiple users", async function () {
      const amount1 = ethers.parseEther("1.0");
      const amount2 = ethers.parseEther("2.0");
      
      await treasury.connect(user1).deposit({ value: amount1 });
      await treasury.connect(user2).deposit({ value: amount2 });
      
      expect(await treasury.deposits(user1.address)).to.equal(amount1);
      expect(await treasury.deposits(user2.address)).to.equal(amount2);
      expect(await treasury.totalDeposits()).to.equal(amount1 + amount2);
    });

    it("Should reject deposits when paused", async function () {
      await treasury.setDepositsPaused(true);
      
      await expect(treasury.connect(user1).deposit({ value: MIN_DEPOSIT }))
        .to.be.revertedWithCustomError(treasury, "DepositsPausedError");
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      // Setup: user1 deposits 5 ETH
      await treasury.connect(user1).deposit({ value: ethers.parseEther("5.0") });
    });

    it("Should allow partial withdrawal", async function () {
      const withdrawAmount = ethers.parseEther("2.0");
      const initialBalance = await ethers.provider.getBalance(user1.address);
      
      const tx = await treasury.connect(user1).withdraw(withdrawAmount);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const finalBalance = await ethers.provider.getBalance(user1.address);
      expect(finalBalance).to.be.closeTo(initialBalance + withdrawAmount - gasUsed, ethers.parseEther("0.001"));
      expect(await treasury.deposits(user1.address)).to.equal(ethers.parseEther("3.0"));
    });

    it("Should allow full withdrawal", async function () {
      const fullAmount = ethers.parseEther("5.0");
      
      await expect(treasury.connect(user1).withdraw(fullAmount))
        .to.emit(treasury, "Withdrawn")
        .withArgs(user1.address, fullAmount, 0);
      
      expect(await treasury.deposits(user1.address)).to.equal(0);
    });

    it("Should reject withdrawal exceeding balance", async function () {
      const excessAmount = ethers.parseEther("10.0");
      
      await expect(treasury.connect(user1).withdraw(excessAmount))
        .to.be.revertedWithCustomError(treasury, "InsufficientBalance");
    });

    it("Should reject zero withdrawal", async function () {
      await expect(treasury.connect(user1).withdraw(0))
        .to.be.revertedWithCustomError(treasury, "ZeroAmount");
    });

    it("Should reject withdrawal from user with no deposits", async function () {
      await expect(treasury.connect(user2).withdraw(ethers.parseEther("1.0")))
        .to.be.revertedWithCustomError(treasury, "InsufficientBalance");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to pause deposits", async function () {
      await expect(treasury.setDepositsPaused(true))
        .to.emit(treasury, "DepositsPaused")
        .withArgs(true);
      
      expect(await treasury.depositsPaused()).to.equal(true);
    });

    it("Should allow owner to unpause deposits", async function () {
      await treasury.setDepositsPaused(true);
      await treasury.setDepositsPaused(false);
      
      expect(await treasury.depositsPaused()).to.equal(false);
    });

    it("Should reject non-owner from pausing", async function () {
      await expect(treasury.connect(user1).setDepositsPaused(true))
        .to.be.revertedWithCustomError(treasury, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner emergency withdraw", async function () {
      await treasury.connect(user1).deposit({ value: ethers.parseEther("10.0") });
      
      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      
      await expect(treasury.emergencyWithdrawAll())
        .to.emit(treasury, "EmergencyWithdraw");
      
      const contractBalance = await ethers.provider.getBalance(await treasury.getAddress());
      expect(contractBalance).to.equal(0);
    });
  });

  describe("Receive Function", function () {
    it("Should accept direct ETH transfers as deposits", async function () {
      const amount = ethers.parseEther("1.0");
      
      await user1.sendTransaction({
        to: await treasury.getAddress(),
        value: amount,
      });
      
      expect(await treasury.deposits(user1.address)).to.equal(amount);
    });
  });

  // Helper function
  async function getBlockTimestamp() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp;
  }
});
