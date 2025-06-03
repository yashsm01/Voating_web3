'use client'

import { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { Transaction } from '@solana/web3.js'

export function VotingApiFeature() {
  const wallet = useWallet()
  const { connection } = useConnection()

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

  // Fetch data on component mount
  useEffect(() => {
    fetchPolls()
    fetchCandidates()
  }, [])

  const initializePoll = async () => {
    if (!wallet.publicKey) {
      alert('Please connect your wallet first!')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pollId: pollForm.id,
          description: pollForm.description,
          startTime: pollForm.startTime,
          endTime: pollForm.endTime,
          walletPublicKey: wallet.publicKey.toString(),
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      // Deserialize and sign the transaction
      const tx = Transaction.from(Buffer.from(data.transaction, 'base64'))

      if (wallet.signTransaction) {
        const signedTx = await wallet.signTransaction(tx)

        // Send the signed transaction using the connection from useConnection
        const signature = await connection.sendRawTransaction(signedTx.serialize())
        await connection.confirmTransaction(signature)

        alert('Poll initialized successfully!')
        setPollForm({ id: '', description: '', startTime: '', endTime: '' })
        fetchPolls()
      }
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
      const response = await fetch('/api/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateName: candidateForm.name,
          pollId: candidateForm.pollId,
          walletPublicKey: wallet.publicKey.toString(),
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      // Deserialize and sign the transaction
      const tx = Transaction.from(Buffer.from(data.transaction, 'base64'))

      if (wallet.signTransaction) {
        const signedTx = await wallet.signTransaction(tx)

        const signature = await connection.sendRawTransaction(signedTx.serialize())
        await connection.confirmTransaction(signature)

        alert('Candidate added successfully!')
        setCandidateForm({ name: '', pollId: '' })
        fetchCandidates()
      }
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
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateName: voteForm.candidateName,
          pollId: voteForm.pollId,
          walletPublicKey: wallet.publicKey.toString(),
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      // Deserialize and sign the transaction
      const tx = Transaction.from(Buffer.from(data.transaction, 'base64'))

      if (wallet.signTransaction) {
        const signedTx = await wallet.signTransaction(tx)

        const signature = await connection.sendRawTransaction(signedTx.serialize())
        await connection.confirmTransaction(signature)

        alert('Vote cast successfully!')
        setVoteForm({ candidateName: '', pollId: '' })
        fetchCandidates()
      }
    } catch (error: any) {
      console.error('Error:', error)
      alert(`Error: ${error.message}`)
    }
    setLoading(false)
  }

  const fetchPolls = async () => {
    try {
      const response = await fetch('/api/polls')
      const data = await response.json()

      if (data.success) {
        setPolls(data.polls)
      }
    } catch (error) {
      console.error('Error fetching polls:', error)
    }
  }

  const fetchCandidates = async () => {
    try {
      const response = await fetch('/api/candidates')
      const data = await response.json()

      if (data.success) {
        setCandidates(data.candidates)
      }
    } catch (error) {
      console.error('Error fetching candidates:', error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-center">Solana Voting dApp (API Version)</h1>

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
                <p><strong>ID:</strong> {poll.account.pollId}</p>
                <p><strong>Description:</strong> {poll.account.description}</p>
                <p><strong>Candidates:</strong> {poll.account.candidateAmount}</p>
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
                <p><strong>Votes:</strong> {candidate.account.candidateVotes}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* API Testing Section */}
      <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">API Endpoints:</h3>
        <div className="space-y-1 text-sm">
          <p><strong>GET</strong> <code>/api/polls</code> - Fetch all polls</p>
          <p><strong>POST</strong> <code>/api/polls</code> - Create a poll</p>
          <p><strong>GET</strong> <code>/api/candidates</code> - Fetch all candidates</p>
          <p><strong>POST</strong> <code>/api/candidates</code> - Add a candidate</p>
          <p><strong>POST</strong> <code>/api/vote</code> - Cast a vote</p>
        </div>
      </div>
    </div>
  )
}
