'use client'

import { useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import * as anchor from '@coral-xyz/anchor'
import { Program, AnchorProvider } from '@coral-xyz/anchor'
import { Voating } from '@/types/voating'
import IDL from '@/voating.json'

const PROGRAM_ID = new PublicKey('9WEMzhkxj7KxaZ6xqV8oKjqmDGDq1WMyN6ru2ACzG4K2')

export function VotingFeature() {
  const { connection } = useConnection()
  const wallet = useWallet()

  const [polls, setPolls] = useState<any[]>([])
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Form states
  const [pollForm, setPollForm] = useState({
    id: '',
    description: '',
    startTime: '',
    endTime: ''
  })

  const [candidateForm, setCandidateForm] = useState({
    name: '',
    pollId: ''
  })

  const [voteForm, setVoteForm] = useState({
    candidateName: '',
    pollId: ''
  })

  const getProgram = () => {
    if (!wallet.publicKey) return null

    const provider = new AnchorProvider(
      connection,
      wallet as any,
      { preflightCommitment: 'processed' }
    )

    return new Program<Voating>(IDL as any, provider)
  }

  const initializePoll = async () => {
    if (!wallet.publicKey) {
      alert('Please connect your wallet first!')
      return
    }

    setLoading(true)
    try {
      const program = getProgram()
      if (!program) return

      const pollId = new anchor.BN(parseInt(pollForm.id))
      const startTime = new anchor.BN(Math.floor(new Date(pollForm.startTime).getTime() / 1000))
      const endTime = new anchor.BN(Math.floor(new Date(pollForm.endTime).getTime() / 1000))

      await program.methods
        .initializePoll(
          pollId,
          pollForm.description,
          startTime,
          endTime,
          new anchor.BN(0)
        )
        .rpc()

      alert('Poll initialized successfully!')
      setPollForm({ id: '', description: '', startTime: '', endTime: '' })
      fetchPolls()
    } catch (error: any) {
      console.error('Error:', error)
      alert(`Error: ${error.message}`)
    }
    setLoading(false)
  }

  const initializeCandidate = async () => {
    if (!wallet.publicKey) {
      alert('Please connect your wallet first!')
      return
    }

    setLoading(true)
    try {
      const program = getProgram()
      if (!program) return

      const pollId = new anchor.BN(parseInt(candidateForm.pollId))

      await program.methods
        .initializedCandidate(candidateForm.name, pollId)
        .rpc()

      alert('Candidate initialized successfully!')
      setCandidateForm({ name: '', pollId: '' })
      fetchCandidates()
    } catch (error: any) {
      console.error('Error:', error)
      alert(`Error: ${error.message}`)
    }
    setLoading(false)
  }

  const vote = async () => {
    if (!wallet.publicKey) {
      alert('Please connect your wallet first!')
      return
    }

    setLoading(true)
    try {
      const program = getProgram()
      if (!program) return

      const pollId = new anchor.BN(parseInt(voteForm.pollId))

      await program.methods
        .vote(voteForm.candidateName, pollId)
        .rpc()

      alert('Vote cast successfully!')
      setVoteForm({ candidateName: '', pollId: '' })
      fetchCandidates()
    } catch (error: any) {
      console.error('Error:', error)
      alert(`Error: ${error.message}`)
    }
    setLoading(false)
  }

  const fetchPolls = async () => {
    try {
      const program = getProgram()
      if (!program) return

      const pollAccounts = await program.account.poll.all()
      setPolls(pollAccounts)
    } catch (error) {
      console.error('Error fetching polls:', error)
    }
  }

  const fetchCandidates = async () => {
    try {
      const program = getProgram()
      if (!program) return

      const candidateAccounts = await program.account.candidate.all()
      setCandidates(candidateAccounts)
    } catch (error) {
      console.error('Error fetching candidates:', error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-center">Solana Voting dApp</h1>

      {!wallet.connected && (
        <div className="text-center p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
          <p>Please connect your wallet to interact with the voting system</p>
        </div>
      )}

      {/* Initialize Poll Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Initialize Poll</h2>
        <div className="space-y-4">
          <input
            type="number"
            placeholder="Poll ID"
            value={pollForm.id}
            onChange={(e) => setPollForm({ ...pollForm, id: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
          <input
            type="text"
            placeholder="Poll Description"
            value={pollForm.description}
            onChange={(e) => setPollForm({ ...pollForm, description: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
          <input
            type="datetime-local"
            placeholder="Start Time"
            value={pollForm.startTime}
            onChange={(e) => setPollForm({ ...pollForm, startTime: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
          <input
            type="datetime-local"
            placeholder="End Time"
            value={pollForm.endTime}
            onChange={(e) => setPollForm({ ...pollForm, endTime: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
          <button
            onClick={initializePoll}
            disabled={!wallet.connected || loading}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Initialize Poll'}
          </button>
        </div>
      </div>

      {/* Initialize Candidate Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Add Candidate</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Candidate Name"
            value={candidateForm.name}
            onChange={(e) => setCandidateForm({ ...candidateForm, name: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
          <input
            type="number"
            placeholder="Poll ID"
            value={candidateForm.pollId}
            onChange={(e) => setCandidateForm({ ...candidateForm, pollId: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
          <button
            onClick={initializeCandidate}
            disabled={!wallet.connected || loading}
            className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Candidate'}
          </button>
        </div>
      </div>

      {/* Vote Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Cast Vote</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Candidate Name"
            value={voteForm.candidateName}
            onChange={(e) => setVoteForm({ ...voteForm, candidateName: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
          <input
            type="number"
            placeholder="Poll ID"
            value={voteForm.pollId}
            onChange={(e) => setVoteForm({ ...voteForm, pollId: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
          <button
            onClick={vote}
            disabled={!wallet.connected || loading}
            className="w-full bg-purple-500 text-white p-2 rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {loading ? 'Voting...' : 'Cast Vote'}
          </button>
        </div>
      </div>

      {/* Data Display Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Polls */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Polls</h2>
            <button
              onClick={fetchPolls}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Refresh
            </button>
          </div>
          <div className="space-y-2">
            {polls.map((poll, index) => (
              <div key={index} className="p-3 border rounded dark:border-gray-600">
                <p><strong>ID:</strong> {poll.account.pollId.toString()}</p>
                <p><strong>Description:</strong> {poll.account.description}</p>
                <p><strong>Candidates:</strong> {poll.account.candidateAmount.toString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Candidates */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Candidates</h2>
            <button
              onClick={fetchCandidates}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Refresh
            </button>
          </div>
          <div className="space-y-2">
            {candidates.map((candidate, index) => (
              <div key={index} className="p-3 border rounded dark:border-gray-600">
                <p><strong>Name:</strong> {candidate.account.candidateName}</p>
                <p><strong>Votes:</strong> {candidate.account.candidateVotes.toString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
