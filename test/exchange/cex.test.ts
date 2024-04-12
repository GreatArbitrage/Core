import { suite } from 'uvu';
import { Cex } from '../../src/exchange/cex/index.js';
import { readFile } from 'fs/promises';

const CexTest = suite('Cex');

CexTest('should create a new Dex instance and get price', async () => {
    const pairs = JSON.parse(await readFile('./test/test-cex-exchanges.json', 'utf-8'));
    const cexes: Cex[] = [];
    for (const pair of pairs) {
        const cex = new Cex(pair.exchangeName, pair.apiKey, pair.secretKey, pair.pairs);
        cexes.push(cex);
    }
    Promise.all(cexes.map((cex) => cex.getData()));
    await new Promise(resolve => setTimeout(resolve, 20000));
    const travaPrice = cexes.find(cex => cex.data['TRAVA/USDT'])?.getPrice('TRAVA/USDT');
    console.log(travaPrice)
    return;
});


CexTest.run();