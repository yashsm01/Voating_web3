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

// GET - Fetch all candidates
export async function GET() {
  try {
    const connection = new Connection(RPC_URL, 'confirmed')
    const dummyKeypair = Keypair.generate()
    const wallet = new NodeWallet(dummyKeypair)

    const provider = new AnchorProvider(connection, wallet as any, {
      commitment: 'confirmed',
    })
    const program = new Program<Voating>(IDL as any, provider)

    const candidates = await program.account.candidate.all()

    const formattedCandidates = candidates.map((candidate) => ({
      publicKey: candidate.publicKey.toString(),
      account: {
        candidateName: candidate.account.candidateName,
        candidateVotes: candidate.account.candidateVotes.toString(),
      }
    }))

    return NextResponse.json({
      success: true,
      candidates: formattedCandidates
    })

  } catch (error: any) {
    console.error('Fetch candidates error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch candidates' },
      { status: 500 }
    )
  }
}

// POST - Add a new candidate
export async function POST(request: NextRequest) {
  try {
    const { candidateName, pollId, walletPublicKey } = await request.json()

    if (!candidateName || !pollId || !walletPublicKey) {
      return NextResponse.json(
        { error: 'Missing required fields: candidateName, pollId, walletPublicKey' },
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
    const signerPublicKey = new PublicKey(walletPublicKey)

    // Create the transaction
    const tx = await program.methods
      .initializedCandidate(candidateName, pollIdBN)
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
      message: 'Candidate creation transaction prepared for signing'
    })

  } catch (error: any) {
    console.error('Add candidate error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add candidate' },
      { status: 500 }
    )
  }
}
