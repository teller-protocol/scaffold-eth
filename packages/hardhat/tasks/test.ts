import { task } from 'hardhat/config'
import { subtask } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('test').setAction(async (args, hre, runSuper) => {
  const { run } = hre
  /*
  const chain = process.env.FORKING_NETWORK

  if (chain == null) {
    throw new Error(`Invalid network to fork and run tests on: ${chain}`)
  }

  // Fork the deployment files into the 'hardhat' network
  await run('fork', {
    chain,
    onlyDeployment: true,
  })

  // Disable logging
  process.env.DISABLE_LOGS = 'true'*/

  // Run the actual test task
  await runSuper({
    ...args,
  })
})

// https://github.com/nomiclabs/hardhat/blob/master/packages/hardhat-core/src/builtin-tasks/test.ts
// https://github.com/cgewecke/hardhat-gas-reporter/blob/master/src/index.ts
