// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibDiamond} from "./LibDiamond.sol";
import "../interfaces/IERC20.sol";
import "../interfaces/IPmknToken.sol";

struct PmknToken {
    string name;
    string symbol;
    mapping(address => uint256) balances;
    mapping(address => mapping(address => uint256)) allowances;
    uint256 totalSupply;
}

struct PmknFarm {
    uint256 contractBalance;
    IERC20 dai;
    IPmknToken pmknToken;
    // userAddress => unclaimedPmknBalance
    mapping(address => uint256) pmknBalance;
    // userAddress => stakedBalance
    mapping(address => uint256) stakingBalance;
    // userAddress => boolIsStaking
    mapping(address => bool) isStaking;
    // userAddress => blockTimestampStaked
    mapping(address => uint256) startTime;
}

