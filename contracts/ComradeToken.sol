// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract ComradeToken is ERC20, ERC20Burnable {
    uint16 protocolPerc;
    address payable private protocolWallet;

    constructor(uint16 _protocolPerc, address payable _protocolWallet) ERC20("Comrade Token", "COMRADE") {
        _mint(msg.sender, 1000000000 * 18 ** decimals());
        protocolPerc = _protocolPerc; // protocol percentage is ( protocalPerc / 10 ** 4)
        protocolWallet = _protocolWallet;
    }

    // Overrides the transfer function for the ERC20 tokens
    // In order for the transfer to be allowed, a protocol fee
    // Needs to be paid upon send
    function transfer(address _to, uint256 _amount) public override returns (bool) {
        address owner = _msgSender();
        require(balanceOf(owner) >= _amount, "ERC20: transfer amount exceeds balance");
        
        uint256 protocolFee = (_amount * protocolPerc) / (10 ** 4);
        uint256 amountPlusProtocolFee = _amount + protocolFee;
        require(balanceOf(owner) >= amountPlusProtocolFee, "COMRADE: Cannot pay protocol fee"); // balance of tokens must be greater than the amount + protocol fee

        
        _transfer(owner, protocolWallet, protocolFee);
        _transfer(owner, _to, _amount);
        return true;
    }    
}
