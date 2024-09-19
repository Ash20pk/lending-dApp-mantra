import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  Button,
  Flex,
  useColorMode,
  Container,
  useToast,
  Center,
  Spacer,
  Badge,
} from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { useAccount, useConnect, useDisconnect } from "graz";
import { useLendingContract } from './hooks/useLendingContract';
import { checkKeplrInstalled, getKeplrInstallUrl } from './utils/keplrUtils';
import { USD_TOKEN_ADDRESS, OM_TOKEN_ADDRESS } from './chain';

export default function App() {
  const { data: account, isConnected, isConnecting, isReconnecting } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { stake, borrow, repay, loading, setLoading, checkBalance } = useLendingContract();
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();

  const [amount, setAmount] = useState(0);
  const [usdBalance, setUsdBalance] = useState(0);
  const [omBalance, setOmBalance] = useState(0);

  const connectWallet = async () => {
    if (!checkKeplrInstalled()) {
      const installUrl = getKeplrInstallUrl();
      if (window.confirm("Keplr wallet is not installed. Would you like to install it now?")) {
        window.open(installUrl, '_blank');
      }
    } else {
      try {
        connect({ chainId: "mantra-hongbai-1" });
      } catch (error) {
        console.error("Failed to connect:", error);
        showToast("Failed to connect. Please make sure Keplr is set up correctly.", "error");
      }
    }
  };

  const checkBalances = useCallback(async () => {
    if (!account) return;
    const usdBalance = await checkBalance(USD_TOKEN_ADDRESS);
    const omBalance = await checkBalance(OM_TOKEN_ADDRESS);
    setUsdBalance(usdBalance);
    setOmBalance(omBalance);
  }, [account]);

  useEffect(() => {
    if (isConnected) {
      checkBalances();
    }
  }, [isConnected, checkBalances]);

  const handleStake = useCallback(async () => {
    try {
      await stake(amount);
      showToast("Staked successfully!", "success");
      checkBalances();
    } catch (error) {
      console.error("Stake failed:", error);
      showToast("Error staking. Please try again.", "error");
    }
  }, [stake, amount, checkBalances]);

  const handleBorrow = useCallback(async () => {
    try {
      await borrow();
      showToast("Borrowed successfully!", "success");
    } catch (error) {
      console.error("Borrow failed:", error);
      showToast("Error borrowing. Please try again.", "error");
    }
  }, [borrow]);

  const handleRepay = useCallback(async () => {
    try {
      await repay(amount);
      showToast("Repaid successfully!", "success");
      checkBalances();
    } catch (error) {
      console.error("Repay failed:", error);
      showToast("Error repaying. Please try again.", "error");
    }
  }, [repay, amount, checkBalances]);

  const showToast = (message, status) => {
    toast({
      title: status === "error" ? "Error" : "Success",
      description: message,
      status: status,
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box minH="100vh" minW="100vw" bg={colorMode === "dark" ? "gray.800" : "gray.100"}>
      <Container maxW="container.xl" py={8}>
        <Flex justify="space-between" align="center" mb={8}>
          <Heading size="xl">Lending DApp</Heading>
          <HStack spacing={4}>
            {account && (
              <Text fontSize="sm">
                {account.bech32Address.slice(0, 8)}...{account.bech32Address.slice(-4)}
              </Text>
            )}
            <Button
              onClick={() => isConnected ? disconnect() : connectWallet()}
              isLoading={isConnecting || isReconnecting}
              loadingText="Connecting"
            >
              {isConnected ? "Disconnect" : "Connect Wallet"}
            </Button>
            <Button onClick={toggleColorMode}>
              {colorMode === "light" ? <MoonIcon /> : <SunIcon />}
            </Button>
          </HStack>
        </Flex>

        {isConnected ? (
          <VStack spacing={8} align="stretch">
            <Center>
              <VStack spacing={4}>
                <Heading size="lg" colorScheme="black">Lending Operations</Heading>
                <Text>USD Balance: {usdBalance}</Text>
                <Text>OM Balance: {omBalance}</Text>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                />
                <Button
                  onClick={handleStake}
                  isLoading={loading}
                  loadingText="Staking"
                  colorScheme="blue"
                  size="lg"
                >
                  Stake
                </Button>
                <Button
                  onClick={handleBorrow}
                  isLoading={loading}
                  loadingText="Borrowing"
                  colorScheme="green"
                  size="lg"
                >
                  Borrow
                </Button>
                <Button
                  onClick={handleRepay}
                  isLoading={loading}
                  loadingText="Repaying"
                  colorScheme="red"
                  size="lg"
                >
                  Repay
                </Button>
              </VStack>
            </Center>
          </VStack>
        ) : (
          <Center h="50vh">
            <VStack spacing={6}>
              <Heading size="lg">Welcome to Lending DApp</Heading>
              <Text>Connect your wallet to start lending operations</Text>
              <Button size="lg" onClick={connectWallet} colorScheme="blue">
                Connect Wallet
              </Button>
            </VStack>
          </Center>
        )}
      </Container>
    </Box>
  );
}