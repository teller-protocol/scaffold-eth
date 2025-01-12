type Address = string
type TokenSymbol = string

export interface NetworkTokens {
  erc20: Tokens
  compound?: Tokens
  aave?: Tokens
  poolTogether?: Tokens
  yearn?: Tokens
}

export interface AllNetworkTokens extends NetworkTokens {
  all: Tokens
}

export interface Tokens {
  [tokenSymbol: string]: Address
}
