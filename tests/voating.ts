import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { Voating } from "../target/types/voating";
import { expect } from "chai";
import { BankrunProvider, startAnchor } from "anchor-bankrun";

const IDL = require("../target/idl/voating.json");

const votingAddress = new PublicKey("9WEMzhkxj7KxaZ6xqV8oKjqmDGDq1WMyN6ru2ACzG4K2");

describe("voating", () => {

  let context;
  let provider;
  let voatingProgram;

  before(async() => {
    //use anchor-bankrun to start the anchor provider
    context = await startAnchor("",[{name: "voating",programId: votingAddress}],[]);
    //create a bankrun provider
    provider = new BankrunProvider(context);

    voatingProgram = new Program<Voating>(IDL,provider);
  })

  it("initialized Poll...", async () => {
    await voatingProgram.methods.initializePoll(
      new anchor.BN(1),
      "what is your favorite color?",
      new anchor.BN(0),
      new anchor.BN(1848927521),
      new anchor.BN(0)
    ).rpc();

    // use the poll id to get the poll address
    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer,"le",8)],
      voatingProgram.programId
    );
    const poll = await voatingProgram.account.poll.fetch(pollAddress);

    console.log(poll);

    expect(poll.pollId.toNumber()).to.equal(1);
    expect(poll.description).to.equal("what is your favorite color?");
    expect(poll.pollStart.toNumber()).lessThanOrEqual(poll.pollEnd.toNumber());
  });

  it("initialized Candidate...", async () => {
    // Use poll ID 2 for this test
    const pollId = new anchor.BN(2);

    // Initialize poll first
    await voatingProgram.methods.initializePoll(
      pollId,
      "what is your favorite color?",
      new anchor.BN(0),
      new anchor.BN(1848927521),
      new anchor.BN(0)
    ).rpc();

    // Initialize candidates - Anchor will automatically resolve PDAs
    await voatingProgram.methods.initializedCandidate(
      "yash",  // candidate_name
      pollId   // poll_id
    ).rpc();

    await voatingProgram.methods.initializedCandidate(
      "crunchy", // candidate_name
      pollId     // poll_id
    ).rpc();

    // Verify candidates were created
    const [candidateAddress1] = PublicKey.findProgramAddressSync(
      [pollId.toArrayLike(Buffer,"le",8), Buffer.from("yash")],
      voatingProgram.programId
    );

    const [candidateAddress2] = PublicKey.findProgramAddressSync(
      [pollId.toArrayLike(Buffer,"le",8), Buffer.from("crunchy")],
      voatingProgram.programId
    );

    const candidate1 = await voatingProgram.account.candidate.fetch(candidateAddress1);
    const candidate2 = await voatingProgram.account.candidate.fetch(candidateAddress2);

    expect(candidate1.candidateName).to.equal("yash");
    expect(candidate1.candidateVotes.toNumber()).to.equal(0);
    expect(candidate2.candidateName).to.equal("crunchy");
    expect(candidate2.candidateVotes.toNumber()).to.equal(0);

    console.log("Candidate 1:", candidate1);
    console.log("Candidate 2:", candidate2);
  })

  it("Vote for candidate", async () => {
    // Use poll ID 3 for this test
    const pollId = new anchor.BN(2);

    // Vote for candidate - Note: parameter order matters!
    await voatingProgram.methods.vote(
      "yash",  // candidate_name
      pollId   // poll_id
    ).rpc();

    // Verify the vote was counted
    const [candidateAddress] = PublicKey.findProgramAddressSync(
      [pollId.toArrayLike(Buffer,"le",8), Buffer.from("yash")],
      voatingProgram.programId
    );

    const candidate = await voatingProgram.account.candidate.fetch(candidateAddress);
    expect(candidate.candidateVotes.toNumber()).to.equal(1);

    console.log("Candidate after vote:", candidate);
  })
});
