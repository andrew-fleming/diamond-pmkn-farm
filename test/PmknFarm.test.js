/* global describe it before ethers */

const {
    getSelectors,
    FacetCutAction,
    removeSelectors,
    findAddressPositionInFacets
  } = require('../scripts/libraries/diamond.js')
  
  const { deployDiamond } = require('../scripts/deployDiamond.ts')
  
  const { assert, expect } = require('chai')
  
  describe('DiamondTest', async function () {
    let diamondAddress
    let diamondCutFacet

    let pmknToken
    let pmknTokenFacet
    let mockDai
    let tx
    let receipt
    let res
    const addresses = []

    before(async function () {
        const MockDai = await ethers.getContractFactory("MockERC20");
        mockDai = await MockDai.deploy("MockDai", "mDAI");
        diamondAddress = await deployDiamond()
        diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress);

        [owner, alice] = await ethers.getSigners();
        await Promise.all([
            mockDai.mint(owner.address, ethers.utils.parseEther("999")),
            mockDai.mint(alice.address, ethers.utils.parseEther("999")),
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

        pmknToken = await ethers.getContractAt("PmknTokenFacet", diamondAddress);
    })

    describe("Init", async() => {
        it("should deploy contracts", async() => {
            expect(pmknToken).to.be.ok
            expect(mockDai).to.be.ok
        })
    })
})