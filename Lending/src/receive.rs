use cosmwasm_std::{DepsMut, Env, MessageInfo, Response, StdResult, Uint128, Addr};
use cw20::Cw20ReceiveMsg;
use crate::state::{BORROWERS, CONFIG, STAKERS, StakerInfo, BorrowerInfo};
use cosmwasm_std::StdError;

pub fn receive_cw20(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    wrapper: Cw20ReceiveMsg,
) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;
    let amount = wrapper.amount;

    if info.sender == config.usd_token {
        let sender_addr = deps.api.addr_validate(&wrapper.sender)?;
        let staker_info = STAKERS.may_load(deps.storage, sender_addr.clone())?;
        let staker_info = staker_info.unwrap_or_else(|| StakerInfo {
            staked_amount: Uint128::zero(),
            last_update_time: env.block.time.seconds(),
        });

        let new_staked_amount = staker_info.staked_amount.checked_add(amount)?;
        STAKERS.save(
            deps.storage,
            sender_addr.clone(),
            &StakerInfo {
                staked_amount: new_staked_amount,
                last_update_time: env.block.time.seconds(),
            },
        )?;

        Ok(Response::new()
            .add_attribute("action", "stake")
            .add_attribute("amount", amount))
    } else if info.sender == config.om_token {
        let sender_addr = deps.api.addr_validate(&wrapper.sender)?;
        let borrower_info = BORROWERS.load(deps.storage, sender_addr.clone())?;
        let new_borrowed_amount = borrower_info.borrowed_amount.checked_sub(amount)?;

        BORROWERS.save(
            deps.storage,
            sender_addr.clone(),
            &BorrowerInfo {
                borrowed_amount: new_borrowed_amount,
                collateral_amount: borrower_info.collateral_amount,
                last_update_time: env.block.time.seconds(),
            },
        )?;

        Ok(Response::new()
            .add_attribute("action", "repay")
            .add_attribute("amount", amount))
    } else {
        Err(StdError::generic_err("Invalid token"))
    }
}