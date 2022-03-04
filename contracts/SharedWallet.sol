// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SharedWallet {

    address private _owner;
    IERC20 token;

    //create a mapping so other addresses can interact with this wallet.  Uint8 is used to determine is the address enabled of disabled
    mapping(address => uint8) private _owners;

    //in order to interact with the wallet you need to be the owner so added a require statement then execute the function _;
    modifier isOwner() {
        require(msg.sender == _owner);
        _;
    }

    
    //Require the msg.sender/the owner OR || Or an owner with a 1 which means enabled owner
    modifier validOwner() {
        require(msg.sender == _owner || _owners[msg.sender] == 1);
        _;
    }

    
    event DepositFunds(address from, uint amount);
    event TransferFunds(address from, address to, uint amount);


    //the creator is the owner of the wallet
    constructor (IERC20 _token) {
        _owner = msg.sender;
        token = _token;
    }

    
    //this function is used to add owners of the wallet.  Only the isOwner can add addresses.  1 means enabled
    function addOwner(address owner) 
        isOwner 
        public {
        _owners[owner] = 1;
    }

    
    //remove an owner from the wallet.  0 means disabled
    function removeOwner(address owner)
        isOwner
        public {
        _owners[owner] = 0;   
    }
    
    function transferCOMRADETo(address payable _to, uint _amount) 
        validOwner
        public {
        token.transfer(_to, _amount);
        emit TransferFunds(msg.sender, _to, _amount);
    }

    function approve(address _to, uint _amount)
        validOwner
        public {
            token.approve(_to, _amount);
        }
}