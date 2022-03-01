// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract ComradeToken is ERC20, ERC20Burnable {
    uint16 private protocolPerc;
    address payable private protocolWallet;
    mapping(address => uint256) allowanceHolding;

    constructor(
        uint16 _protocolPerc, 
        address payable _protocolWallet,
        string memory _tokenName,
        string memory _tokenSymbol
    ) ERC20(_tokenName, _tokenSymbol) {
        _mint(msg.sender, 1000000000 * 18 ** decimals());
        protocolPerc = _protocolPerc; // protocol percentage is ( protocalPerc / 10 ** 4)
        protocolWallet = _protocolWallet;
    }

    modifier requireProtocolFee(
        uint256 _amount
    ) {
        address owner = _msgSender();
        require(balanceOf(owner) >= _amount, "ERC20: transfer amount exceeds balance");
        require(checkProtocolFee(owner, _amount), "COMRADE: Cannot pay protocol fee");         
        _;
    }

    function getAllowanceHolding(address _user) public view returns (uint256) {
        return allowanceHolding[_user];
    }

    function calculateProtocolFee(
        uint256 _amount
    ) public view returns (uint256) {
        return (_amount * protocolPerc) / (10 ** 4);
    }

    function checkProtocolFee(
        address _sender, 
        uint256 _amount
    ) private view returns (bool) {
        // Check if there is enough money in the account to be able
        // To pay for the Protocol Fee      
        uint256 amountPlusProtocolFee = _amount + calculateProtocolFee(_amount);
        return balanceOf(_sender) >= amountPlusProtocolFee;
    }

    function transfer(
        address _to, 
        uint256 _amount
    ) public override requireProtocolFee(_amount) returns (bool) {
        address owner = _msgSender();
        _transfer(owner, protocolWallet, calculateProtocolFee(_amount));
        _transfer(owner, _to, _amount);
        return true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _amount
    ) public override returns (bool) {
        address spender = _msgSender();
        uint256 protocolFee = calculateProtocolFee(_amount);

        _transfer(_from, protocolWallet, protocolFee);
        allowanceHolding[_from] -= protocolFee;

        _spendAllowance(_from, spender, _amount);
        _transfer(_from, _to, _amount);
        return true;
    }

    function approve(
        address _spender, 
        uint256 _amount
    ) public override requireProtocolFee(_amount) returns (bool) {
        address owner = _msgSender();
        allowanceHolding[owner] += calculateProtocolFee(_amount);
        _approve(owner, _spender, _amount);
        return true;
    }

    function increaseAllowance(
        address _spender, 
        uint256 _addedValue
    ) public override requireProtocolFee(_addedValue) returns (bool) {
        address owner = _msgSender();
        allowanceHolding[owner] += calculateProtocolFee(_addedValue);
        _approve(owner, _spender, allowance(owner, _spender) + _addedValue);
        return true;
    }

    function decreaseAllowance(
        address _spender, 
        uint256 _subtractedValue
    ) public override returns (bool) {
        address owner = _msgSender();
        uint256 currentAllowance = allowance(owner, _spender);
        require(currentAllowance >= _subtractedValue, "ERC20: decreased allowance below zero");
        unchecked {
            allowanceHolding[owner] -= calculateProtocolFee(_subtractedValue);
            _approve(owner, _spender, currentAllowance - _subtractedValue);
        }

        return true;
    }

}
