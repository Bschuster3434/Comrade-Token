const { expect } = require("chai");

describe("Token contract", function () {
    let Token;
    let comradeToken;
    let protocolPerc;
    let owner;
    let addr1;
    let addr2;
    let protocolWallet;
    let addrs;

  beforeEach(async function () {
    [owner, addr1, addr2, protocolWallet, ...addrs] = await ethers.getSigners();

    protocolPerc = 1000; //10% Fee

    Token = await ethers.getContractFactory("ComradeToken");
    comradeToken = await Token.deploy(protocolPerc, protocolWallet.address);

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

      expect(await comradeToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("100"));
      
      await comradeToken.connect(addr1).transfer(addr2.address, ethers.utils.parseEther("10"));

      expect(await comradeToken.balanceOf(addr2.address)).to.equal(ethers.utils.parseEther("10"));
      expect(await comradeToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("89")); // 10 COMRADE - 1 COMRADE Fee
      expect(await comradeToken.balanceOf(protocolWallet.address)).to.equal(ethers.utils.parseEther("11"));
    })
  });
})