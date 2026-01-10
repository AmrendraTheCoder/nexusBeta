const hre = require("hardhat");

async function main() {
  console.log("Testing basic deployment on:", hre.network.name);
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const SimpleTest = await hre.ethers.getContractFactory("SimpleTest");
  const test = await SimpleTest.deploy({ gasLimit: 500000 });
  await test.waitForDeployment();
  const testAddress = await test.getAddress();
  console.log("SimpleTest deployed to:", testAddress);
  
  const value = await test.getValue();
  console.log("Value:", value.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed:", error.message);
    process.exit(1);
  });
