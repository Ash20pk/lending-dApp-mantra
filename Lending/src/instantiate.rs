use cosmwasm_std::{DepsMut, Env, MessageInfo, Response, StdResult};
use crate::state::{CONFIG, Config};
use crate::msg::InstantiateMsg;

pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    let config = Config {
        usd_token: deps.api.addr_validate(&msg.usd_token)?,
        om_token: deps.api.addr_validate(&msg.om_token)?,
        interest_rate: msg.interest_rate,
        collateral_ratio: msg.collateral_ratio,
    };
    CONFIG.save(deps.storage, &config)?;
    Ok(Response::default())
}