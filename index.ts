import dotenv from 'dotenv';
dotenv.config();

import { Pair, getPairs } from './src/coin-market-cap/index.js';
import { Dex } from './src/exchange/dex/index.js';
import { Cex } from './src/exchange/cex/index.js';
import { writeFile } from "fs/promises"

async function main() {
    const pairs = await getPairs()

    // const pairsOfExchanges: { [key: string]: Pair[] } = {}
    // for (const pair of pairs) {
    //     const exchangeFullName = pair.exchangeName + '/' + pair.chain
    //     if (!pairsOfExchanges[exchangeFullName]) {
    //         pairsOfExchanges[exchangeFullName] = []
    //     }
    //     pairsOfExchanges[exchangeFullName].push(pair)
    // }

    // const dexExchanges: Dex[] = [];
    // const cexExchanges: Cex[] = [];

    // for (const exchangeFullName of Object.keys(pairsOfExchanges)) {
    //     const pairs = pairsOfExchanges[exchangeFullName]
    //     const [exchangeName, chain] = exchangeFullName.split('/');
    //     if (chain) {
    //         const dex = new Dex(exchangeName, chain, pairs)
    //         console.log('Dex initialized:', exchangeFullName)
    //         dexExchanges.push(dex)
    //     }
    //     else {
    //         const apiKey = process.env[exchangeName + '_API_KEY'] || '';
    //         const secretKey = process.env[exchangeName + '_SECRET_KEY'] || '';
    //         const cex = new Cex(exchangeName, apiKey, secretKey, pairs.map((pair) => pair.pairSymbol))
    //         console.log('Cex initialized:', exchangeFullName)
    //         cexExchanges.push(cex)
    //     }
    // }
    // Promise.all([dexExchanges.map((dex) => dex.getData()), cexExchanges.map((cex) => cex.getData())])
}

main().catch((e) => console.log(e))