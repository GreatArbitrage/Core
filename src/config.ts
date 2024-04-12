export const queryTokens: string[] = ['trava-finance', 'oraidex']
export const exchanges: string[] = ['mexc', 'binance', 'pancakeswap-v2', 'pancakeswap-v3', 'uniswap-v2', 'uniswap-v3']
export const chains: { [key: string]: { rpc: string, multicallAddress: string } } = {
    'ethereum': {
        rpc: 'https://eth.llamarpc.com',
        multicallAddress: '0xcA11bde05977b3631167028862bE2a173976CA11'
    },
    'bsc': {
        rpc: 'https://bsc-dataseed1.binance.org/',
        multicallAddress: '0xcA11bde05977b3631167028862bE2a173976CA11'
    }
}

export enum PopularTokes {
    ethereum = 'ethereum',
    bitcoin = 'bitcoin',
    tether = 'tether',
    usdCoin = 'usd-coin',
    bnb = 'bnb',
}

export const wrappedTokens: { [key: string]: string } = {
    'ethereum': 'WETH',
    'bnb': 'WBNB',
    'bitcoin': 'WBTC'
}