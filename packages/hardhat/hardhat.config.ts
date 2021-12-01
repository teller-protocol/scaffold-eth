// This adds support for typescript paths mappings. DO NOT REMOVE
import 'tsconfig-paths/register'

import { HardhatUserConfig } from 'hardhat/config'
import _ from 'lodash'

import config from '#utils/hardhat.config'

// Extend the default Hardhat config
export default _.merge<HardhatUserConfig, HardhatUserConfig>(config, {})
