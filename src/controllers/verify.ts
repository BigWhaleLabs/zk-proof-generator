import * as ed from '@noble/ed25519'
import { Body, Controller, Ctx, Get, Post } from 'amala'
import { Context } from 'koa'
import { ERC721__factory } from '@big-whale-labs/seal-cred-ledger-contract'
import { badRequest } from '@hapi/boom'
import { ethers } from 'ethers'
import ERC721VerifyBody from '@/validators/ERC721VerifyBody'
import eddsaSigFromString from '@/helpers/eddsaSigFromString'
import env from '@/helpers/env'
import provider from '@/helpers/provider'

@Controller('/verify')
export default class VerifyController {
  @Get('/eddsa-public-key')
  publicKey() {
    return '0x' + ed.getPublicKey(env.EDDSA_PRIVATE_KEY)
  }

  @Get('/email')
  email() {
    return env.SMTP_USER
  }

  @Post('/erc721')
  async erc721(
    @Ctx() ctx: Context,
    @Body({ required: true })
    { tokenAddress, signature, message }: ERC721VerifyBody
  ) {
    // Verify ECDSA signature
    const ownerAddress = ethers.utils.verifyMessage(message, signature)
    // Verify ownership
    const contract = ERC721__factory.connect(tokenAddress, provider)
    const balance = await contract.balanceOf(ownerAddress)
    if (balance.lte(0)) {
      return ctx.throw(badRequest('Token not owned'))
    }
    // Generate EDDSA signature
    const eddsaMessage = `${ownerAddress}-owns-${tokenAddress}`
    return {
      signature: await eddsaSigFromString(eddsaMessage),
      message: eddsaMessage,
    }
  }
}
