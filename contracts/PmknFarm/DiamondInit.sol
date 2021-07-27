// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/******************************************************************************\
* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)
* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535
*
* Implementation of a diamond.
/******************************************************************************/

import {LibDiamond} from "./../shared/libraries/LibDiamond.sol";
import { IDiamondLoupe } from "./../shared/interfaces/IDiamondLoupe.sol";
import { IDiamondCut } from "./../shared/interfaces/IDiamondCut.sol";
import { IERC173 } from "./../shared/interfaces/IERC173.sol";
import { IERC165 } from "./../shared/interfaces/IERC165.sol";
import { PmknFarm } from "./libraries/LibAppStorage.sol";
import { AppStorage } from "../PmknToken/libraries/LibAppStorage.sol";
import { IERC20 } from "./../shared/interfaces/IERC20.sol";
import { IPmknToken } from "../PmknToken/interfaces/IPmknToken.sol";

contract DiamondInit {
    PmknFarm internal s;

    struct Args {
        address daiAddress;
        address pmknAddress;
    }

    function init(Args memory _args) external {
        // adding ERC165 data
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        ds.supportedInterfaces[type(IERC165).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondCut).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondLoupe).interfaceId] = true;
        ds.supportedInterfaces[type(IERC173).interfaceId] = true;

        s.dai = IERC20(_args.daiAddress);
        s.pmknToken = IPmknToken(_args.pmknAddress);
    }
}