use anchor_lang::prelude::*;

pub use context::*;
pub use error::*;
pub use message::*;
pub use state::*;

pub mod context;
pub mod error;
pub mod message;
pub mod state;

declare_id!("AMcPHgYcvCBUnPjKpWE1DQsU5Ru4tnyocxvBMLJgFw7k");

#[program]

pub mod solana_emitter {
    use super::*;
    use anchor_lang::solana_program;
    use borsh::{BorshDeserialize, BorshSerialize};
    use solana_program::{instruction::Instruction, program::{get_return_data, invoke}};
    use wormhole_anchor_sdk::wormhole;


    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let config = &mut ctx.accounts.config;

        config.owner = ctx.accounts.owner.key();

        {
            let wormhole = &mut config.wormhole;

            wormhole.bridge = ctx.accounts.wormhole_bridge.key();


            wormhole.fee_collector = ctx.accounts.wormhole_fee_collector.key();


            wormhole.sequence = ctx.accounts.wormhole_sequence.key();
        }


        config.batch_id = 0;


        config.finality = wormhole::Finality::Confirmed as u8;


        ctx.accounts.wormhole_emitter.bump = ctx.bumps.wormhole_emitter;


        {

            let fee = ctx.accounts.wormhole_bridge.fee();
            if fee > 0 {
                solana_program::program::invoke(
                    &solana_program::system_instruction::transfer(
                        &ctx.accounts.owner.key(),
                        &ctx.accounts.wormhole_fee_collector.key(),
                        fee,
                    ),
                    &ctx.accounts.to_account_infos(),
                )?;
            }


            let wormhole_emitter = &ctx.accounts.wormhole_emitter;
            let config = &ctx.accounts.config;


            let mut payload: Vec<u8> = Vec::new();
            SolanaEmitterMessage::serialize(
                &SolanaEmitterMessage::Alive {
                    program_id: *ctx.program_id,
                },
                &mut payload,
            )?;

            wormhole::post_message(
                CpiContext::new_with_signer(
                    ctx.accounts.wormhole_program.to_account_info(),
                    wormhole::PostMessage {
                        config: ctx.accounts.wormhole_bridge.to_account_info(),
                        message: ctx.accounts.wormhole_message.to_account_info(),
                        emitter: wormhole_emitter.to_account_info(),
                        sequence: ctx.accounts.wormhole_sequence.to_account_info(),
                        payer: ctx.accounts.owner.to_account_info(),
                        fee_collector: ctx.accounts.wormhole_fee_collector.to_account_info(),
                        clock: ctx.accounts.clock.to_account_info(),
                        rent: ctx.accounts.rent.to_account_info(),
                        system_program: ctx.accounts.system_program.to_account_info(),
                    },
                    &[
                        &[
                            SEED_PREFIX_SENT,
                            &wormhole::INITIAL_SEQUENCE.to_le_bytes()[..],
                            &[ctx.bumps.wormhole_message],
                        ],
                        &[wormhole::SEED_PREFIX_EMITTER, &[wormhole_emitter.bump]],
                    ],
                ),
                config.batch_id,
                payload,
                config.finality.try_into().unwrap(),
            )?;
        }

        Ok(())
    }



    pub fn register_emitter(
        ctx: Context<RegisterEmitter>,
        chain: u16,
        address: [u8; 32],
    ) -> Result<()> {

        require!(
            chain > 0 && chain != wormhole::CHAIN_ID_SOLANA && !address.iter().all(|&x| x == 0),
            SolanaEmitterError::InvalidForeignEmitter,
        );

        let emitter = &mut ctx.accounts.foreign_emitter;
        emitter.chain = chain;
        emitter.address = address;

        Ok(())
    }



#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct RandomNumber {
    pub random_number: u64,
}



pub fn receive_request_get_random_number_and_post(ctx: Context<ReceiveRequestAndPostMessage>, vaa_hash: [u8; 32]) -> Result<()> {
        let posted_message = &ctx.accounts.posted;

        if let SolanaEmitterMessage::Hello { message } = posted_message.data() {
            require!(
                message.len() <= MESSAGE_MAX_LENGTH,
                SolanaEmitterError::InvalidMessage,
            );

            let received = &mut ctx.accounts.received;
            received.batch_id = posted_message.batch_id();
            received.wormhole_message_hash = vaa_hash;
            received.message = message.clone();

        } else {
           return Err(SolanaEmitterError::InvalidMessage.into());
        }

        let rng_program: &Pubkey = ctx.accounts.rng_program.key;

        //Creating instruction for cross program invocation to RNG_PROGRAM
        let instruction: Instruction = Instruction {
            program_id: *rng_program,
            accounts: vec![
                ctx.accounts.payer.to_account_metas(Some(true))[0].clone(),
                ctx.accounts.feed_account_1.to_account_metas(Some(false))[0].clone(),
                ctx.accounts.feed_account_2.to_account_metas(Some(false))[0].clone(),
                ctx.accounts.feed_account_3.to_account_metas(Some(false))[0].clone(),
                ctx.accounts.fallback_account.to_account_metas(Some(false))[0].clone(),
                ctx.accounts.current_feeds_account.to_account_metas(Some(false))[0].clone(),
                ctx.accounts.temp.to_account_metas(Some(true))[0].clone(),
                ctx.accounts.system_program.to_account_metas(Some(false))[0].clone(),
            ],
            data: vec![0],
        };

        //Creating account infos for CPI to RNG_PROGRAM
        let account_infos: &[AccountInfo; 8] = &[
            ctx.accounts.payer.to_account_info().clone(),
            ctx.accounts.feed_account_1.to_account_info().clone(),
            ctx.accounts.feed_account_2.to_account_info().clone(),
            ctx.accounts.feed_account_3.to_account_info().clone(),
            ctx.accounts.fallback_account.to_account_info().clone(),
            ctx.accounts.current_feeds_account.to_account_info().clone(),
            ctx.accounts.temp.to_account_info().clone(),
            ctx.accounts.system_program.to_account_info().clone(),
        ];

        //CPI to RNG_PROGRAM
        invoke(&instruction, account_infos)?;

        let returned_data: (Pubkey, Vec<u8>) = get_return_data().unwrap();

        //Random number is returned from the RNG_PROGRAM
        let random_number: RandomNumber;
        if &returned_data.0 == rng_program {
            random_number = RandomNumber::try_from_slice(&returned_data.1)?;
            msg!("{}", random_number.random_number);

        } else {
            return Err(SolanaEmitterError::FailedToGetRandomNumber.into());
        }

        let fee = ctx.accounts.wormhole_bridge.fee();
        if fee > 0 {
            solana_program::program::invoke(
                &solana_program::system_instruction::transfer(
                    &ctx.accounts.payer.key(),
                    &ctx.accounts.wormhole_fee_collector.key(),
                    fee,
                ),
                &ctx.accounts.to_account_infos(),
            )?;
        }


        let wormhole_emitter = &ctx.accounts.wormhole_emitter;
        let config = &ctx.accounts.config;


        let payload: Vec<u8> = SolanaEmitterMessage::Hello { message:returned_data.1 }.try_to_vec()?;

        wormhole::post_message(
            CpiContext::new_with_signer(
                ctx.accounts.wormhole_program.to_account_info(),
                wormhole::PostMessage {
                    config: ctx.accounts.wormhole_bridge.to_account_info(),
                    message: ctx.accounts.wormhole_message.to_account_info(),
                    emitter: wormhole_emitter.to_account_info(),
                    sequence: ctx.accounts.wormhole_sequence.to_account_info(),
                    payer: ctx.accounts.payer.to_account_info(),
                    fee_collector: ctx.accounts.wormhole_fee_collector.to_account_info(),
                    clock: ctx.accounts.clock.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                },
                &[
                    &[
                        SEED_PREFIX_SENT,
                        &ctx.accounts.wormhole_sequence.next_value().to_le_bytes()[..],
                        &[ctx.bumps.wormhole_message],
                    ],
                    &[wormhole::SEED_PREFIX_EMITTER, &[wormhole_emitter.bump]],
                ],
            ),
            config.batch_id,
            payload,
            config.finality.try_into().unwrap(),
        )?;

        Ok(())

    }
}


