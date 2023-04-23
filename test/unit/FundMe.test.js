const { assert, expect } = require("chai");
const { network, deployments, getNamedAccounts, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", function () {
      let fundMe;
      let mockV3Aggregator;
      let deployer;
      const sendValue = ethers.utils.parseEther("1");

      beforeEach(async () => {
        // const accounts = await ethers.getSigners();
        // deployer = accounts[0]
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        fundMe = await ethers.getContract("FundMe", deployer);
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
      });

      describe("constructor", () => {
        it("should set the price feed address correctly", async () => {
          const adr = await fundMe.getPriceFeed();
          assert.equal(adr, mockV3Aggregator.address);
        });
      });

      describe("fund", () => {
        it("Fails if not enough money is sended", async () => {
          await expect(fundMe.fund()).to.be.reverted;
        });

        it("updates the amount funded data structure", async () => {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getAddressToAmountFunded(deployer);
          assert.equal(sendValue.toString(), response.toString());
        });

        it("should add the sender to the getFunder array", async () => {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getFunder(0);
          assert.equal(response, deployer);
        });
      });

      describe("withdraw", () => {
        beforeEach(async function () {
          await fundMe.fund({ value: sendValue });
        });

        it("should withdraw the funds from single founder", async function () {
          // Arrange
          const startingContractBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingFunderBalance = await fundMe.provider.getBalance(
            deployer
          );
          // Act
          const tx = await fundMe.withdraw();
          const txReceipt = await tx.wait(1);
          const { gasUsed, effectiveGasPrice } = txReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingCB = await fundMe.provider.getBalance(fundMe.address);
          const endingFB = await fundMe.provider.getBalance(deployer);
          // Assert
          /*  assert.notEqual(startingContractBalance, endingCB);
      assert.notEqual(startingFunderBalance, endingFB);*/
          assert.equal(endingCB, 0);
          assert.equal(
            startingContractBalance.add(startingFunderBalance).toString(),
            endingFB.add(gasCost).toString()
          );
        });

        it("allow to withdaw with multiple getFunder", async () => {
          // Arrange
          const accounts = await ethers.getSigners();
          let fundMeConnected;
          for (let i = 1; i < 5; i++) {
            fundMeConnected = await fundMe.connect(accounts[i]);
          }

          await fundMeConnected.fund({ value: sendValue });
          const startingContractBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingFunderBalance = await fundMe.provider.getBalance(
            deployer
          );

          // Act
          const txResponse = await fundMe.withdraw();
          const txReceipt = await txResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = txReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingCB = await fundMe.provider.getBalance(fundMe.address);
          const endingFB = await fundMe.provider.getBalance(deployer);
          // Assert
          assert.equal(endingCB, 0);
          assert.equal(
            startingContractBalance.add(startingFunderBalance).toString(),
            endingFB.add(gasCost).toString()
          );

          await expect(fundMe.getFunder(0)).to.be.reverted;

          for (let i = 1; i < 5; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });

        it("should allow only the owner to withdraw", async () => {
          const accounts = await ethers.getSigners();
          const badGuy = accounts[1];
          const badGuyFundMe = await fundMe.connect(badGuy);
          await expect(badGuyFundMe.withdraw()).to.be.revertedWithCustomError(
            fundMe,
            "FundMe__NotOwner"
          );
        });
      });

      describe("withdraw", () => {
        beforeEach(async function () {
          await fundMe.fund({ value: sendValue });
        });

        it("should withdraw the funds from single founder", async function () {
          // Arrange
          const startingContractBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingFunderBalance = await fundMe.provider.getBalance(
            deployer
          );
          // Act
          const tx = await fundMe.withdraw();
          const txReceipt = await tx.wait(1);
          const { gasUsed, effectiveGasPrice } = txReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingCB = await fundMe.provider.getBalance(fundMe.address);
          const endingFB = await fundMe.provider.getBalance(deployer);
          // Assert
          /*  assert.notEqual(startingContractBalance, endingCB);
      assert.notEqual(startingFunderBalance, endingFB);*/
          assert.equal(endingCB, 0);
          assert.equal(
            startingContractBalance.add(startingFunderBalance).toString(),
            endingFB.add(gasCost).toString()
          );
        });

        it("cheaperWithdraw test", async () => {
          // Arrange
          const accounts = await ethers.getSigners();
          let fundMeConnected;
          for (let i = 1; i < 5; i++) {
            fundMeConnected = await fundMe.connect(accounts[i]);
          }

          await fundMeConnected.fund({ value: sendValue });
          const startingContractBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingFunderBalance = await fundMe.provider.getBalance(
            deployer
          );

          // Act
          const txResponse = await fundMe.cheaperWithdraw();
          const txReceipt = await txResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = txReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingCB = await fundMe.provider.getBalance(fundMe.address);
          const endingFB = await fundMe.provider.getBalance(deployer);
          // Assert
          assert.equal(endingCB, 0);
          assert.equal(
            startingContractBalance.add(startingFunderBalance).toString(),
            endingFB.add(gasCost).toString()
          );

          await expect(fundMe.getFunder(0)).to.be.reverted;

          for (let i = 1; i < 5; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });

        it("should allow only the owner to withdraw", async () => {
          const accounts = await ethers.getSigners();
          const badGuy = accounts[1];
          const badGuyFundMe = await fundMe.connect(badGuy);
          await expect(badGuyFundMe.withdraw()).to.be.revertedWithCustomError(
            fundMe,
            "FundMe__NotOwner"
          );
        });
      });
    });
