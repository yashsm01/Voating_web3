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

// GET - Fetch all polls
export async function GET() {
  try {
    const connection = new Connection(RPC_URL, 'confirmed')
    const dummyKeypair = Keypair.generate()
    const wallet = new NodeWallet(dummyKeypair)

    const provider = new AnchorProvider(connection, wallet as any, {
      commitment: 'confirmed',
    })
    const program = new Program<Voating>(IDL as any, provider)

    const polls = await program.account.poll.all()

    const formattedPolls = polls.map((poll) => ({
      publicKey: poll.publicKey.toString(),
      account: {
        pollId: poll.account.pollId.toString(),
        description: poll.account.description,
        pollStart: poll.account.pollStart.toString(),
        pollEnd: poll.account.pollEnd.toString(),
        candidateAmount: poll.account.candidateAmount.toString(),
      }
    }))

    return NextResponse.json({
      success: true,
      polls: formattedPolls
    })

  } catch (error: any) {
    console.error('Fetch polls error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch polls' },
      { status: 500 }
    )
  }
}

// POST - Create a new poll
export async function POST(request: NextRequest) {
  try {
    const { pollId, description, startTime, endTime, walletPublicKey } = await request.json()

    if (!pollId || !description || !startTime || !endTime || !walletPublicKey) {
      return NextResponse.json(
        { error: 'Missing required fields: pollId, description, startTime, endTime, walletPublicKey' },
        { status: 400 }
      )
    }

    const connection = new Connection(RPC_URL, 'confirmed')
    const dummyKeypair = Keypair.generate()
    const wallet = new NodeWallet(dummyKeypair)

    const provider = new AnchorProvider(connection, wallet as any, {
      commitment: 'confirmed',
    })
    const program = new Program<Voating>(IDL as any, provider)

    // Convert inputs
    const pollIdBN = new anchor.BN(parseInt(pollId))
    const startTimeBN = new anchor.BN(Math.floor(new Date(startTime).getTime() / 1000))
    const endTimeBN = new anchor.BN(Math.floor(new Date(endTime).getTime() / 1000))
    const signerPublicKey = new PublicKey(walletPublicKey)

    // Create the transaction
    const tx = await program.methods
      .initializePoll(
        pollIdBN,
        description,
        startTimeBN,
        endTimeBN,
        new anchor.BN(0)
      )
      .accounts({
        signer: signerPublicKey,
      })
      .transaction()

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash()
    tx.recentBlockhash = blockhash
    tx.feePayer = signerPublicKey

    // Serialize the transaction
    const serializedTx = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    })

    return NextResponse.json({
      success: true,
      transaction: serializedTx.toString('base64'),
      message: 'Poll creation transaction prepared for signing'
    })

  } catch (error: any) {
    console.error('Create poll error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create poll' },
      { status: 500 }
    )
  }
}
