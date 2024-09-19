import { useCallback, useState } from 'react';
import { useAccount, useCosmWasmClient } from "graz";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { CONTRACT_ADDRESS, USD_TOKEN_ADDRESS, OM_TOKEN_ADDRESS } from '../chain';
import { GasPrice } from "@cosmjs/stargate";
import { coins } from "@cosmjs/proto-signing";

export function useLendingContract() {
  const { data: account } = useAccount();
  const { data: cosmWasmClient } = useCosmWasmClient();
  const [loading, setLoading] = useState(false);

  const getSigningClient = useCallback(async () => {
    if (!window.keplr) throw new Error("Keplr not found");
    await window.keplr.enable("mantra-hongbai-1");
    const offlineSigner = window.keplr.getOfflineSigner("mantra-hongbai-1");
    const gasPrice = GasPrice.fromString('0.025uaum');
    return await SigningCosmWasmClient.connectWithSigner("https://rpc.hongbai.mantrachain.io", offlineSigner, { gasPrice });
  }, []);

  const instantiateContract = useCallback(async (initMsg) => {
    if (!account) return;
    setLoading(true);
    const signingClient = await getSigningClient();
    const result = await signingClient.instantiate(
      account.bech32Address,
      initMsg.code_id,
      initMsg,
      "Instantiate Lending Contract",
      "auto"
    );
    setLoading(false);
    return result;
  }, [account, getSigningClient]);

  const checkBalance = useCallback(async (tokenAddress) => {
    if (!account) return;
    const signingClient = await getSigningClient();
    const balance = await signingClient.queryContractSmart(tokenAddress, { balance: { address: account.bech32Address } });
    return balance.balance/1000000;
  }, [account, getSigningClient]);

  const setAllowance = useCallback(async (tokenAddress, amount) => {
    if (!account) return;
    setLoading(true);
    const signingClient = await getSigningClient();
    const result = await signingClient.execute(
      account.bech32Address,
      tokenAddress,
      { increase_allowance: { spender: CONTRACT_ADDRESS, amount } },
      "auto",
      ""
    );
    setLoading(false);
    return result;
  }, [account, getSigningClient]);

  const stake = useCallback(async (amount) => {
    if (!account) return;
    setLoading(true);
    const signingClient = await getSigningClient();
    const balance = await checkBalance(USD_TOKEN_ADDRESS);
    if (balance < amount) {
      setLoading(false);
      throw new Error("Insufficient balance");
    }
    // await setAllowance(USD_TOKEN_ADDRESS, amount);
    const result = await signingClient.execute(
      account.bech32Address,
      CONTRACT_ADDRESS,
      { stake: {} },
      "auto",
      "",
      coins(amount, "usd")
    );
    setLoading(false);
    return result;
  }, [account, getSigningClient, checkBalance, setAllowance]);

  const borrow = useCallback(async () => {
    if (!account) return;
    setLoading(true);
    const signingClient = await getSigningClient();
    const result = await signingClient.execute(
      account.bech32Address,
      CONTRACT_ADDRESS,
      { borrow: {} },
      "auto",
      ""
    );
    setLoading(false);
    return result;
  }, [account, getSigningClient]);

  const repay = useCallback(async (amount) => {
    if (!account) return;
    setLoading(true);
    const signingClient = await getSigningClient();
    const balance = await checkBalance(OM_TOKEN_ADDRESS);
    if (balance < amount) {
      setLoading(false);
      throw new Error("Insufficient balance");
    }
    // await setAllowance(OM_TOKEN_ADDRESS, amount);
    const result = await signingClient.execute(
      account.bech32Address,
      CONTRACT_ADDRESS,
      { repay: {} },
      "auto",
      "",
      coins(amount, "om")
    );
    setLoading(false);
    return result;
  }, [account, getSigningClient, checkBalance, setAllowance]);

  return { instantiateContract, stake, borrow, repay, loading, setLoading, checkBalance };
}