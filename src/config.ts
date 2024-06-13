export const queryTokens: string[] = ['trava-finance', 'oraidex']
export const exchanges: string[] = ['mexc', 'binance', 'pancakeswap-v2', 'pancakeswap-v3', 'uniswap-v2', 'uniswap-v3', 'coinbase-exchange', 'okx', 'bybit', 'upbit', 'kraken', 'gate-io', 'htx', 'bitfinex', 'kucoin', 'bitget']
export const chains: { [key: string]: { rpc: string, multicallAddress: string } } = {
    'ethereum': {
        rpc: 'https://eth.llamarpc.com',
        multicallAddress: '0xcA11bde05977b3631167028862bE2a173976CA11'
    },
    'bsc': {
        rpc: 'https://bsc-dataseed1.binance.org/',
        multicallAddress: '0xcA11bde05977b3631167028862bE2a173976CA11'
    },
    'arbitrum': {
        rpc: 'https://arbitrum.llamarpc.com',
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
    "WETH": "ETH",
    "WBTC": "BTC",
    "WEETH": "ETH", // special case
    "WBNB": "BNB",
    "WMATIC": "MATIC",
    "WNXM": "NXM",
    "RENBTC": "BTC",
    "XTM": "TM", // assuming 'X' is a prefix
    "WHT": "HT",
    "WWAN": "WAN",
    "TELEBTC": "BTC",
    "RENZEC": "ZEC",
    "WLEO": "LEO",
    "WOA": "OA",
    "WBIND": "BIND",
    "WVG0": "VG0",
    "WCK": "CK",
    "WCCX": "CCX",
    "WZEC": "ZEC",
    "wCRES": "CRES",
    "WXMR": "XMR",
    "WCELO": "CELO",
    "WSHIFT": "SHIFT",
    "MAUSDC": "USDC", // special case
    "MAYFI": "YFI", // special case
    "IBTC": "BTC", // special case
    "KBTC": "BTC" // special case
};