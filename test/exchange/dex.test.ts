import { suite } from 'uvu';
import { Dex } from '../../src/exchange/dex/index.js';
import { readFile } from 'fs/promises';

const DexTest = suite('Dex');

DexTest('should create a new Dex instance and get price', async () => {
    const pairs = JSON.parse(await readFile('./test/test-dex-exchanges.json', 'utf-8'));
    const dexes: Dex[] = [];
    for (const pair of pairs) {
        const dex = new Dex(pair.exchangeName, pair.chain, pair.pairs);
        dexes.push(dex);
    }
    Promise.all(dexes.map((dex) => dex.getData()));
    await new Promise(resolve => setTimeout(resolve, 5000));
    const travaPrice = dexes.find(dex => dex.data['TRAVA/WBNB'])?.getPrice('TRAVA/WBNB');
    console.log(travaPrice)
    return;
});


// DexTest.run();