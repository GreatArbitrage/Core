import { CoinMarketCap, Pair } from "../coin-market/coin-market-cap.js";
import { writeFile } from "fs/promises";

const coinMarketCap = new CoinMarketCap();
export async function fetchCoins() {
    const pairs = await coinMarketCap.getAllPairs();
    const mapPairs: { [key: string]: boolean } = {}
    const pairsOfExchanges: { [key: string]: Pair[] } = {}
    for (const pair of pairs) {
        const exchangeFullName = pair.exchangeName + '/' + pair.chain
        const pairFull = exchangeFullName + pair.pairSymbol + pair.contractAddress
        if (mapPairs.hasOwnProperty(pairFull)) {
            continue;
        }
        mapPairs[pairFull] = true;
        if (!pairsOfExchanges[exchangeFullName]) {
            pairsOfExchanges[exchangeFullName] = []
        }
        pairsOfExchanges[exchangeFullName].push(pair)
    }

    const dexExchanges = [];
    const cexExchanges = [];

    for (const exchangeFullName of Object.keys(pairsOfExchanges)) {
        const pairs = pairsOfExchanges[exchangeFullName]
        const [exchangeName, chain] = exchangeFullName.split('/');
        if (chain) {
            dexExchanges.push({ exchangeName, chain, pairs })
        }
        else {
            cexExchanges.push({ exchangeName, pairs })
        }
    }
    writeFile('logs/pairs.json', JSON.stringify({ dexExchanges, cexExchanges }, null, 2))
}

fetchCoins().catch((e) => console.log(e))