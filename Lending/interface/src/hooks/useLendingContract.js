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
    try {
      const signingClient = await getSigningClient();
      const result = await signingClient.instantiate(
        account.bech32Address,
        initMsg.code_id,
        initMsg,
        "Instantiate Lending Contract",
        "auto"
      );
      return result;
    } catch (error) {
      console.error("Error instantiating contract:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [account, getSigningClient]);

  const getSpendableBalance = useCallback(async (tokenAddress) => {
    if (!account || !cosmWasmClient) return null;

    try {
      const [balanceResponse, allowanceResponse] = await Promise.all([
        cosmWasmClient.queryContractSmart(tokenAddress, { 
          balance: { address: account.bech32Address } 
        }),
        cosmWasmClient.queryContractSmart(tokenAddress, { 
          allowance: { owner: account.bech32Address, spender: CONTRACT_ADDRESS } 
        })
      ]);

      const balance = BigInt(balanceResponse.balance);
      const allowance = BigInt(allowanceResponse.allowance);

      // The spendable balance is the minimum of the balance and the allowance
      const spendableBalance = balance < allowance ? balance : allowance;

      console.log(balance.toString(), allowance.toString(), spendableBalance.toString())

      return {
        balance: balance.toString(),
        allowance: allowance.toString(),
        spendableBalance: spendableBalance.toString()
      };
    } catch (error) {
      console.error("Error checking spendable balance:", error);
      throw error;
    }
  }, [account, cosmWasmClient]);


  const checkBalance = useCallback(async (tokenAddress) => {
    if (!account) return;
    try {
      const signingClient = await getSigningClient();
      const balance = await signingClient.queryContractSmart(tokenAddress, { balance: { address: account.bech32Address } });
      return balance.balance;
    } catch (error) {
      console.error("Error checking balance:", error);
      throw error;
    }
  }, [account, getSigningClient]);

  const setAllowance = useCallback(async (tokenAddress, amount) => {
    if (!account) return;
    setLoading(true);
    try {
      const signingClient = await getSigningClient();
      const result = await signingClient.execute(
        account.bech32Address,
        tokenAddress,
        { increase_allowance: { spender: CONTRACT_ADDRESS, amount: amount.toString() } },
        "auto",
        ""
      );
      return result;
    } catch (error) {
      console.error("Error setting allowance:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [account, getSigningClient]);

  const stake = useCallback(async (amount) => {
    if (!account) return;
    setLoading(true);
    try {
      const signingClient = await getSigningClient();
      const balance = await checkBalance(USD_TOKEN_ADDRESS);
      const amountToStake = BigInt(amount);
      if (BigInt(balance) < amountToStake) {
        throw new Error("Insufficient balance");
      }

      // await getSpendableBalance(USD_TOKEN_ADDRESS);
      await setAllowance(USD_TOKEN_ADDRESS, amountToStake);
      const result = await signingClient.execute(
        account.bech32Address,
        CONTRACT_ADDRESS,
        { stake: {} },
        "auto",
        "",
        coins(Number(amountToStake.toString()), "USD"),
      );
      return result;
    } catch (error) {
      console.error("Error staking:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [account, getSigningClient, checkBalance, setAllowance]);

  const borrow = useCallback(async () => {
    if (!account) return;
    setLoading(true);
    try {
      const signingClient = await getSigningClient();
      const result = await signingClient.execute(
        account.bech32Address,
        CONTRACT_ADDRESS,
        { borrow: {} },
        "auto",
        ""
      );
      return result;
    } catch (error) {
      console.error("Error borrowing:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [account, getSigningClient]);

  const repay = useCallback(async (amount) => {
    if (!account) return;
    setLoading(true);
    try {
      const signingClient = await getSigningClient();
      const balance = await checkBalance(OM_TOKEN_ADDRESS);
      if (balance < amount) {
        throw new Error("Insufficient balance");
      }
      await setAllowance(OM_TOKEN_ADDRESS, amount);
      const result = await signingClient.execute(
        account.bech32Address,
        CONTRACT_ADDRESS,
        { repay: {} },
        "auto",
        "",
        coins(amount, "om")
      );
      return result;
    } catch (error) {
      console.error("Error repaying:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [account, getSigningClient, checkBalance, setAllowance]);

  return { instantiateContract, stake, borrow, repay, loading, setLoading, checkBalance };
}