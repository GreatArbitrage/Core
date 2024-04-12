import { chains, exchanges, queryTokens, wrappedTokens, PopularTokes } from "../config.js"

export interface Pair {
    pairSymbol: string
    exchangeName: string
    type: string
    chain: string
    contractAddress: string
}

export async function getPairs() {
    const res: Pair[] = []
    const symbols: string[] = []
    const tokens = queryTokens.concat(Object.values(PopularTokes));
    for (const token of tokens) {
        try {
            const headers = {
                'Host': 'api.coinmarketcap.com',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome',
                'Accept': 'application/json, text/plain, */*',
                'Origin': 'https://coinmarketcap.com',
                'Referer': 'https://coinmarketcap.com/',
            }

            const params = {
                'slug': token,
                'category': 'spot',
                'centerType': 'all',
                'sort': 'cmc_rank_advanced',
                'direction': 'desc'
            }

            const queryString = new URLSearchParams(params).toString();

            const response = await fetch(
                `https://api.coinmarketcap.com/data-api/v3/cryptocurrency/market-pairs/latest?${queryString}`,
                {
                    headers: headers,
                    method: 'GET',
                }
            )
            const data = (await response.json())['data']
            symbols.push(data['symbol'])
            const pairs = data['marketPairs']
            for (const pair of pairs) {
                res.push(
                    {
                        pairSymbol: pair['marketPair'],
                        exchangeName: pair['exchangeSlug']?.toLowerCase() || '',
                        type: pair['type'],
                        chain: pair['platformName']?.toLowerCase() || '',
                        contractAddress: pair['pairContractAddress']
                    }
                )
            }
        } catch (e) {
            console.log(e)

        }
    }
    return res.filter((pair) => checkValidPair(pair, symbols))
}
function checkValidPair(pair: Pair, symbols: string[]) {
    const [token0, token1] = pair.pairSymbol.split('/')
    const wtks = Object.values(wrappedTokens)
    if ((symbols.find((symbol) => symbol === token0) || wtks.find((symbol) => symbol === token0)) &&
        (symbols.find((symbol) => symbol === token1) || wtks.find((symbol) => symbol === token1)) &&
        exchanges.find((exchange) => exchange === pair.exchangeName)) {
        if (pair.type == 'dex' && !(pair.chain in chains)) {
            return false;
        }
        return true;
    }

}
