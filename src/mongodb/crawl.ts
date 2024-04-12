import { readFile } from 'fs/promises';
import { Cex } from '../exchange/cex/index.js';
import mongoose from 'mongoose';
import { backtestDB } from './index.js';

interface IOrderbook {
    bids: number[][];
    asks: number[][];
    timestamp: string;
}

interface ITrade {
    price: number;
    amount: number;
    side: string;
}

const OrderbookSchema = new mongoose.Schema<IOrderbook>({
    bids: [[Number]],
    asks: [[Number]],
});

const TradeSchema = new mongoose.Schema<ITrade>({
    price: Number,
    amount: Number,
    side: String,
});

async function main() {
    const mexc = JSON.parse(await readFile('./mexc.json', 'utf-8'));
    const cex = new Cex(mexc.exchangeName, mexc.apiKey, mexc.secretKey, mexc.pairs);
    while (true) {
        await cex.fetchOrderbooksAndTrades();
        for (const symbol of Object.keys(cex.data)) {
            const OrderBook = backtestDB.model<IOrderbook>(symbol + 'OrderBook', OrderbookSchema);
            const Trade = backtestDB.model<ITrade>(symbol + 'Trade', TradeSchema);
            const orderbook = cex.data[symbol].orderbook;
            const trades = cex.data[symbol].trades;
            const orderbookDoc = new OrderBook({
                ...orderbook,
                _id: orderbook.timestamp
            });
            await orderbookDoc.save();
            for (const trade of trades) {
                const tradeDoc = new Trade({
                    ...trade,
                    _id: trade.timestamp
                });
                await tradeDoc.save();
            }
        }
    }
}

main();