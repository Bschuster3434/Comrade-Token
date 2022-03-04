// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract ComradeToken is ERC20, ERC20Burnable, Ownable {

    using Address for address;

    uint16 private protocolDenomenator = 10 ** 4;
    uint16 private protocolPerc;
    address payable private protocolWallet;
    mapping(address => uint256) allowanceHolding;

    struct addressStatistic {
        uint256 totalFeesPaid;
        uint256 totalTokensSent;
        bool feeExemptStatus;
    }
    mapping(address => addressStatistic) private addressStats;

    event FeesPaid(address _payer, uint feesPaid);
    event AddedExemptAddress(address _account);
    event RemoveExemptAddress(address _account);

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
        if(!addressStats[_from].feeExemptStatus) {
            require(checkProtocolFee(_from, _amount), "COMRADE: Cannot pay protocol fee");
        }         
        _;
    }

    /// Getter Functions

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
        return addressStats[_user].feeExemptStatus;
    }

    // Setter Functions

    function setProtocolPerc(uint16 _newProtocolPerc) external onlyOwner {
        require(_newProtocolPerc <= protocolDenomenator, "Cannot set protocol greater than 100%");
        protocolPerc = _newProtocolPerc;
    }

    function setProtocolWallet(address payable _newProtocolWallet) external onlyOwner {
        protocolWallet = _newProtocolWallet;
    }

    function addExemptAddress(address _user) external onlyOwner {
        require(!addressStats[_user].feeExemptStatus, "Account is already exempt");
        addressStats[_user].feeExemptStatus = true;
        emit AddedExemptAddress(_user);
    }

    function removeExemptAddress(address _user) external onlyOwner {
        require(addressStats[_user].feeExemptStatus, "Account is not exempt");
        addressStats[_user].feeExemptStatus = false;
        emit RemoveExemptAddress(_user);
    }    

    // Calculating and Checking Protocol Fees

    function calculateProtocolFeeAndAmount(
        uint256 _amount,
        bool payTaxBeforeSend
    ) public view returns (uint256, uint256) {
        /// payTaxBeforeSend defines whether we add tax on top of the amount
        /// If false, we add a fee on top of the amount
        /// If true, we take the fee from the amount
        /// Returns ProtocolFee and NewAmount
        uint256 protocolFee;
        uint256 amount;

        if(payTaxBeforeSend) {
            protocolFee = (_amount / (protocolPerc + protocolDenomenator)) * protocolPerc;
            amount = _amount - protocolFee;
        } else {
            protocolFee = (_amount * protocolPerc) / protocolDenomenator;
            amount = _amount;
        }

        return (protocolFee, amount);
    }

    function checkProtocolFee(
        address _sender, 
        uint256 _amount
    ) private view returns (bool) {
        // Check if there is enough money in the account to be able
        // To pay for the Protocol Fee 
        (uint256 protocolFee, uint256 amount) = calculateProtocolFeeAndAmount(_amount, _sender.isContract());
        return balanceOf(_sender) >= (protocolFee + amount);
    }

    // Transfers

    function transfer(
        address _to, 
        uint256 _amount
    ) public override requireProtocolFee(_msgSender(), _amount) returns (bool) {
        address owner = _msgSender();
        uint256 amount;

        if(!addressStats[owner].feeExemptStatus) {
            (uint256 protocolFee, uint256 newAmount) = calculateProtocolFeeAndAmount(_amount, owner.isContract());
            amount = newAmount;
            addressStats[owner].totalFeesPaid += protocolFee;
            _transfer(owner, protocolWallet, protocolFee);
            emit FeesPaid(owner, protocolFee);
        } else {
            amount = _amount;
        }

        addressStats[owner].totalTokensSent += amount;
        _transfer(owner, _to, amount);
        return true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _amount
    ) public override returns (bool) {
        address spender = _msgSender();
        uint256 amount;

        if(!addressStats[_from].feeExemptStatus) {
            (uint256 protocolFee, uint256 newAmount) = calculateProtocolFeeAndAmount(_amount, _from.isContract());
            amount = newAmount;
            addressStats[_from].totalFeesPaid += protocolFee;
            allowanceHolding[_from] -= protocolFee;
            _transfer(_from, protocolWallet, protocolFee);
            emit FeesPaid(_from, protocolFee);
        } else {
            amount = _amount;
        }

        addressStats[_from].totalTokensSent += amount;
        _spendAllowance(_from, spender, amount);
        _transfer(_from, _to, amount);
        return true;
    }

    // Approvals

    function approve(
        address _spender, 
        uint256 _amount
    ) public override returns (bool) {
        address owner = _msgSender();
        uint256 amount;

        if(!addressStats[owner].feeExemptStatus) {
            (uint256 newProtocolFee, uint256 newAmount) = calculateProtocolFeeAndAmount(_amount, owner.isContract());
            amount = newAmount;

            /// Calculating new allowance
            uint256 oldAllowance = allowance(owner, _spender);
            (uint256 oldProtocolFee, ) = calculateProtocolFeeAndAmount(oldAllowance, owner.isContract());
            allowanceHolding[owner] -= oldProtocolFee;
            allowanceHolding[owner] += newProtocolFee;
        } else {
            amount = _amount;
        }
        _approve(owner, _spender, _amount);
        return true;
    }

    function increaseAllowance(
        address _spender, 
        uint256 _addedValue
    ) public override returns (bool) {
        address owner = _msgSender();
        uint256 addedValue;

        if(!addressStats[owner].feeExemptStatus) {
            (uint256 protocolFee, uint256 newAddedValue) = calculateProtocolFeeAndAmount(_addedValue, owner.isContract());
            addedValue = newAddedValue;
            allowanceHolding[owner] += protocolFee;
        } else {
            addedValue = addedValue;
        }

        _approve(owner, _spender, allowance(owner, _spender) + addedValue);
        return true;
    }

    function decreaseAllowance(
        address _spender, 
        uint256 _subtractedValue
    ) public override returns (bool) {
        address owner = _msgSender();
        uint256 subtractedValue;
        uint256 currentAllowance = allowance(owner, _spender);

        require(currentAllowance >= _subtractedValue, "ERC20: decreased allowance below zero");
        unchecked {
            if(!addressStats[owner].feeExemptStatus) {
                (uint256 protocolFee, uint256 newSubtractedValue) = calculateProtocolFeeAndAmount(_subtractedValue, owner.isContract());
                subtractedValue = newSubtractedValue;
                allowanceHolding[owner] -= protocolFee;
            } else {
                subtractedValue = _subtractedValue;
            }
            _approve(owner, _spender, currentAllowance - _subtractedValue);
        }
        return true;
    }

}
