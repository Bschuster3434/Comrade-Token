const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Token contract", function () {
    let Token;
    let comradeToken;
    let protocolPerc;
    let owner;
    let addr1;
    let addr2;
    let addr3;
    let protocolWallet;
    let addrs;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, protocolWallet, ...addrs] = await ethers.getSigners();

    protocolPerc = 1000; //10% Fee

    Token = await ethers.getContractFactory("ComradeToken");
    comradeToken = await Token.deploy(protocolPerc, protocolWallet.address, "Comrade Token", "COMRADE");

  });
  describe("Deployment", function () {
    it("Should assign the total supply of tokens to the owner", async function () {
        const ownerBalance = await comradeToken.balanceOf(owner.address);
        expect(await comradeToken.totalSupply()).to.equal(ownerBalance);
      });  
      
    it("Deployment should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await comradeToken.balanceOf(owner.address);
      expect(await comradeToken.totalSupply()).to.equal(ownerBalance);
    });

    it("Should not allow me to deploy with a protocalPerc over 10000", async function () {
      await expect(Token.deploy(10001, protocolWallet.address, "Comrade Token 2", "COMRADE2"))
        .to.be.revertedWith("Cannot set protocol greater than 100%");
    });

  })

  describe("Owner functions", function () {
    it("Should create an owner when deployed", async function () {
      expect(await comradeToken.owner()).to.equal(owner.address);
    })

    it("Should allow the owner to change the protocol percent", async function () {
      expect(await comradeToken.getProtocolPerc()).to.equal(1000);

      await comradeToken.setProtocolPerc(500);

      expect(await comradeToken.getProtocolPerc()).to.equal(500);
    })

    it("Should not allow the owner to change the protocol percent above 100%", async function () {
      await expect(comradeToken.setProtocolPerc(10001))
        .to.be.revertedWith("Cannot set protocol greater than 100%");
      await expect(comradeToken.setProtocolPerc((2 ** 16) - 1))
        .to.be.revertedWith("Cannot set protocol greater than 100%");        
    })

    it("Should allow the owner to change the protocolWallet address", async function () {
      expect(await comradeToken.getProtocolWallet()).to.equal(protocolWallet.address);

      await comradeToken.setProtocolWallet(addr3.address);

      expect(await comradeToken.getProtocolWallet()).to.equal(addr3.address);
    })

    it("Allows the owner to exempt accounts from paying fees", async function () {
      expect(await comradeToken.getExemptStatus(addr1.address)).to.equal(false);

      await comradeToken.addExemptAddress(addr1.address);

      expect(await comradeToken.getExemptStatus(addr1.address)).to.equal(true);
    })

    it("Does not allow me to exempt an account if it's already exempt", async function () {
      await comradeToken.addExemptAddress(addr1.address);
      await expect(comradeToken.addExemptAddress(addr1.address))
        .to.be.revertedWith("Account is already exempt");
    })
    
    it("Allows the owner to remove exempt accounts", async function () {
      await comradeToken.addExemptAddress(addr1.address);
      await comradeToken.removeExemptAddress(addr1.address);
      expect(await comradeToken.getExemptStatus(addr1.address)).to.equal(false);
    }) 

    it("Does not allow me to remove an exempt account if it's not exempt", async function () {
      await expect(comradeToken.removeExemptAddress(addr1.address))
        .to.be.revertedWith("Account is not exempt");      
    })

  })

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      // Transfer 50 tokens from owner to addr1
      await comradeToken.transfer(addr1.address, ethers.utils.parseEther("50"));
      const addr1Balance = await comradeToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(ethers.utils.parseEther("50"));

      // Transfer 50 tokens from addr1 to addr2
      // We use .connect(signer) to send a transaction from another account
      await comradeToken.connect(addr1).transfer(addr2.address, ethers.utils.parseEther("40"));
      const addr2Balance = await comradeToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(ethers.utils.parseEther("40"));
    });

    it("Should fail if sender doesn’t have enough tokens", async function () {
      const initialOwnerBalance = await comradeToken.balanceOf(owner.address);

      // Try to send 1 token from addr1 (0 tokens) to owner (1000000 tokens).
      // `require` will evaluate false and revert the transaction.
      await expect(
        comradeToken.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      // Owner balance shouldn't have changed.
      expect(await comradeToken.balanceOf(owner.address)).to.equal(
        initialOwnerBalance
      );
    });

    it("Should update balances after transfers", async function () {
      const initialOwnerBalance = await comradeToken.balanceOf(owner.address);

      // Transfer 100000 tokens from owner to addr1.
      await comradeToken.transfer(addr1.address, 100000);

      // Transfer another 50 tokens from owner to addr2.
      await comradeToken.transfer(addr2.address, 50000);

      // Check balances.
      const finalOwnerBalance = await comradeToken.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance.sub(150000 + 15000));

      const addr1Balance = await comradeToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(100000);

      const addr2Balance = await comradeToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50000);
    });

    it("Should tax the sender when sending out a fee", async function () {
      await comradeToken.transfer(addr1.address, ethers.utils.parseEther("100"));

      await comradeToken.connect(addr1).transfer(addr2.address, ethers.utils.parseEther("10"));

      expect(await comradeToken.balanceOf(addr2.address)).to.equal(ethers.utils.parseEther("10"));
      expect(await comradeToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("89")); // 10 COMRADE - 1 COMRADE Fee
      expect(await comradeToken.balanceOf(protocolWallet.address)).to.equal(ethers.utils.parseEther("11"));
    })

    it("Should allow an exempt account to not have to pay fees", async function () {
      await comradeToken.addExemptAddress(addr1.address);
      await comradeToken.transfer(addr1.address, ethers.utils.parseEther("1000"));

      await comradeToken.connect(addr1).transfer(addr2.address, ethers.utils.parseEther("500"));
      await comradeToken.connect(addr1).transfer(addr3.address, ethers.utils.parseEther("500"));

      expect(await comradeToken.balanceOf(addr1.address)).to.equal(0);
      expect(await comradeToken.getTotalTokensSent(addr1.address)).to.equal(ethers.utils.parseEther("1000"));
      expect(await comradeToken.getTotalFeesPaid(addr1.address)).to.equal(0);
    })
    
    it("Should make an account pay a fee after it's been made exempt", async function () {
      await comradeToken.addExemptAddress(addr1.address);
      await comradeToken.transfer(addr1.address, ethers.utils.parseEther("1000"));

      await comradeToken.connect(addr1).transfer(addr2.address, ethers.utils.parseEther("500"));
      expect(await comradeToken.getTotalFeesPaid(addr1.address)).to.equal(0);

      await comradeToken.removeExemptAddress(addr1.address);
      await comradeToken.connect(addr1).transfer(addr2.address, ethers.utils.parseEther("400"));
      expect(await comradeToken.getTotalFeesPaid(addr1.address)).to.equal(ethers.utils.parseEther("40"));
      expect(await comradeToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("60"))
    }) 

    it("Should make an exempt account not pay fees on approved funds", async function () {
      await comradeToken.addExemptAddress(addr1.address);
      await comradeToken.transfer(addr1.address, ethers.utils.parseEther("1000"));
      let protocolWalletStartBalance = await comradeToken.balanceOf(protocolWallet.address);
      
      await comradeToken.connect(addr1).approve(addr2.address, ethers.utils.parseEther("1000"))

      await comradeToken.connect(addr2).transferFrom(addr1.address, addr3.address, ethers.utils.parseEther("500"))
      expect(await comradeToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("500"));
      expect(await comradeToken.balanceOf(protocolWallet.address)).to.equal(protocolWalletStartBalance);

      await comradeToken.connect(addr2).transferFrom(addr1.address, addr3.address, ethers.utils.parseEther("500"))
      expect(await comradeToken.balanceOf(addr1.address)).to.equal(0);
      expect(await comradeToken.balanceOf(protocolWallet.address)).to.equal(protocolWalletStartBalance)
    })

    it("Should not increase the allowanceHolding on exempt accounts", async function () {
      await comradeToken.addExemptAddress(addr1.address);
      await comradeToken.transfer(addr1.address, ethers.utils.parseEther("1000"));
      
      await comradeToken.connect(addr1).approve(addr2.address, ethers.utils.parseEther("500"))
      expect(await comradeToken.getAllowanceHolding(addr1.address)).to.equal(0);

      await comradeToken.connect(addr1).increaseAllowance(addr2.address, ethers.utils.parseEther("200"));
      expect(await comradeToken.getAllowanceHolding(addr1.address)).to.equal(0);

      await comradeToken.connect(addr1).decreaseAllowance(addr2.address, ethers.utils.parseEther("100"));
      expect(await comradeToken.getAllowanceHolding(addr1.address)).to.equal(0);      
    })
  });
  describe("Account Approvals", function () {
    it("Should tax the sender when approving tokens for another account", async function () {
      await comradeToken.transfer(addr1.address, ethers.utils.parseEther("100"));

      await comradeToken.connect(addr1).approve(addr2.address, ethers.utils.parseEther("50"));

      expect(await comradeToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("100"));
      expect(await comradeToken.balanceOf(addr2.address)).to.equal(0);
      expect(await comradeToken.balanceOf(protocolWallet.address)).to.equal(ethers.utils.parseEther("10"));
      expect(await comradeToken.getAllowanceHolding(addr1.address)).to.equal(ethers.utils.parseEther("5"));

      await comradeToken.connect(addr2).transferFrom(addr1.address, addr2.address, ethers.utils.parseEther("50"));

      expect(await comradeToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("45"));
      expect(await comradeToken.balanceOf(addr2.address)).to.equal(ethers.utils.parseEther("50"));
      expect(await comradeToken.balanceOf(protocolWallet.address)).to.equal(ethers.utils.parseEther("15"));
      expect(await comradeToken.getAllowanceHolding(addr1.address)).to.equal(0);
    })

    it("Should tax me additional funds if I increase my allownace", async function () {
      await comradeToken.transfer(addr1.address, ethers.utils.parseEther("100"));

      await comradeToken.connect(addr1).approve(addr2.address, ethers.utils.parseEther("50"));

      await comradeToken.connect(addr1).increaseAllowance(addr2.address, ethers.utils.parseEther("10"));

      expect(await comradeToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("100"));
      expect(await comradeToken.balanceOf(protocolWallet.address)).to.equal(ethers.utils.parseEther("10"));
      expect(await comradeToken.getAllowanceHolding(addr1.address)).to.equal(ethers.utils.parseEther("6"));
    })

    it("Should tax me less funds if I decrease my allownance", async function () {
      await comradeToken.transfer(addr1.address, ethers.utils.parseEther("100"));

      await comradeToken.connect(addr1).approve(addr2.address, ethers.utils.parseEther("50"));

      await comradeToken.connect(addr1).decreaseAllowance(addr2.address, ethers.utils.parseEther("10"));
      
      expect(await comradeToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("100"));
      expect(await comradeToken.balanceOf(protocolWallet.address)).to.equal(ethers.utils.parseEther("10"));
      expect(await comradeToken.getAllowanceHolding(addr1.address)).to.equal(ethers.utils.parseEther("4"));  
    })

    it("Should not allow approved tokens to be spent if the fee is not available", async function () {
      await comradeToken.transfer(addr1.address, ethers.utils.parseEther("100"));

      await comradeToken.connect(addr1).approve(addr2.address, ethers.utils.parseEther("50"));

      await comradeToken.connect(addr1).transfer(addr3.address, ethers.utils.parseEther("50"));

      await expect(
        comradeToken.connect(addr2)
        .transferFrom(addr1.address, addr2.address, ethers.utils.parseEther("50")))
        .to.be.revertedWith("ERC20: transfer amount exceeds balance");

      expect(await comradeToken.balanceOf(addr2.address)).to.equal(0);
      
      await comradeToken.connect(addr1).transfer(addr3.address, ethers.utils.parseEther("40"));

      await expect(
        comradeToken.connect(addr2)
        .transferFrom(addr1.address, addr2.address, ethers.utils.parseEther("1")))
        .to.be.revertedWith("ERC20: transfer amount exceeds balance");

      comradeToken.connect(addr2).transferFrom(addr1.address, addr2.address, ethers.utils.parseEther("0.001"));
    })

    it("Should only allow for paying taxes on the current approvals, not past approvals", async function () {
      await comradeToken.transfer(addr1.address, ethers.utils.parseEther("10000"))

      await comradeToken.connect(addr1).approve(addr3.address, ethers.utils.parseEther("100"));
      expect(await comradeToken.getAllowanceHolding(addr1.address)).to.equal(ethers.utils.parseEther("10"));

      await comradeToken.connect(addr1).approve(addr3.address, ethers.utils.parseEther("10"));
      expect(await comradeToken.getAllowanceHolding(addr1.address)).to.equal(ethers.utils.parseEther("1"));

      await comradeToken.connect(addr3).transferFrom(addr1.address, addr2.address, ethers.utils.parseEther("5"));
      await comradeToken.connect(addr1).approve(addr3.address, 0);
      expect(await comradeToken.getAllowanceHolding(addr1.address)).to.equal(0);
    })
  })
  describe("AccountStatistics", function () {
    beforeEach(async function () {
      await comradeToken.transfer(addr1.address, ethers.utils.parseEther("1000"));
    })
    it("Should give me the total tax paid by an account", async function () {
      expect(await comradeToken.getTotalFeesPaid(addr1.address)).to.equal(0);

      await comradeToken.connect(addr1).transfer(addr2.address, ethers.utils.parseEther("10"));

      expect(await comradeToken.getTotalFeesPaid(addr1.address)).to.equal(ethers.utils.parseEther("1"));

      await comradeToken.connect(addr1).transfer(addr2.address, ethers.utils.parseEther("15"));

      expect(await comradeToken.getTotalFeesPaid(addr1.address)).to.equal(ethers.utils.parseEther("2.5"));
    })
    
    it("Should not increase fees paid if called approve or allowance functions", async function () {
      await comradeToken.connect(addr1).approve(addr2.address, ethers.utils.parseEther("10"));
      await comradeToken.connect(addr1).increaseAllowance(addr2.address, ethers.utils.parseEther("5"));
      await comradeToken.connect(addr1).decreaseAllowance(addr2.address, ethers.utils.parseEther(".005"));
      
      expect(await comradeToken.getTotalFeesPaid(addr1.address)).to.equal(0);
    })

    it("Should accurately tell me how much of the COMRADE token was sent by successful transfers", async function () {
      await comradeToken.connect(addr1).transfer(addr2.address, ethers.utils.parseEther("100"));
      await comradeToken.connect(addr1).transfer(addr2.address, ethers.utils.parseEther("400"));
      await expect(comradeToken.connect(addr1).transfer(addr2.address, ethers.utils.parseEther("500")))
        .to.be.revertedWith("ERC20: transfer amount exceeds balance");
      await expect(comradeToken.connect(addr1).transfer(addr2.address, ethers.utils.parseEther("450")))
        .to.be.revertedWith("COMRADE: Cannot pay protocol fee");
        
      expect(await comradeToken.getTotalTokensSent(addr1.address)).to.equal(ethers.utils.parseEther("500"));
    })

    it("Should accurately tell me how much of the COMRADE token was sent by successful transferFrom", async function () {
      await comradeToken.connect(addr1).approve(addr2.address, ethers.utils.parseEther("100"));
      await comradeToken.connect(addr1).approve(addr2.address, ethers.utils.parseEther("400"));

      expect(await comradeToken.getTotalTokensSent(addr1.address)).to.equal(0);

      await comradeToken.connect(addr2).transferFrom(addr1.address, addr3.address, ethers.utils.parseEther("50"))

      expect(await comradeToken.getTotalTokensSent(addr1.address)).to.equal(ethers.utils.parseEther("50"));
    })
  });

  describe("Smart Contract Sends", function () {
    beforeEach(async function () {
      Wallet = await ethers.getContractFactory("SharedWallet");
      wallet = await Wallet.deploy(comradeToken.address);

      await comradeToken.transfer(wallet.address, ethers.utils.parseEther("1000"));
    });
    it("Should have smart contracts send only exact amounts and be taxed on the post send amount", async function () {
      let protocolWalletBalanceStart = await comradeToken.balanceOf(protocolWallet.address);

      await wallet.transferCOMRADETo(addr3.address, ethers.utils.parseEther("11"));

      let protocolWalletBalanceEnd = await comradeToken.balanceOf(protocolWallet.address);

      expect(protocolWalletBalanceEnd).to.equal(protocolWalletBalanceStart.add(ethers.utils.parseEther("1")));
      expect(await comradeToken.balanceOf(addr3.address)).to.equal(ethers.utils.parseEther("10"));
    });

    it("Should allow my smart contract wallet to only send the exact tax amount", async function () {
      let protocolWalletBalanceStart = await comradeToken.balanceOf(protocolWallet.address);

      await wallet.transferCOMRADETo(addr3.address, ethers.utils.parseEther("42"));

      expect(await comradeToken.balanceOf(wallet.address))
        .to.equal(ethers.utils.parseEther(String(1000 - 42)));

      await wallet.transferCOMRADETo(addr3.address, ethers.utils.parseEther("958"));
      expect(await comradeToken.balanceOf(wallet.address))
        .to.equal(0);

    })
    it("Should have smart contract only add or subtract pre send tax amounts on approvals", async function () {
      await wallet.approve(addr3.address, ethers.utils.parseEther("33"));

      expect(await comradeToken.getAllowanceHolding(wallet.address)).to.equal(ethers.utils.parseEther("3"));
    });
  });
});