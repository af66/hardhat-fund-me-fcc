const { getNamedAccounts, ethers } = require("hardhat");

async function main() {
  const deployer = await getNamedAccounts().deployer;
  const fundMe = await ethers.getContract("FundMe", deployer);
  console.log("Funding contract...");
  const txResponse = await fundMe.fund({
    value: ethers.utils.parseEther("0.1"),
  });
  await txResponse.wait(1);
  console.log("funded!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
