export const mantraChainConfig = {
  "chainId": "mantra-hongbai-1",
  "chainName": "MANTRA Hongbai Testnet",
  "chainSymbolImageUrl": "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/mantra-hongbai/chain.png",
  "rpc": "https://rpc.hongbai.mantrachain.io",
  "rest": "https://api.hongbai.mantrachain.io",
  "nodeProvider": {
    "name": "MANTRA Chain",
    "email": "contact@mantrachain.io",
    "website":"https://www.mantrachain.io"
  },
  "bip44": {
    "coinType": 118
  },
  "bech32Config": {
    "bech32PrefixAccAddr": "mantra",
    "bech32PrefixAccPub": "mantrapub",
    "bech32PrefixValAddr": "mantravaloper",
    "bech32PrefixValPub": "mantravaloperpub",
    "bech32PrefixConsAddr": "mantravalcons",
    "bech32PrefixConsPub": "mantravalconspub"
  },
  "currencies": [
    {
      "coinDenom": "OM",
      "coinMinimalDenom": "uom",
      "coinDecimals": 6
    }
  ],
  "feeCurrencies": [
    {
      "coinDenom": "OM",
      "coinMinimalDenom": "uom",
      "coinDecimals": 6,
      "gasPriceStep": {
        "low": 0.01,
        "average": 0.025,
        "high": 0.03
      }
    }
  ],
  "stakeCurrency": {
    "coinDenom": "OM",
    "coinMinimalDenom": "uom",
    "coinDecimals": 6
  },
  "features": [
    "cosmwasm"  
  ]
};
  
export const CONTRACT_ADDRESS = "mantra1slhlgeea706v36yejg7h8w8cdt07hugmrqcvy7kk27lsyjkvedhssm9p5k";
export const USD_TOKEN_ADDRESS = "mantra1ea5wtncxfccd56csxfr45aknxufv4cvkyhcsceuksvrt0rswxd7sa5rela";
export const OM_TOKEN_ADDRESS = "mantra19qy5a8zggf2xatr5aggafzln9s4dp3yn4nga8ekcaulfhmk6cuxqtsxu03";