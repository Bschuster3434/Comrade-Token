// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ComradeToken is ERC20, ERC20Burnable, Ownable {
    uint16 private protocolDenomenator = 10 ** 4;
    uint16 private protocolPerc;
    address payable private protocolWallet;
    mapping(address => uint256) allowanceHolding;

    struct addressStatistic {
        uint256 totalFeesPaid;
        uint256 totalTokensSent;
        bool exemptStatus;
    }
    mapping(address => addressStatistic) private addressStats;

    constructor(
        uint16 _protocolPerc, 
        address payable _protocolWallet,
        string memory _tokenName,
        string memory _tokenSymbol
    ) ERC20(_tokenName, _tokenSymbol) {
        require(_protocolPerc <= protocolDenomenator, "Cannot set protocol greater than 100%");
        _mint(msg.sender, 1000000000 * 18 ** decimals());
        protocolPerc = _protocolPerc; // protocol percentage is ( protocalPerc / 10 ** 4)
        protocolWallet = _protocolWallet;
    }

    modifier requireProtocolFee(
        address _from,
        uint256 _amount
    ) {
        require(balanceOf(_from) >= _amount, "ERC20: transfer amount exceeds balance");
        if(!addressStats[_from].exemptStatus) {
            require(checkProtocolFee(_from, _amount), "COMRADE: Cannot pay protocol fee");
        }         
        _;
    }

    function getAllowanceHolding(address _user) public view returns (uint256) {
        return allowanceHolding[_user];
    }

    function getTotalFeesPaid(address _user) public view returns (uint256) {
        return addressStats[_user].totalFeesPaid;
    }

    function getTotalTokensSent(address _user) public view returns (uint256) {
        return addressStats[_user].totalTokensSent;
    }

    function getProtocolPerc() public view returns (uint16) {
        return protocolPerc;
    }

    function getProtocolWallet() public view returns (address) {
        return protocolWallet;
    }

    function getExemptStatus(address _user) public view returns (bool) {
        return addressStats[_user].exemptStatus;
    }

    function setProtocolPerc(uint16 _newProtocolPerc) external onlyOwner {
        require(_newProtocolPerc <= protocolDenomenator, "Cannot set protocol greater than 100%");
        protocolPerc = _newProtocolPerc;
    }

    function setProtocolWallet(address payable _newProtocolWallet) external onlyOwner {
        protocolWallet = _newProtocolWallet;
    }

    function addExemptAddress(address _user) external onlyOwner {
        require(!addressStats[_user].exemptStatus, "Account is already exempt");
        addressStats[_user].exemptStatus = true;
    }

    function removeExemptAddress(address _user) external onlyOwner {
        require(addressStats[_user].exemptStatus, "Account is not exempt");
        addressStats[_user].exemptStatus = false;
    }    

    function calculateProtocolFee(
        uint256 _amount
    ) public view returns (uint256) {
        return (_amount * protocolPerc) / protocolDenomenator;
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
    ) public override requireProtocolFee(_msgSender(), _amount) returns (bool) {
        address owner = _msgSender();

        if(!addressStats[owner].exemptStatus) {
            uint256 protocolFee = calculateProtocolFee(_amount);
            addressStats[owner].totalFeesPaid += protocolFee;
            _transfer(owner, protocolWallet, calculateProtocolFee(_amount));
        }

        addressStats[owner].totalTokensSent += _amount;
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

        if(!addressStats[_from].exemptStatus) {
            addressStats[_from].totalFeesPaid += protocolFee;
            allowanceHolding[_from] -= protocolFee;
            _transfer(_from, protocolWallet, protocolFee);
        }

        addressStats[_from].totalTokensSent += _amount;
        _spendAllowance(_from, spender, _amount);
        _transfer(_from, _to, _amount);
        return true;
    }

    function approve(
        address _spender, 
        uint256 _amount
    ) public override requireProtocolFee(_msgSender(), _amount) returns (bool) {
        address owner = _msgSender();
        if(!addressStats[owner].exemptStatus) {
            allowanceHolding[owner] += calculateProtocolFee(_amount);
        }
        _approve(owner, _spender, _amount);
        return true;
    }

    function increaseAllowance(
        address _spender, 
        uint256 _addedValue
    ) public override requireProtocolFee(_msgSender(), _addedValue) returns (bool) {
        address owner = _msgSender();
        if(!addressStats[owner].exemptStatus) {
            allowanceHolding[owner] += calculateProtocolFee(_addedValue);
        }
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
            if(!addressStats[owner].exemptStatus) {
                allowanceHolding[owner] -= calculateProtocolFee(_subtractedValue);
            }
            _approve(owner, _spender, currentAllowance - _subtractedValue);
        }
        return true;
    }

}
