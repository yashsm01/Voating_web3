import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, Keypair } from '@solana/web3.js'
import * as anchor from '@coral-xyz/anchor'
import { Program, AnchorProvider } from '@coral-xyz/anchor'
import { Voating } from '@/types/voating'
import IDL from '@/voating.json'

const PROGRAM_ID = new PublicKey('9WEMzhkxj7KxaZ6xqV8oKjqmDGDq1WMyN6ru2ACzG4K2')
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'

// Simple wallet wrapper
class NodeWallet {
  constructor(readonly payer: Keypair) {}

  async signTransaction(tx: any): Promise<any> {
    tx.partialSign(this.payer)
    return tx
  }

  async signAllTransactions(txs: any[]): Promise<any[]> {
    return txs.map((t) => {
      t.partialSign(this.payer)
      return t
    })
  }

  get publicKey(): PublicKey {
    return this.payer.publicKey
  }
}

export async function POST(request: NextRequest) {
  try {
    const { candidateName, pollId, walletPublicKey } = await request.json()

    if (!candidateName || !pollId || !walletPublicKey) {
      return NextResponse.json(
        { error: 'Missing required fields: candidateName, pollId, walletPublicKey' },
        { status: 400 }
      )
    }

    // Create connection
    const connection = new Connection(RPC_URL, 'confirmed')

    // For server-side operations, we need a dummy wallet
    // In production, you'd handle this differently based on your auth system
    const dummyKeypair = Keypair.generate()
    const wallet = new NodeWallet(dummyKeypair)

    // Create provider and program
    const provider = new AnchorProvider(connection, wallet as any, {
      commitment: 'confirmed',
    })
    const program = new Program<Voating>(IDL as any, provider)

    // Convert inputs
    const pollIdBN = new anchor.BN(parseInt(pollId))
    const voterPublicKey = new PublicKey(walletPublicKey)

    // Generate PDAs
    const [pollPDA] = PublicKey.findProgramAddressSync(
      [pollIdBN.toArrayLike(Buffer, 'le', 8)],
      PROGRAM_ID
    )

    const [candidatePDA] = PublicKey.findProgramAddressSync(
      [pollIdBN.toArrayLike(Buffer, 'le', 8), Buffer.from(candidateName)],
      PROGRAM_ID
    )

    // Create the transaction instruction
    const tx = await program.methods
      .vote(candidateName, pollIdBN)
      .accounts({
        signer: voterPublicKey,
      })
      .transaction()

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash()
    tx.recentBlockhash = blockhash
    tx.feePayer = voterPublicKey

    // Serialize the transaction for the client to sign
    const serializedTx = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    })

    return NextResponse.json({
      success: true,
      transaction: serializedTx.toString('base64'),
      message: 'Transaction prepared for signing'
    })

  } catch (error: any) {
    console.error('Vote API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process vote' },
      { status: 500 }
    )
  }
}
