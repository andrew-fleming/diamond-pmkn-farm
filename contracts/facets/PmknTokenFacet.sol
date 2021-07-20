// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import { PmknToken } from "../libraries/LibAppStorage.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";
import "../interfaces/IPmknToken.sol";


contract PmknTokenFacet {
    PmknToken internal s;

    uint256 constant MAX_UINT = type(uint256).max;

    event Approval(address indexed _owner, address indexed _spender, uint256 _value);
    event Transfer(address indexed _from, address indexed _to, uint256 _value);

    function name() external pure returns (string memory) {
        return "PmknToken";
    }

    function symbol() external pure returns (string memory) {
        return "PMKN";
    }

    function decimals() external pure returns (uint8) {
        return 18;
    }

    function totalSupply() public view returns (uint256) {
        return s.totalSupply;
    }

    function balanceOf(address _owner) public view returns (uint256 balance) {
        balance = s.balances[_owner];
    }
    
    function transfer(address _to, uint256 _value) public returns (bool success) {
        uint256 frombalances = s.balances[msg.sender];
        require(frombalances >= _value, "PMKN: Not enough PMKN to transfer");
        s.balances[msg.sender] = frombalances - _value;
        s.balances[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        success = true;
    }

    function allowance(address _owner, address _spender) public view returns (uint256 remaining_) {
        remaining_ = s.allowances[_owner][_spender];
    }

    function approve(address _spender, uint256 _value) public returns (bool success) {
        s.allowances[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        success = true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public returns (bool success) {
        uint256 fromBalance = s.balances[_from];
        if (msg.sender == _from) {
            // pass
        } else {
            uint256 l_allowance = s.allowances[_from][msg.sender];
            require(l_allowance >= _value, "PMKN: Not allowed to transfer");
            if (l_allowance != MAX_UINT) {
                s.allowances[_from][msg.sender] = l_allowance - _value;
                emit Approval(_from, msg.sender, l_allowance - _value);
            }
        }
        require(fromBalance >= _value, "PmknToken: Not enough PMKN to transfer");
        s.balances[_from] = fromBalance - _value;
        s.balances[_to] += _value;
        emit Transfer(_from, _to, _value);
        success = true;
    }

    function increaseAllowance(address _spender, uint256 _value) external returns (bool success) {
        uint256 l_allowance = s.allowances[msg.sender][_spender];
        uint256 newAllowance = l_allowance + _value;
        require(newAllowance >= l_allowance, "PmknTokenFacet: Allowance increase overflowed");
        s.allowances[msg.sender][_spender] = newAllowance;
        emit Approval(msg.sender, _spender, newAllowance);
        success = true;
    }

    
    function decreaseAllowance(address _spender, uint256 _value) external returns (bool success) {
        uint256 l_allowance = s.allowances[msg.sender][_spender];
        require(l_allowance >= _value, "PmknTokenFacet: Allowance decreased below 0");
        l_allowance -= _value;
        s.allowances[msg.sender][_spender] = l_allowance;
        emit Approval(msg.sender, _spender, l_allowance);
        success = true;
    }

    function mint(address _receiver, uint256 _value) external returns(bool success){
        //LibDiamond.enforceIsContractOwner();
        require(_receiver != address(0), "_to cannot be zero address");        
        s.balances[_receiver] += _value;
        s.totalSupply += _value;            
        emit Transfer(address(0), _receiver, _value); 
        success = true;       
    }

}