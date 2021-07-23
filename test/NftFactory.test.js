/* global describe it before ethers */

const {
    getSelectors,
    FacetCutAction,
    removeSelectors,
    findAddressPositionInFacets
  } = require('../scripts/libraries/diamond.js')
  
  const { deployDiamond } = require('../scripts/deployDiamond.ts')
  
  const { assert, expect } = require('chai')
  
  describe('NftFactory', async function () {
    let diamondAddress
    let diamondCutFacet

    let nftFactory
    let nftFactoryFacet
    let tx
    let receipt
    let res
    const addresses = []

    before(async function () {
        diamondAddress = await deployDiamond()
        diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress);

        [owner, alice] = await ethers.getSigners();

        const NftFactoryFacet = await ethers.getContractFactory('NftFactoryFacet')
        nftFactoryFacet = await NftFactoryFacet.deploy()
        await nftFactoryFacet.deployed()
        addresses.push(nftFactoryFacet.address)
        let selectors = getSelectors(nftFactoryFacet)
        tx = await diamondCutFacet.diamondCut(
            [{
                facetAddress: nftFactoryFacet.address,
                action: FacetCutAction.Add,
                functionSelectors: selectors
            }],
            ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
        receipt = await tx.wait()
        if (!receipt.status) {
            throw Error(`Diamond upgrade failed: ${tx.hash}`)
        }

        nftFactory = await ethers.getContractAt("NftFactoryFacet", diamondAddress);
    })
    
    describe("Init", async() => {
        let data = ethers.utils.formatBytes32String("data")
        let price = ethers.utils.parseEther("5")
        let firstNFT = ["JACK", "www.token", data, price]

        it("should init", async() => {
            expect(nftFactory).to.be.ok
        })

        it("should set nft template", async() => {
            await nftFactory.setNFT(...firstNFT)
        })

        it("should return set nft", async() => {
            res = await nftFactory.getSetNFT(1)
            expect(...res)
                .to.eq(...firstNFT)
        })
    })
})