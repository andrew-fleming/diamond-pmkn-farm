// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { PmknFarm, PmknToken } from "../libraries/LibAppStorage.sol";
import { IERC20 } from "../interfaces/IERC20.sol";
import { IPmknToken } from "../interfaces/IPmknToken.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";
import "hardhat/console.sol";


contract PmknFarmFacet {
    PmknFarm s;

    event Stake(address indexed from, uint256 amount);
    event Unstake(address indexed from, uint256 amount);
    event YieldWithdraw(address indexed from, uint256 amount);

    function setDaiContract(address daiAddress) external {
        LibDiamond.enforceIsContractOwner();
        s.dai = IERC20(daiAddress);
    }

    function setPmknTokenContract(address pmknAddress) external {
        LibDiamond.enforceIsContractOwner();
        s.pmknToken = IPmknToken(pmknAddress);
    }

    function stake(uint amount) public {
        require(
            amount > 0 &&
            s.dai.balanceOf(msg.sender) >= amount, 
            "PmknFarm: Either amount is zero or not enough dai"
        );
        uint256 _amount = amount;
        amount = 0;
        if(s.isStaking[msg.sender] == true){
            uint256 toTransfer = calculateYieldTotal(msg.sender);
            s.pmknBalance[msg.sender] += toTransfer;
        }
        s.dai.transferFrom(msg.sender, address(this), _amount);
        s.isStaking[msg.sender] = true;
        s.startTime[msg.sender] = block.timestamp;
        s.stakingBalance[msg.sender] += _amount;
        emit Stake(msg.sender, _amount);
    }

    function unstake(uint amount) external {
        require(
            s.isStaking[msg.sender] = true &&
            s.stakingBalance[msg.sender] >= amount, 
            "Nothing to unstake"
        );
        uint256 yieldTransfer = calculateYieldTotal(msg.sender);
        s.startTime[msg.sender] = block.timestamp;
        uint256 balTransfer = amount;
        amount = 0;
        s.stakingBalance[msg.sender] -= balTransfer;
        s.dai.transfer(msg.sender, balTransfer);
        s.pmknBalance[msg.sender] += yieldTransfer;
        if(s.stakingBalance[msg.sender] == 0){
            s.isStaking[msg.sender] = false;
        }
        emit Unstake(msg.sender, balTransfer);
    }

    function calculateYieldTime(address user) public view returns(uint256){
        uint256 end = block.timestamp;
        uint256 totalTime = end - s.startTime[user];
        return totalTime;
    }

    function calculateYieldTotal(address user) public view returns(uint256) {
        uint256 time = calculateYieldTime(user) * 10**18;
        uint256 rate = 86400;
        uint256 timeRate = time / rate;
        uint256 rawYield = (s.stakingBalance[user] * timeRate) / 10**18;
        return rawYield;
    } 

    function withdrawYield() public {
        uint256 toTransfer = calculateYieldTotal(msg.sender);
        require(
            toTransfer > 0 ||
            s.pmknBalance[msg.sender] > 0,
            "Nothing to withdraw"
            );
        if(s.pmknBalance[msg.sender] != 0){
            uint256 oldBalance = s.pmknBalance[msg.sender];
            s.pmknBalance[msg.sender] = 0;
            toTransfer += oldBalance;
        }
        s.startTime[msg.sender] = block.timestamp;
        s.pmknToken.mint(msg.sender, toTransfer);
        emit YieldWithdraw(msg.sender, toTransfer);
    } 

    function getStakingBalance(address user) external view returns(uint256) {
        return s.stakingBalance[user];
    }

    function getIsStaking(address user) external view returns(bool){
        return s.isStaking[user];
    }

    function getStartTime(address user) external view returns(uint256){
        return s.startTime[user];
    }

    function getPmknBalance(address user) external view returns(uint256){
        return s.pmknBalance[user];
    }
}