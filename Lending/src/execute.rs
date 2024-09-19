use cosmwasm_std::{
    to_json_binary, Addr, BankMsg, Coin, CosmosMsg, DepsMut, Env, MessageInfo, Response, StdResult,
    Uint128, WasmMsg,
};
use cw20::{Cw20ExecuteMsg as Cw20Msg};
use cw20_base::msg::ExecuteMsg as Cw20BaseMsg;
use crate::state::{BORROWERS, CONFIG, STAKERS, StakerInfo, BorrowerInfo};
use crate::msg::ExecuteMsg;
use crate::receive::receive_cw20;

pub fn execute(deps: DepsMut, env: Env, info: MessageInfo, msg: ExecuteMsg) -> StdResult<Response> {
    match msg {
        ExecuteMsg::Stake {} => stake(deps, env, info),
        ExecuteMsg::Borrow {} => borrow(deps, env, info),
        ExecuteMsg::Repay {} => repay(deps, env, info),
        ExecuteMsg::Receive(msg) => receive_cw20(deps, env, info, msg),
    }
}

pub fn stake(deps: DepsMut, env: Env, info: MessageInfo) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;
    // Assuming the first token in info.funds is the correct one
    let amount = info.funds.first().ok_or_else(|| {
        StdError::generic_err("No token found in info.funds")
    })?.amount;

    let staker_info = STAKERS.may_load(deps.storage, info.sender.clone())?;
    let staker_info = staker_info.unwrap_or_else(|| StakerInfo {
        staked_amount: Uint128::zero(),
        last_update_time: env.block.time.seconds(),
    });

    let new_staked_amount = staker_info.staked_amount.checked_add(amount)?;
    STAKERS.save(
        deps.storage,
        info.sender.clone(),
        &StakerInfo {
            staked_amount: new_staked_amount,
            last_update_time: env.block.time.seconds(),
        },
    )?;

    Ok(Response::new()
        .add_attribute("action", "stake")
        .add_attribute("amount", amount))
}

pub fn borrow(deps: DepsMut, env: Env, info: MessageInfo) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;
    let staker_info = STAKERS.load(deps.storage, info.sender.clone())?;

    let collateral_ratio = Uint128::from(config.collateral_ratio);
    let borrow_amount = staker_info.staked_amount.multiply_ratio(collateral_ratio, Uint128::from(10000u128));

    let borrower_info = BORROWERS.may_load(deps.storage, info.sender.clone())?;
    let borrower_info = borrower_info.unwrap_or_else(|| BorrowerInfo {
        borrowed_amount: Uint128::zero(),
        collateral_amount: Uint128::zero(),
        last_update_time: env.block.time.seconds(),
    });

    let new_borrowed_amount = borrower_info.borrowed_amount.checked_add(borrow_amount)?;
    let new_collateral_amount = borrower_info.collateral_amount.checked_add(staker_info.staked_amount)?;

    BORROWERS.save(
        deps.storage,
        info.sender.clone(),
        &BorrowerInfo {
            borrowed_amount: new_borrowed_amount,
            collateral_amount: new_collateral_amount,
            last_update_time: env.block.time.seconds(),
        },
    )?;

    let transfer_msg = CosmosMsg::Wasm(WasmMsg::Execute {
        contract_addr: config.om_token.to_string(),
        msg: to_json_binary(&Cw20BaseMsg::Transfer {
            recipient: info.sender.to_string(),
            amount: borrow_amount,
        })?,
        funds: vec![],
    });

    Ok(Response::new()
        .add_message(transfer_msg)
        .add_attribute("action", "borrow")
        .add_attribute("amount", borrow_amount))
}

pub fn repay(deps: DepsMut, env: Env, info: MessageInfo) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;
    let borrower_info = BORROWERS.load(deps.storage, info.sender.clone())?;

    // Assuming the first token in info.funds is the correct one
    let amount = info.funds.first().ok_or_else(|| {
        StdError::generic_err("No token found in info.funds")
    })?.amount;
    let new_borrowed_amount = borrower_info.borrowed_amount.checked_sub(amount)?;

    BORROWERS.save(
        deps.storage,
        info.sender.clone(),
        &BorrowerInfo {
            borrowed_amount: new_borrowed_amount,
            collateral_amount: borrower_info.collateral_amount,
            last_update_time: env.block.time.seconds(),
        },
    )?;

    let transfer_msg = CosmosMsg::Wasm(WasmMsg::Execute {
        contract_addr: config.om_token.to_string(),
        msg: to_json_binary(&Cw20BaseMsg::Transfer {
            recipient: env.contract.address.to_string(),
            amount: amount,
        })?,
        funds: vec![],
    });

    Ok(Response::new()
        .add_message(transfer_msg)
        .add_attribute("action", "repay")
        .add_attribute("amount", amount))
}