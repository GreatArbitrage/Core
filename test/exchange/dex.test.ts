import { suite } from 'uvu';
import { Dex } from '../../src/exchange/dex/index.js';

const DexTest = suite('Dex');

DexTest('should create a new Dex instance and get price', async () => {
    const dex = new Dex('pancakeswap-v2', 'bsc', [
        {
            pairSymbol: "TRAVA/WBNB",
            exchangeName: "pancakeswap-v2",
            type: "dex",
            chain: "bsc",
            contractAddress: "0x865c77d4ff6383e06c58350a2cfb95cca2c0f056"
        }
    ]);
    dex.getData();
    await new Promise(resolve => setTimeout(resolve, 5000));
    const res = dex.getPrice('TRAVA/WBNB');
    console.log(res)
    return;
});

DexTest.run();