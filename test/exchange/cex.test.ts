import { suite } from 'uvu';
import { Cex } from '../../src/exchange/cex/index.js';

const CexTest = suite('Cex');

CexTest('should create a new Dex instance and get price', async () => {
    const cex = new Cex('mexc', '', '', ['TRAVA/USDT']);
    cex.getData()
    await new Promise(resolve => setTimeout(resolve, 20000));
    const res = cex.getPrice('TRAVA/USDT');
    console.log(res)
    return;
});


CexTest.run();