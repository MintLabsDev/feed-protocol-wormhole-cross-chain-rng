import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey,Keypair } from "@solana/web3.js";
import { deserialize, serialize } from "borsh";
import bs58 from "bs58";
import {  Environment,  StandardRelayerApp,  StandardRelayerContext,} from "@wormhole-foundation/relayer-engine";
import { CHAIN_ID_SOLANA, CHAIN_ID_ETH} from "@certusone/wormhole-sdk";
import { SolanaEmitter } from "../target/types/solana_emitter";
import { ethers } from "ethers";

  // Set up eth wallet
const ethProvider = new ethers.providers.StaticJsonRpcProvider(
  'INSERT_RPC_URL'
);
const ethWallet = new ethers.Wallet('INSERT_PRIVATE_KEY', ethProvider);

// Create client to interact with our target app
const ethEmitter = ethereum_emitter.connect(
  'INSERT_CONTRACT_ADDRESS',
  ethWallet
);

(async function main() {

  const app = new StandardRelayerApp<StandardRelayerContext>(
    Environment.DEVNET,

    {
      name: 'RNGRequestReceiverRelayer',
    }
  );

//receiving vaa from solana core contract and transmitting to evm contract
  app.chain(CHAIN_ID_SOLANA).address(

    'AMcPHgYcvCBUnPjKpWE1DQsU5Ru4tnyocxvBMLJgFw7k',

    async (ctx, next) => {
      const vaa = ctx.vaa;
      const hash = ctx.sourceTxHash;


// Invoke the receiveMessage on the ETH contract and wait for confirmation
const receipt = await ethEmitter
  .receiveMessage(ctx.vaaBytes)
  .then((tx: ethers.ContractTransaction) => tx.wait())
  .catch((msg: any) => {
    console.log("failed to send vaa to evm contract")

  });

    }
  );

  //receiving vaa from eth contract. (rng request)
  app.chain(CHAIN_ID_ETH).address(

    'eth contract address',

    async (ctx, next) => {
      const vaa = ctx.vaa;
      const hash = ctx.sourceTxHash;

      try {
        await sendVaaToSolanaEmitter(payer,ctx)
      } catch (error) {
        console.log("failed to send vaa to solana core contract")

      }

    }
  );



  await app.listen();
})();


export class CurrentFeed {
  is_init: number = 0;
  fee: number = 0;
  offset1: number = 0;
  offset2: number = 0;
  offset3: number = 0;
  offset4: number = 0;
  offset5: number = 0;
  offset6: number = 0;
  offset7: number = 0;
  offset8: number = 0;
  account1: number[] = Array.from({ length: 32 }, () => 1);
  account2: number[] = Array.from({ length: 32 }, () => 1);
  account3: number[] = Array.from({ length: 32 }, () => 1);
  fallback_account: number[] = Array.from({ length: 32 }, () => 1);
  bump: number = 0;

  constructor(
    fields:
      | {
          is_init: number;
          fee: number;
          offset1: number;
          offset2: number;
          offset3: number;
          offset4: number;
          offset5: number;
          offset6: number;
          offset7: number;
          offset8: number;
          account1: number[];
          account2: number[];
          account3: number[];
          fallback_account: number[];
          bump: number;
        }
      | undefined = undefined
  ) {
    if (fields) {
      this.is_init = fields.is_init;
      this.fee = fields.fee;
      this.offset1 = fields.offset1;
      this.offset2 = fields.offset2;
      this.offset3 = fields.offset3;
      this.offset4 = fields.offset4;
      this.offset5 = fields.offset5;
      this.offset6 = fields.offset6;
      this.offset7 = fields.offset7;
      this.offset8 = fields.offset8;
      this.account1 = fields.account1;
      this.account2 = fields.account2;
      this.account3 = fields.account3;
      this.fallback_account = fields.fallback_account;
      this.bump = fields.bump;
    }
  }
}
export const CurrentFeedSchema = new Map([
  [
    CurrentFeed,
    {
      kind: "struct",
      fields: [
        ["is_init", "u8"],
        ["fee", "u64"],
        ["offset1", "u8"],
        ["offset2", "u8"],
        ["offset3", "u8"],
        ["offset4", "u8"],
        ["offset5", "u8"],
        ["offset6", "u8"],
        ["offset7", "u8"],
        ["offset8", "u8"],
        ["account1", ["u8", 32]],
        ["account2", ["u8", 32]],
        ["account3", ["u8", 32]],
        ["fallback_account", ["u8", 32]],
        ["bump", "u8"],
      ],
    },
  ],
]);
class u64{
  val:bigint = BigInt(0);

  constructor(fields: {
      val:bigint;

   } | undefined = undefined)
    {if (fields) {
      this.val = fields.val; 

    }
  }
}
const u64Schema=new Map([
  [
      u64,
    {
      kind: "struct",
      fields: [
        ["val","u64"],
      ],
    },
  ],
]);
class u16{
  val:number = 0;

  constructor(fields: {
      val:number;

   } | undefined = undefined)
    {if (fields) {
      this.val = fields.val; 

    }
  }
}
const u16Schema=new Map([
  [
      u16,
    {
      kind: "struct",
      fields: [
        ["val","u16"],
      ],
    },
  ],
]);

const privkey1 =
  [153, 187, 227, 210, 27, 108, 215, 173, 44, 244, 156, 74, 194, 28, 155, 122, 71, 217, 19, 208, 234, 242, 206, 140, 90, 56, 195, 207,
    73, 113, 207, 157, 220, 189, 39, 249, 130, 185, 164, 194, 196, 55, 144, 15, 84, 36, 233, 49, 66, 177, 100, 45, 220, 200,
    12, 207, 135, 110, 74, 254, 221, 39, 178, 75]

export const payer = Keypair.fromSecretKey(Uint8Array.from(privkey1));

const rngProgram = new anchor.web3.PublicKey('FEED1qspts3SRuoEyG29NMNpsTKX8yG9NGMinNC4GeYB');
process.env.ANCHOR_PROVIDER_URL = 'https://api.devnet.solana.com';
process.env.ANCHOR_WALLET = './key.json';

const provider = anchor.AnchorProvider.env()
anchor.setProvider(provider);

const program = new Program<SolanaEmitter>(
  require("../target/idl/solana_emitter.json"),
  provider
);

async function sendVaaToSolanaEmitter(player:Keypair, ctx: StandardRelayerContext) {



  const connection = program.provider.connection;



  const current_feeds_account = PublicKey.findProgramAddressSync(
    [Buffer.from("c"), Buffer.from([1])],
    rngProgram
  );



  const currentFeedsAccountInfo = await connection.getAccountInfo(
    current_feeds_account[0]
  );
  const currentFeedsAccountData = deserialize(
    CurrentFeedSchema,
    CurrentFeed,
    currentFeedsAccountInfo?.data!
  );

  const feedAccount1 = new PublicKey(
    bs58.encode(currentFeedsAccountData.account1).toString()
  );
  const feedAccount2 = new PublicKey(
    bs58.encode(currentFeedsAccountData.account2).toString()
  );
  const feedAccount3 = new PublicKey(
    bs58.encode(currentFeedsAccountData.account3).toString()
  );

  const fallbackAccount = new PublicKey(
    bs58.encode(currentFeedsAccountData.fallback_account).toString()
  );

  const tempKeypair = anchor.web3.Keypair.generate();

  const vaaHash:number[] = ctx.vaa?.hash as unknown as number[];

  const programId = new PublicKey("AMcPHgYcvCBUnPjKpWE1DQsU5Ru4tnyocxvBMLJgFw7k")
  const wormholeProgramId = new PublicKey("3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5")
  const wormhole_emitter = PublicKey.findProgramAddressSync([Buffer.from("emitter")],programId)
  const wormhole_bridge = PublicKey.findProgramAddressSync([Buffer.from("Bridge")],wormholeProgramId)
  const wormhole_fee_collector = PublicKey.findProgramAddressSync([Buffer.from("fee_collector")],wormholeProgramId)
  const wormhole_sequence = PublicKey.findProgramAddressSync([Buffer.from("Sequence"), wormhole_emitter[0].toBytes()],wormholeProgramId)
  const chain_id = new u16()
  chain_id.val = CHAIN_ID_ETH;
  const chain_id_encoded = serialize(u16Schema,chain_id)
  const foreign_emitter = PublicKey.findProgramAddressSync([Buffer.from("foreign_emitter"),Buffer.from(chain_id_encoded)],programId)
  const first_message_sequence_no = new u64()
  first_message_sequence_no.val = BigInt(1);
  const first_message_sequence_no_encoded = serialize(u64Schema,first_message_sequence_no)
  const wormhole_message = PublicKey.findProgramAddressSync([Buffer.from("sent"),Buffer.from(first_message_sequence_no_encoded)],programId);
  const message_sequence_no = new u64()
  message_sequence_no.val = BigInt(1);
  const sequence_no_encoded = serialize(u64Schema,message_sequence_no)
  const received = PublicKey.findProgramAddressSync([Buffer.from("received"),Buffer.from(chain_id_encoded),Buffer.from(sequence_no_encoded)],programId);
  

  const tx = await program.methods
    .receiveRequestGetRandomNumberAndPost(vaaHash)
    .accounts({
      payer: player.publicKey,
      feedAccount1: feedAccount1,
      feedAccount2: feedAccount2,
      feedAccount3: feedAccount3,
      fallbackAccount: fallbackAccount,
      currentFeedsAccount: current_feeds_account[0],
      temp: tempKeypair.publicKey,
      rngProgram: rngProgram,
      wormholeBridge: wormhole_bridge[0],
      wormholeFeeCollector: wormhole_fee_collector[0],
      wormholeSequence: wormhole_sequence[0],
      wormholeMessage: wormhole_message[0],
      foreignEmitter: foreign_emitter[0],
      received: received[0],

    })
    .signers([player, tempKeypair])
    .rpc();

}
