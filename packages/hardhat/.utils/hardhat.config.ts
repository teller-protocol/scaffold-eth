/*

 _______ _________ _______  _______
(  ____ \\__   __/(  ___  )(  ____ )
| (    \/   ) (   | (   ) || (    )|
| (_____    | |   | |   | || (____)|
(_____  )   | |   | |   | ||  _____)
      ) |   | |   | |   | || (
/\____) |   | |   | (___) || )
\_______)   )_(   (_______)|/

DO NOT MODIFY THIS FILE! YOU MAY OVERRIDE VALUES IN THE PROJECT CONFIG FILE

*/

import '@nomiclabs/hardhat-waffle'
import '@tenderly/hardhat-tenderly'
import 'hardhat-contract-sizer'
import 'hardhat-deploy'
import 'hardhat-gas-reporter'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-etherscan'

import {
  TransactionReceipt,
  TransactionRequest,
} from '@ethersproject/providers'
import { HardhatEthersHelpers } from '@nomiclabs/hardhat-ethers/dist/src/types'
import chalk from 'chalk'
import { config } from 'dotenv'
import * as EthUtil from 'ethereumjs-util'
import { Signer, utils } from 'ethers'
import fs from 'fs'
import { HardhatUserConfig, task } from 'hardhat/config'
import {
  HardhatNetworkHDAccountsUserConfig,
  NetworkUserConfig,
} from 'hardhat/types'
import colorize from 'json-colorizer'
import path from 'path'
import rrequire from './rrequire'

config()
const { isAddress, getAddress, formatUnits, parseUnits, parseEther } = utils

const { COMPILING, CMC_KEY, FORKING_NETWORK, SAVE_GAS_REPORT, TESTING } =
  process.env

let isTesting = false
if (COMPILING != 'true') {
  rrequire(path.resolve(__dirname, '..', 'tasks'))
  rrequire(path.resolve(__dirname, 'tasks'))
  require('./hre-extensions')
}
if (TESTING === '1') {
  isTesting = true

  require('./chai-helpers')
}

const getMnemonic = (): string => {
  try {
    return fs
      .readFileSync(path.join(__dirname, 'mnemonic.txt'))
      .toString()
      .trim()
  } catch (e) {
    console.log(
      '☢️ WARNING: No mnemonic file created for a deploy account. Try `yarn run generate` and then `yarn run account`.'
    )
  }
  return ''
}

const accounts: HardhatNetworkHDAccountsUserConfig = {
  mnemonic: getMnemonic(),
  count: 15,
  accountsBalance: parseEther('100000000').toString(),
}

const networkUrls: { [network: string]: string } = {
  mainnet: process.env.MAINNET_RPC_URL ?? '',
  kovan: process.env.KOVAN_RPC_URL ?? '',
  rinkeby: process.env.RINKEBY_RPC_URL ?? '',
  ropsten: process.env.ROPSTEN_RPC_URL ?? '',
  polygon: process.env.MATIC_RPC_URL ?? '',
  mumbai: process.env.MUMBAI_RPC_URL ?? '',
  goerli: process.env.GOERLI_RPC_URL ?? '',
  xdai: process.env.XDAI_RPC_URL ?? '',
  rinkebyArbitrum: process.env.RINKEBY_ARBITRUM_RPC_URL ?? '',
  optimism: process.env.OPTIMISM_RPC_URL ?? '',
  kovanOptimism: process.env.KOVAN_OPTIMISM_RPC_URL ?? '',
  fujiAvalanche: process.env.FUJI_AVALANCHE_RPC_URL ?? '',
  mainnetAvalanche: process.env.MAINNET_AVALANCHE_RPC_URL ?? '',
  testnetHarmony: process.env.TESTNET_HARMONY_RPC_URL ?? '',
  mainnetHarmony: process.env.MAINNET_HARMONY_RPC_URL ?? '',
}

const getLatestDeploymentBlock = (networkName: string): number | undefined => {
  try {
    return parseInt(
      fs
        .readFileSync(
          path.resolve(
            __dirname,
            'deployments',
            networkName,
            '.latestDeploymentBlock'
          )
        )
        .toString()
    )
  } catch {
    // Network deployment does not exist
  }
}

const networkConfig = (config: NetworkUserConfig): NetworkUserConfig => {
  config = {
    live: true,
    ...config,
    accounts,
    gas: 'auto',
  }

  return config
}

/*
      📡 This is where you configure your deploy configuration for 🏗 scaffold-eth

      check out `packages/scripts/deploy.js` to customize your deployment

      out of the box it will auto deploy anything in the `contracts` folder and named *.sol
      plus it will use *.args for constructor args
*/

const mainnetGwei = 21

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export default <HardhatUserConfig>{
  etherscan: {
    apiKey: '{see `updateEtherscanConfig` function in utils/hre-extensions.ts}',
  },

  tenderly: {
    username: 'soltel',
    project: '{see `updateTenderlyConfig` function in utils/hre-extensions.ts}',
  },

  paths: {
    sources: 'contracts',
  },

  external: {
    contracts: [
      {
        artifacts: 'node_modules/hardhat-deploy/extendedArtifacts',
      },
    ],
  },

  solidity: {
    compilers: [
      {
        version: '0.8.4',
        settings: {
          optimizer: {
            enabled: !isTesting,
            runs: 200,
          },
        },
      },
    ],
  },

  ovm: {
    solcVersion: '0.7.6',
  },

  contractSizer: {
    runOnCompile: !!COMPILING,
    alphaSort: false,
    disambiguatePaths: false,
  },

  /**
   * gas reporter configuration that let's you know
   * an estimate of gas for contract deployments and function calls
   * More here: https://hardhat.org/plugins/hardhat-gas-reporter.html
   */
  gasReporter: {
    enabled: true,
    currency: 'USD',
    coinmarketcap: CMC_KEY,
    outputFile: SAVE_GAS_REPORT ? 'gas-reporter.txt' : undefined,
    noColors: !!SAVE_GAS_REPORT,
    showMethodSig: false,
    showTimeSpent: true,
  },

  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
    },
  },

  // if you want to deploy to a testnet, mainnet, or xdai, you will need to configure:
  // 1. An Infura key (or similar)
  // 2. A private key for the deployer
  // DON'T PUSH THESE HERE!!!
  // An `example.env` has been provided in the Hardhat root. Copy it and rename it `.env`
  // Follow the directions, and uncomment the network you wish to deploy to.

  networks: {
    hardhat: networkConfig({
      chainId: 31337,
      live: false,
      allowUnlimitedContractSize: true,
      forking:
        FORKING_NETWORK == null
          ? undefined
          : {
              enabled: true,
              url: networkUrls[FORKING_NETWORK],
              blockNumber: getLatestDeploymentBlock(FORKING_NETWORK),
            },
    }),
    localhost: networkConfig({
      url: 'http://localhost:8545',
      live: false,
    }),
    mainnet: networkConfig({
      url: networkUrls.mainnet,
      chainId: 1,
      gasPrice: mainnetGwei * 1000000000,
    }),
    kovan: networkConfig({
      url: networkUrls.kovan,
      chainId: 42,
    }),
    rinkeby: networkConfig({
      url: networkUrls.rinkeby,
      chainId: 4,
    }),
    ropsten: networkConfig({
      url: networkUrls.ropsten,
      chainId: 3,
    }),
    goerli: networkConfig({
      url: networkUrls.goerli,
      // chainId: ,
    }),
    xdai: networkConfig({
      url: networkUrls.xdai,
      // chainId: ,
      gasPrice: 1000000000,
    }),
    polygon: networkConfig({
      url: networkUrls.polygon,
      chainId: 137,
      gasPrice: 1000000000,
    }),
    mumbai: networkConfig({
      url: networkUrls.mumbai,
      chainId: 80001,
      gasPrice: 1000000000,
    }),
    rinkebyArbitrum: networkConfig({
      url: networkUrls.rinkebyArbitrum,
      gasPrice: 0,
      companionNetworks: {
        l1: 'rinkeby',
      },
    }),
    localArbitrum: networkConfig({
      url: 'http://localhost:8547',
      gasPrice: 0,
      companionNetworks: {
        l1: 'localArbitrumL1',
      },
      live: false,
    }),
    localArbitrumL1: networkConfig({
      url: 'http://localhost:7545',
      gasPrice: 0,
      companionNetworks: {
        l2: 'localArbitrum',
      },
      live: false,
    }),
    optimism: networkConfig({
      url: networkUrls.optimism,
      companionNetworks: {
        l1: 'mainnet',
      },
    }),
    kovanOptimism: networkConfig({
      url: networkUrls.kovanOptimism,
      companionNetworks: {
        l1: 'kovan',
      },
    }),
    localOptimism: networkConfig({
      url: 'http://localhost:8545',
      companionNetworks: {
        l1: 'localOptimismL1',
      },
      live: false,
    }),
    localOptimismL1: networkConfig({
      url: 'http://localhost:9545',
      gasPrice: 0,
      companionNetworks: {
        l2: 'localOptimism',
      },
      live: false,
    }),
    localAvalanche: networkConfig({
      url: 'http://localhost:9650/ext/bc/C/rpc',
      gasPrice: 225000000000,
      chainId: 43112,
      live: false,
    }),
    fujiAvalanche: networkConfig({
      url: networkUrls.fujiAvalanche,
      gasPrice: 225000000000,
      chainId: 43113,
    }),
    mainnetAvalanche: networkConfig({
      url: networkUrls.mainnetAvalanche,
      gasPrice: 225000000000,
      chainId: 43114,
    }),
    testnetHarmony: networkConfig({
      url: networkUrls.testnetHarmony,
      gasPrice: 1000000000,
      chainId: 1666700000,
    }),
    mainnetHarmony: networkConfig({
      url: networkUrls.mainnetHarmony,
      gasPrice: 1000000000,
      chainId: 1666600000,
    }),
  },
}

const DEBUG = false

const debug = (text: string): void => {
  if (DEBUG) {
    console.log(text)
  }
}

task(
  'get-config',
  'Print the current Hardhat config object',
  async (_, { config }) => {
    console.log(colorize(config, { pretty: true }))
  }
)
task('wallet', 'Create a wallet (pk) link', async (_, { ethers }) => {
  const randomWallet = ethers.Wallet.createRandom()
  const privateKey = randomWallet._signingKey().privateKey
  console.log(`🔐 WALLET Generated as ${randomWallet.address}`)
  console.log(`🔗 http://localhost:3000/pk#${privateKey}`)
})

task('fundedwallet', 'Create a wallet (pk) link and fund it with deployer?')
  .addOptionalParam(
    'amount',
    'Amount of ETH to send to wallet after generating'
  )
  .addOptionalParam('url', 'URL to add pk to')
  .setAction(async (taskArgs, { network, ethers }) => {
    const randomWallet = ethers.Wallet.createRandom()
    const privateKey = randomWallet._signingKey().privateKey
    console.log(`🔐 WALLET Generated as ${randomWallet.address}`)
    const url = taskArgs.url ? taskArgs.url : 'http://localhost:3000'

    let localDeployerMnemonic: string | undefined
    try {
      localDeployerMnemonic = fs
        .readFileSync('./mnemonic.txt')
        .toString()
        .trim()
    } catch (e) {
      /* do nothing - this file isn't always there */
    }

    const amount = taskArgs.amount ? taskArgs.amount : '0.01'
    const tx = {
      to: randomWallet.address,
      value: ethers.utils.parseEther(amount),
    }

    // SEND USING LOCAL DEPLOYER MNEMONIC IF THERE IS ONE
    // IF NOT SEND USING LOCAL HARDHAT NODE:
    if (localDeployerMnemonic) {
      let deployerWallet = ethers.Wallet.fromMnemonic(localDeployerMnemonic)
      deployerWallet = deployerWallet.connect(ethers.provider)
      console.log(
        `💵 Sending ${amount} ETH to ${randomWallet.address} using deployer account`
      )
      const sendResult = await deployerWallet.sendTransaction(tx)

      console.log()
      console.log(`${url}/pk#${privateKey}`)
      console.log()

      return sendResult
    } else {
      console.log(
        `💵 Sending ${amount} ETH to ${randomWallet.address} using local node`
      )
      console.log()
      console.log(`${url}/pk#${privateKey}`)
      console.log()

      return await send(ethers.provider.getSigner(), tx)
    }
  })

task(
  'generate',
  'Create a mnemonic for builder deploys',
  async (_, { ethers }) => {
    const bip39 = require('bip39')
    const hdkey = require('ethereumjs-wallet/hdkey')
    const mnemonic = bip39.generateMnemonic()
    if (DEBUG) console.log('mnemonic', mnemonic)
    const seed = await bip39.mnemonicToSeed(mnemonic)
    if (DEBUG) console.log('seed', seed)
    const hdwallet = hdkey.fromMasterSeed(seed)
    const walletHDPath = "m/44'/60'/0'/0/"
    const accountIndex = 0
    const fullPath = `${walletHDPath}${accountIndex}`
    if (DEBUG) console.log('fullPath', fullPath)
    const wallet = hdwallet.derivePath(fullPath).getWallet()
    const privateKey = `0x${wallet._privKey.toString('hex')}`
    if (DEBUG) console.log('privateKey', privateKey)
    const privateAddress = EthUtil.privateToAddress(wallet._privKey)
    const address = `0x${privateAddress.toString('hex')}`

    console.log(
      `🔐 Account Generated as ${address} and set as mnemonic in packages/hardhat`
    )
    console.log(
      "💬 Use 'yarn run account' to get more information about the deployment account."
    )

    fs.writeFileSync(`./${address}.txt`, mnemonic.toString())
    fs.writeFileSync('./mnemonic.txt', mnemonic.toString())
  }
)

task(
  'mineContractAddress',
  'Looks for a deployer account that will give leading zeros'
)
  .addParam('searchFor', 'String to search for')
  .setAction(async (taskArgs, { network, ethers }) => {
    let contractAddress = ''
    let address

    const bip39 = require('bip39')
    const hdkey = require('ethereumjs-wallet/hdkey')

    let mnemonic = ''
    while (contractAddress.indexOf(taskArgs.searchFor) != 0) {
      mnemonic = bip39.generateMnemonic()
      if (DEBUG) console.log('mnemonic', mnemonic)
      const seed = await bip39.mnemonicToSeed(mnemonic)
      if (DEBUG) console.log('seed', seed)
      const hdwallet = hdkey.fromMasterSeed(seed)
      const walletHDPath = "m/44'/60'/0'/0/"
      const accountIndex = 0
      const fullPath = `${walletHDPath}${accountIndex}`
      if (DEBUG) console.log('fullPath', fullPath)
      const wallet = hdwallet.derivePath(fullPath).getWallet()
      const privateKey = `0x${wallet._privKey.toString('hex')}`
      if (DEBUG) console.log('privateKey', privateKey)
      const privateAddress = EthUtil.privateToAddress(wallet._privKey)
      address = `0x${privateAddress.toString('hex')}`

      const rlp = require('rlp')
      const keccak = require('keccak')

      const nonce = 0x00 // The nonce must be a hex literal!
      const sender = address

      const inputArr = [sender, nonce]
      const rlpEncoded = rlp.encode(inputArr)

      const contractAddressLong = keccak('keccak256')
        .update(rlpEncoded)
        .digest('hex')

      contractAddress = contractAddressLong.substring(24) // Trim the first 24 characters.
    }

    console.log(
      `⛏  Account Mined as ${address} and set as mnemonic in packages/hardhat`
    )
    console.log(
      `📜 This will create the first contract: ${chalk.magenta(
        `0x${contractAddress}`
      )}`
    )
    console.log(
      "💬 Use 'yarn run account' to get more information about the deployment account."
    )

    fs.writeFileSync(
      `./${address}_produces${contractAddress}.txt`,
      mnemonic.toString()
    )
    fs.writeFileSync('./mnemonic.txt', mnemonic.toString())
  })

task(
  'account',
  'Get balance informations for the deployment account.',
  async (_, { ethers, config }) => {
    const hdkey = require('ethereumjs-wallet/hdkey')
    const bip39 = require('bip39')
    try {
      // const mnemonic = fs.readFileSync('./mnemonic.txt').toString().trim()
      const mnemonic = getMnemonic()
      if (DEBUG) console.log('mnemonic', mnemonic)
      const seed = await bip39.mnemonicToSeed(mnemonic)
      if (DEBUG) console.log('seed', seed)
      const hdwallet = hdkey.fromMasterSeed(seed)
      const walletHDPath = "m/44'/60'/0'/0/"
      const accountIndex = 0
      const fullPath = `${walletHDPath}${accountIndex}`
      if (DEBUG) console.log('fullPath', fullPath)
      const wallet = hdwallet.derivePath(fullPath).getWallet()
      const privateKey = `0x${wallet._privKey.toString('hex')}`
      if (DEBUG) console.log('privateKey', privateKey)
      const privateAddress = EthUtil.privateToAddress(wallet._privKey)
      const address = `0x${privateAddress.toString('hex')}`

      const qrcode = require('qrcode-terminal')
      qrcode.generate(address)
      console.log(`‍📬 Deployer Account is ${address}`)
      for (const networkName in config.networks) {
        const network = config.networks[networkName]
        if (!('url' in network)) continue
        try {
          const provider = new ethers.providers.JsonRpcProvider(network.url)
          const balance = await provider.getBalance(address)
          console.log(` -- ${chalk.bold(networkName)} -- -- -- 📡 `)
          console.log(`  balance: ${ethers.utils.formatEther(balance)}`)
          console.log(`  nonce: ${await provider.getTransactionCount(address)}`)
          console.log()
        } catch (e) {
          if (DEBUG) {
            console.log(e)
          }
        }
      }
    } catch (err) {
      console.log(`--- Looks like there is no mnemonic file created yet.`)
      console.log(
        `--- Please run ${chalk.greenBright('yarn generate')} to create one`
      )
    }
  }
)

/**
 * Get a checksumed address.
 * @param ethers {HardhatEthersHelpers} Ethers object from Hardhat.
 * @param addr {string | number} The address string to be checksumed or an index in the account's mnemonic.
 * @return Promise<string> The checksumed address
 */
async function addr(
  ethers: HardhatEthersHelpers,
  addr: string | number
): Promise<string> {
  if (typeof addr === 'string' && isAddress(addr)) {
    return getAddress(addr)
  } else if (typeof addr === 'number') {
    const accounts = await ethers.provider.listAccounts()
    if (accounts[addr] !== undefined) {
      return getAddress(accounts[addr])
    }
  }
  throw new Error(`Could not normalize address: ${addr}`)
}

task('accounts', 'Prints the list of accounts', async (_, { ethers }) => {
  const accounts = await ethers.provider.listAccounts()
  accounts.forEach((account) => console.log(account))
})

task('blockNumber', 'Prints the block number', async (_, { ethers }) => {
  const blockNumber = await ethers.provider.getBlockNumber()
  console.log(blockNumber)
})

task('balance', "Prints an account's balance")
  .addPositionalParam(
    'account',
    "The account's address or index in the mnemonic"
  )
  .setAction(async (taskArgs, { ethers }) => {
    const balance = await ethers.provider.getBalance(
      await addr(ethers, taskArgs.account)
    )
    console.log(formatUnits(balance, 'ether'), 'ETH')
  })

async function send(
  signer: Signer,
  txparams: TransactionRequest
): Promise<TransactionReceipt> {
  const response = await signer.sendTransaction(txparams)
  debug(`transactionHash: ${response.hash}`)
  const waitBlocksForReceipt = 0 // 2

  return await response.wait(waitBlocksForReceipt)
}

task('send', 'Send ETH')
  .addParam('from', 'From address or account index')
  .addOptionalParam('to', 'To address or account index')
  .addOptionalParam('amount', 'Amount to send in ether')
  .addOptionalParam('data', 'Data included in transaction')
  .addOptionalParam('gasPrice', 'Price you are willing to pay in gwei')
  .addOptionalParam('gasLimit', 'Limit of how much gas to spend')

  .setAction(async (taskArgs, { network, ethers }) => {
    const from = await addr(ethers, taskArgs.from)
    debug(`Normalized from address: ${from}`)
    const fromSigner = await ethers.provider.getSigner(from)

    let to
    if (taskArgs.to) {
      to = await addr(ethers, taskArgs.to)
      debug(`Normalized to address: ${to}`)
    }

    const txRequest: TransactionRequest = {
      from: await fromSigner.getAddress(),
      to,
      value: parseUnits(
        taskArgs.amount ? taskArgs.amount : '0',
        'ether'
      ).toHexString(),
      nonce: await fromSigner.getTransactionCount(),
      gasPrice: parseUnits(
        taskArgs.gasPrice ? taskArgs.gasPrice : '1.001',
        'gwei'
      ).toHexString(),
      gasLimit: taskArgs.gasLimit ? taskArgs.gasLimit : 24000,
      chainId: network.config.chainId,
    }

    if (taskArgs.data !== undefined) {
      txRequest.data = taskArgs.data
      debug(`Adding data to payload: ${txRequest.data}`)
    }
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    debug(formatUnits(txRequest.gasPrice!.toString(), 'gwei'))
    debug(JSON.stringify(txRequest, null, 2))

    return await send(fromSigner, txRequest)
  })
