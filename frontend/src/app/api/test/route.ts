import { ActionGetResponse, ActionPostRequest, createPostResponse } from "@solana/actions";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { Voating } from '@/types/voating'
import IDL from '@/voating.json'
import { BN, Program } from "@coral-xyz/anchor";
import { Anchor } from "lucide-react";


const ACTIONS_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export const OPTIONS = GET;
export async function GET(request: Request) {
    const actionMetadata: ActionGetResponse = {
      icon: "https://domf5oio6qrcr.cloudfront.net/medialibrary/1980/peanut-butter-healthy.jpg",
      title: "Vote for your faverite type of butter..!",
      description: "crunchy or smooth?",
      label: "Vote",
      links: {
        actions: [
          {
            label: "vote for crunchy",
            href: "api/test/candidate=crunchy",
            type: "transaction"
          },
          {
            label: "smooth",
            href: "api/test/candidate=smooth",
            type: "transaction"
          }
        ]
      }
    }
    return Response.json(actionMetadata, {headers:ACTIONS_CORS_HEADERS });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const candidate = url.searchParams.get("candidate");
  if (candidate !== "crunchy" && candidate !== "smooth") {
    return Response.json({error: "Invalid candidate"}, {status: 400, headers: ACTIONS_CORS_HEADERS});
  }

  const connection = new Connection("http://127.0.0.1:8899","confirmed");
  const program: Program<Voating> = new Program(IDL as Voating, {connection})
  const body: ActionPostRequest = await request.json();
  let voter;

  try {
    voter = new PublicKey(body.account);
  } catch (error) {
    console.error(error);
    return Response.json({error: "Internal server error"}, {status: 500, headers: ACTIONS_CORS_HEADERS});
  }

  const instruction = await program.methods
    .vote(candidate, new BN(0))
    .accounts({
      signer: voter
    })
    .instruction();

    const blockhash = await connection.getLatestBlockhash();

    const transaction = new Transaction({
      feePayer: voter,
      blockhash: blockhash.blockhash,
      lastValidBlockHeight: blockhash.lastValidBlockHeight
    })
    .add(instruction);

    const response = await createPostResponse({
      fields: {
        transaction: transaction,
        type: "transaction",
      }
    })

    return Response.json(response, {headers: ACTIONS_CORS_HEADERS});

}
