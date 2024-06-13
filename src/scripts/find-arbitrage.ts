import { readFile } from "fs/promises";
import { Dex } from "../exchange/dex/index.js";
import { Cex } from "../exchange/cex/index.js";
import { BellmanFord } from "../algorithm/bellmanford.js";
import { appendFile } from "fs/promises";
import { wrappedTokens } from "../config.js";

function toOriginalToken(asset: string) {
    if (wrappedTokens[asset]) {
        return wrappedTokens[asset]
    }
    return asset
}
export async function updateGraph(dexExchanges: Dex[], cexExchanges: Cex[], graph: BellmanFord) {
    while (true) {
        for (const dex of dexExchanges) {
            for (const pair of Object.keys(dex.data)) {
                let [base, quote] = pair.split('/')
                const [w0, w1] = dex.getPrice(pair)
                base = toOriginalToken(base)
                quote = toOriginalToken(quote)
                const pairInfo = {
                    symbol: pair,
                    exchangeName: dex.name,
                    chain: dex.chain,
                    contractAddress: dex.data[pair].contractAddress
                }
                graph.addEdge(base, quote, w0, pairInfo)
                graph.addEdge(quote, base, w1, pairInfo)
            }
        }
        for (const cex of cexExchanges) {
            for (const pair of Object.keys(cex.data)) {
                let [base, quote] = pair.split('/')
                const [w0, w1] = cex.getPrice(pair)
                base = toOriginalToken(base)
                quote = toOriginalToken(quote)
                const pairInfo = {
                    symbol: pair,
                    exchangeName: cex.name,
                }
                graph.addEdge(base, quote, w0, pairInfo)
                graph.addEdge(quote, base, w1, pairInfo)
            }
        }
        await new Promise(resolve => setTimeout(resolve, 5000));

    }
}

export async function getPath(start: string, graph: BellmanFord) {
    while (true) {
        console.log('Finding path...')
        const res = graph.findPath(start)
        if (res == null) continue
        console.log(res?.distance)
        console.log(res?.path)
        if (res?.distance.gt(1)) {
            const now = new Date();
            const vietnamTime = now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
            let logText = `\nArbitrage opportunity found at ${vietnamTime}:\n`;
            for (let i = 0; i < res.path.length - 1; i++) {
                const pair = res.path[i]
                if (pair.chain.length > 0) {
                    logText += `${pair.from} -> ${pair.to}: ${pair.weight} (${pair.exchange}) on ${pair.chain} at ${pair.contractAddress}\n`
                }
                else logText += `${pair.from} -> ${pair.to}: ${pair.weight} (${pair.exchange})\n`
                logText += `---------------------------------------------------------------------\n`
            }

            await appendFile('logs/arbitrage.json', logText)
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}

export async function findArbitrage() {
    const res = JSON.parse(await readFile('logs/pairs.json', 'utf-8'));
    const dexExchanges: Dex[] = [];
    const cexExchanges: Cex[] = [];
    for (const dex of res.dexExchanges) {
        dexExchanges.push(new Dex(dex.exchangeName, dex.chain, dex.pairs));
    }
    for (const cex of res.cexExchanges) {
        cexExchanges.push(new Cex(cex.exchangeName, '', '', cex.pairs.map((pair: any) => pair.pairSymbol)));
    }
    const graph = new BellmanFord();
    await Promise.all(
        [
            ...dexExchanges.map(dex => dex.getData()),
            ...cexExchanges.map(cex => cex.getData()),
            updateGraph(dexExchanges, cexExchanges, graph),
            getPath('USDT', graph)
        ])
}

findArbitrage().catch((e) => console.log(e))