use cosmwasm_std::{Addr, Uint128};
use cw_storage_plus::{Item, Map};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct Config {
    pub usd_token: Addr,
    pub om_token: Addr,
    pub interest_rate: u64,
    pub collateral_ratio: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct StakerInfo {
    pub staked_amount: Uint128,
    pub last_update_time: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct BorrowerInfo {
    pub borrowed_amount: Uint128,
    pub collateral_amount: Uint128,
    pub last_update_time: u64,
}

pub const CONFIG: Item<Config> = Item::new("config");
pub const STAKERS: Map<Addr, StakerInfo> = Map::new("stakers");
pub const BORROWERS: Map<Addr, BorrowerInfo> = Map::new("borrowers");