/* global describe it before ethers */

let {
    getSelectors,
    FacetCutAction,
  } = require('../scripts/libraries/diamond.js')

  const { deployPmknDiamond } = require('../scripts/deployPmknDiamond.ts')
  const { deployDiamondTest } = require('./libraries/deployDiamondTest.ts')

    
  let { expect } = require('chai')
  
  describe('PmknFarm', async function () {
    let diamondAddress
    let diamondCutFacet

    let pmknToken
    let pmknFarm
    let pmknFarmFacet
    let mockDai
    let tx
    let receipt
    let addresses = []

    before(async function () {
        const MockDai = await ethers.getContractFactory("MockERC20");
        mockDai = await MockDai.deploy("MockDai", "mDAI");

        const pmknTokenAddress = await deployPmknDiamond();

        diamondAddress = await deployDiamondTest(mockDai.address, pmknTokenAddress);
        diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress);
        diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress);
        ownershipFacet = await ethers.getContractAt('OwnershipFacet', diamondAddress);

        [owner, alice, bob] = await ethers.getSigners();
        await Promise.all([
            mockDai.mint(owner.address, ethers.utils.parseEther("999")),
            mockDai.mint(alice.address, ethers.utils.parseEther("999")),
            mockDai.mint(bob.address, ethers.utils.parseEther("999")),
        ]);

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

        pmknFarm = await ethers.getContractAt("PmknFarmFacet", diamondAddress);
        pmknToken = await ethers.getContractAt("PmknTokenFacet", pmknTokenAddress);
    })

    describe("Init", async() => {
        it("should deploy contracts", async() => {
            expect(pmknToken).to.be.ok
            expect(mockDai).to.be.ok
            expect(pmknFarm).to.be.ok
        })

        it("should return mockDai balances", async() => {
            let daiBalance = ethers.utils.parseEther("999")
            expect(await mockDai.balanceOf(owner.address))
                .to.eq(daiBalance)

            expect(await mockDai.balanceOf(alice.address))
                .to.eq(daiBalance)
        })
    })

    describe("Stake", async() => {
        it("should stake", async() => {
            let amount = ethers.utils.parseEther("20")
            await mockDai.approve(pmknFarm.address, amount)
            await pmknFarm.stake(amount)

            expect(await mockDai.balanceOf(pmknFarm.address))
                .to.eq(amount)
            
            expect(await pmknFarm.getStakingBalance(owner.address))
                .to.eq(amount)

            expect(await pmknFarm.getIsStaking(owner.address))
                .to.be.true
        })

        it("should log startTime", async() => {
            let startTime = await pmknFarm.getStartTime(owner.address)
            expect(Number(startTime))
                .to.be.greaterThan(0)
        })

        it("should update staking balance with multiple stakes", async() => {
            let daiAmount = ethers.utils.parseEther("20")
            await mockDai.connect(alice).approve(pmknFarm.address, daiAmount)
            await pmknFarm.connect(alice).stake(daiAmount)
            expect(await pmknFarm.getStakingBalance(alice.address))
                .to.eq(daiAmount)

            await mockDai.connect(alice).approve(pmknFarm.address, daiAmount)
            await pmknFarm.connect(alice).stake(daiAmount)
            expect(await pmknFarm.getStakingBalance(alice.address))
                .to.eq(ethers.utils.parseEther("40"))
        })

        it("should emit Stake event", async() => {
            await mockDai.approve(pmknFarm.address, 1)
            expect(await pmknFarm.stake(1))
                .to.emit(pmknFarm, "Stake")
                .withArgs(owner.address, 1)
        })
    })

    describe("Unstake", async() => {
        it("should unstake whole amount", async() => {
            amount = pmknFarm.getStakingBalance(owner.address)
            await pmknFarm.unstake(amount)

            expect(await pmknFarm.getIsStaking(owner.address))
                .to.be.false
            
            expect(await mockDai.balanceOf(owner.address))
                .to.eq(ethers.utils.parseEther("999"))
        })

        it("should partially unstake", async() => {
            amount = ethers.utils.parseEther("10")
            await pmknFarm.connect(alice).unstake(amount)

            expect(await pmknFarm.getIsStaking(alice.address))
                .to.be.true

            expect(await pmknFarm.getStakingBalance(alice.address))
                .to.eq(ethers.utils.parseEther("30"))
        })

        it("should emit Unstake event", async() => {
            expect(await pmknFarm.connect(alice).unstake(amount))
                .to.emit(pmknFarm, "Unstake")
                .withArgs(alice.address, amount)
        })
    })
})