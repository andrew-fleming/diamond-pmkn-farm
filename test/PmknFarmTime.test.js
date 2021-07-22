/* global describe it before ethers */

const {
    getSelectors,
    FacetCutAction,
    removeSelectors,
    findAddressPositionInFacets
  } = require('../scripts/libraries/diamond.js')
  
  const { deployDiamond } = require('../scripts/deployDiamond.ts')
  const { expect } = require('chai')
  const { time } = require("@openzeppelin/test-helpers")
  
  describe('PmknFarmTime', async function () {
    let diamondAddress
    let diamondCutFacet

    let pmknToken
    let pmknTokenFacet
    let pmknFarm
    let pmknFarmFacet
    let ownershipFacet
    let mockDai
    let tx
    let receipt
    let res
    let expected
    const addresses = []

    before(async function () {
        const MockDai = await ethers.getContractFactory("MockERC20");
        mockDai = await MockDai.deploy("MockDai", "mDAI");
        diamondAddress = await deployDiamond()
        diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress);

        [owner, alice, bob] = await ethers.getSigners();
        await Promise.all([
            mockDai.mint(owner.address, ethers.utils.parseEther("999")),
            mockDai.mint(alice.address, ethers.utils.parseEther("999")),
            mockDai.mint(bob.address, ethers.utils.parseEther("999")),
        ]);

        const PmknTokenFacet = await ethers.getContractFactory('PmknTokenFacet')
        pmknTokenFacet = await PmknTokenFacet.deploy()
        await pmknTokenFacet.deployed()
        addresses.push(pmknTokenFacet.address)
        let selectors = getSelectors(pmknTokenFacet)
        tx = await diamondCutFacet.diamondCut(
            [{
                facetAddress: pmknTokenFacet.address,
                action: FacetCutAction.Add,
                functionSelectors: selectors
            }],
            ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
        receipt = await tx.wait()
        if (!receipt.status) {
            throw Error(`Diamond upgrade failed: ${tx.hash}`)
        }

        const PmknFarmFacet = await ethers.getContractFactory('PmknFarmFacet')
        pmknFarmFacet = await PmknFarmFacet.deploy()
        await pmknFarmFacet.deployed()
        addresses.push(pmknFarmFacet.address)
        selectors = getSelectors(pmknFarmFacet)
        tx = await diamondCutFacet.diamondCut(
            [{
                facetAddress: pmknFarmFacet.address,
                action: FacetCutAction.Add,
                functionSelectors: selectors
            }],
            ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
        receipt = await tx.wait()
        if (!receipt.status) {
            throw Error(`Diamond upgrade failed: ${tx.hash}`)
        }

        pmknToken = await ethers.getContractAt("PmknTokenFacet", diamondAddress);
        pmknFarm = await ethers.getContractAt("PmknFarmFacet", diamondAddress);
        await pmknFarm.setDaiContract(mockDai.address)
        await pmknFarm.setPmknTokenContract(pmknToken.address)
    })

    describe("Time traveling", async() => {
        let stakedAmount = 100

        before(async() => {
            await mockDai.approve(pmknFarm.address, stakedAmount)
            await pmknFarm.stake(stakedAmount)
            await mockDai.connect(alice).approve(pmknFarm.address, stakedAmount)
            await pmknFarm.connect(alice).stake(stakedAmount)
            // 86400 = seconds in a day
            await time.increase(86400)
        })

        it("should return stakedAmount", async() => {
            expect(await pmknFarm.calculateYieldTotal(owner.address))
                .to.eq(stakedAmount)
        })

        it("should add yield to pmknBalance after restaking", async() => {
            await mockDai.approve(pmknFarm.address, 1)
            await pmknFarm.stake(1)
            expect(await pmknFarm.getPmknBalance(owner.address))
                .to.eq(stakedAmount)
        })

        it("should reset startTime after unstake", async() => {
            let initStart = Number(await pmknFarm.getStartTime(owner.address))
            await pmknFarm.unstake(51)
            let afterUnstake = Number(await pmknFarm.getStartTime(owner.address))
            expect(initStart)
                .to.be.lessThan(afterUnstake)
        })

        it("should withdraw correct yield", async() => { 
            console.log("pmknFarm: ", pmknFarm.address)
            console.log("pmknToken: ", pmknToken.address)
            let balance = await pmknFarm.getStakingBalance(owner.address)
            await pmknFarm.unstake(balance)
            expected = await pmknFarm.getPmknBalance(owner.address)
            await pmknFarm.withdrawYield()
            res = await pmknToken.balanceOf(owner.address)

            expect(expected)
                .to.eq(res)            
        })

        it("should withdraw correct yield while still staking", async() => {
            expected = await pmknFarm.calculateYieldTotal(alice.address)
            await pmknFarm.connect(alice).withdrawYield()
            res = await pmknToken.balanceOf(alice.address)

            expect(expected)
                .to.eq(res)
        })

        it("should emit YieldWithdraw event", async() => {
            await mockDai.approve(pmknFarm.address, stakedAmount)
            await pmknFarm.stake(stakedAmount)
            await time.increase(86400)
            expect(await pmknFarm.withdrawYield())
                .to.emit(pmknFarm, "YieldWithdraw")
                .withArgs(owner.address, stakedAmount)
        })
    })

})