import { chains, exchanges } from "../config.js"

export interface Pair {
    pairSymbol: string
    exchangeName: string
    type: string
    chain: string
    contractAddress: string
}

export class CoinMarketCap {
    async getAllPairs(limit: number = 2000) {
        const tokens = [];
        let start = 1;
        while (true) {
            try {
                if (start > limit) {
                    break;
                }
                const headers = {
                    'Host': 'api.coinmarketcap.com',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome',
                    'Accept': 'application/json, text/plain, */*',
                    'Origin': 'https://coinmarketcap.com',
                    'Referer': 'https://coinmarketcap.com/',
                }
                const params = {
                    'start': start.toString(),
                    'limit': '100',
                    'sortBy': 'market_cap',
                    'sortType': 'desc',
                    'convert': 'USD',
                    'cryptoType': 'all',
                    'tagType': 'all',
                    'audited': 'false',
                    'aux': 'num_market_pairs',
                }
                const queryString = new URLSearchParams(params).toString();
                const response = await fetch(
                    `https://api.coinmarketcap.com/data-api/v3/cryptocurrency/listing?${queryString}`,
                    {
                        headers: headers,
                        method: 'GET',
                    }
                )
                start += 100;
                const data = (await response.json())['data']['cryptoCurrencyList']
                if (data.length === 0) {
                    break;
                }
                for (const token of data) {
                    console.log(token['slug'])
                    tokens.push(token['slug'])
                }
            } catch (error) {
                break;
            }
        }
        console.log(tokens.length)
        return await this.getPairs(tokens)
    }

    async getPairs(tokens: string[] = []) {
        const res: Pair[] = []
        const symbols: string[] = []
        for (const token of tokens) {
            try {
                console.log(token)
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
                    'isVerified': '1',
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
        return res.filter((pair) => this.checkValidPair(pair))
    }

    checkValidPair(pair: Pair) {
        if (exchanges.find((exchange) => exchange === pair.exchangeName)) {
            if (pair.type == 'dex' && !(pair.chain in chains)) {
                return false;
            }
            return true;
        }
    }
}

