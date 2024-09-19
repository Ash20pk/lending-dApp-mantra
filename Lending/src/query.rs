use cosmwasm_std::{Binary, Deps, StdResult, Env, to_json_binary};
use crate::state::{BORROWERS, CONFIG, STAKERS};
use crate::msg::QueryMsg;
use crate::state::{BorrowerInfo, StakerInfo, Config};

pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetConfig {} => to_json_binary(&query_config(deps)?),
        QueryMsg::GetStakerInfo { address } => to_json_binary(&query_staker_info(deps, address)?),
        QueryMsg::GetBorrowerInfo { address } => to_json_binary(&query_borrower_info(deps, address)?),
    }
}

fn query_config(deps: Deps) -> StdResult<Config> {
    CONFIG.load(deps.storage)
}

fn query_staker_info(deps: Deps, address: String) -> StdResult<StakerInfo> {
    let addr = deps.api.addr_validate(&address)?;
    STAKERS.load(deps.storage, addr)
}

fn query_borrower_info(deps: Deps, address: String) -> StdResult<BorrowerInfo> {
    let addr = deps.api.addr_validate(&address)?;
    BORROWERS.load(deps.storage, addr)
}