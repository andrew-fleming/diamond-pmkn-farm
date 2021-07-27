/* global describe it before ethers */

const {
    getSelectors,
    FacetCutAction,
    removeSelectors,
    findAddressPositionInFacets
  } = require('../scripts/libraries/diamond.js')
  
  const { deployPmknDiamond } = require('../scripts/deployPmknDiamond.ts')
  
  
  const { expect } = require('chai')
  
  describe('Pmkn Diamond Test', async function () {
    let diamondAddress
    let diamondCutFacet

    let pmknToken
    let res

    before(async function () {
        diamondAddress = await deployPmknDiamond()
        diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress);

        [owner, alice, bob] = await ethers.getSigners();

        pmknToken = await ethers.getContractAt("PmknTokenFacet", diamondAddress);
        await pmknToken.setMinter(owner.address)
    })

    describe("Init", async() => {
        it("should deploy contracts", async() => {
            expect(pmknToken).to.be.ok
        })
    })

    describe("Mint", async() => {
        it("should mint tokens", async() => {
            let amount = ethers.utils.parseEther("100")
            await pmknToken.mint(alice.address, amount)
            expect(await pmknToken.balanceOf(alice.address))
                .to.eq(amount)

            expect(await pmknToken.totalSupply())
                .to.eq(amount)
        })

        it("should revert mint from non-owner", async() => {
            await expect(pmknToken.connect(alice).mint(alice.address, 1))
                .to.be.reverted
        })
    })

    describe("Transfer", async() => {
        it("should mint tokens", async() => {
            let amount = ethers.utils.parseEther("100")
            await pmknToken.mint(owner.address, amount)
            await pmknToken.transfer(alice.address, amount)
            res = ethers.utils.parseEther("200")

            expect(await pmknToken.balanceOf(alice.address))
                .to.eq(res)

            expect(await pmknToken.balanceOf(owner.address))
                .to.eq(0)
            
            expect(await pmknToken.totalSupply())
                .to.eq(res)
        })
    })

    describe("TransferFrom", async() => {
        it("should transferFrom", async() => {
            amount = ethers.utils.parseEther("100")
            await pmknToken.connect(alice).approve(owner.address, amount)
            await pmknToken.transferFrom(alice.address, owner.address, amount)
            expect(await pmknToken.balanceOf(alice.address))
                .to.eq(amount)

            expect(await pmknToken.balanceOf(owner.address))
                .to.eq(amount)
        })

        it("should revert without approval", async() => {
            await expect(pmknToken.transferFrom(alice.address, owner.address, 1))
                .to.be.reverted
        })

        it("should revert amount exceeded allowance", async() => {
            amount = ethers.utils.parseEther("100")
            await pmknToken.connect(alice).approve(owner.address, 1)
            await expect(pmknToken.transferFrom(alice.address, owner.address, amount))
                .to.be.reverted
        })
        
    })

    describe("Minter role", async() => {
        it("should assign minter", async() => {
            expect(await pmknToken.isMinter(alice.address))
                .to.be.false

            await expect(pmknToken.connect(alice).mint(bob.address, 1))
                .to.be.reverted

            await pmknToken.setMinter(alice.address)
            await pmknToken.connect(alice).mint(bob.address, 1)

            expect(await pmknToken.balanceOf(bob.address))
                .to.eq(1)
        })
    })

    
})