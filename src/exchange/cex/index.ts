import { Exchange, Market, OrderBook, Trade, pro } from "ccxt";
import { Num } from "ccxt/js/src/base/types";

export class Cex {
    name: string;
    api: Exchange;
    data: {
        [key: string]: {
            orderbook: { bids: number[][], asks: number[][], timestamp: string },
            fee: { maker: number, taker: number },
            precision: { price: number, amount: number },
            trades: { price: number, amount: number, side: string, timestamp: string }[]
        }
    };

    constructor(name: string, apiKey: string, secretKey: string, pairSymbols: string[]) {
        this.name = name
        this.api = new pro[name as keyof typeof pro]({
            apiKey: apiKey,
            secret: secretKey
        })
        this.data = {}
        for (const symbol of pairSymbols) {
            this.data[symbol] = {
                orderbook: { bids: [], asks: [], timestamp: '' },
                fee: { maker: 0, taker: 0 },
                precision: { price: 8, amount: 8 },
                trades: []
            }
        }
    }

    async fetchOrderbooksAndTrades() {

        try {
            await Promise.all(Object.keys(this.data).map(async (symbol) => {
                const orderBook: OrderBook = await this.api.watchOrderBook(symbol, 10)
                const sortedBids = orderBook["bids"]?.map(([x, y]: [Num, Num]) => [x || 0, y || 0]).sort((a: number[], b: number[]) => b[0] - a[0])
                const sortedAsks = orderBook["asks"]?.map(([x, y]: [Num, Num]) => [x || 0, y || 0]).sort((a: number[], b: number[]) => a[0] - b[0])
                this.data[symbol].orderbook = {
                    bids: sortedBids,
                    asks: sortedAsks,
                    timestamp: orderBook.timestamp?.toString() || ''
                }
                const trades: Trade[] = await this.api.watchTrades(symbol, undefined, 10)
                this.data[symbol].trades = trades.map((trade: Trade) => ({
                    price: trade.price || 0,
                    amount: trade.amount || 0,
                    side: trade.side || '',
                    timestamp: trade.timestamp?.toString() || ''
                }))
            }))
        } catch (error) {
            console.log(`Cex ${this.name} fetch orderbook error`, error)
        }
    }

    async fetchMarketInfo() {
        try {
            const markets: Market[] = await this.api.fetchMarkets()
            for (const market of markets) {
                if (this.data.hasOwnProperty(market?.symbol || '') && market?.type === 'spot') {
                    this.data[market.symbol].fee = {
                        maker: market.maker || 0,
                        taker: market.taker || 0
                    }
                    this.data[market.symbol].precision = {
                        price: market.precision.price || 8,
                        amount: market.precision.amount || 8
                    }
                }
            }
        } catch (error) {
            console.log(`Cex ${this.name} fetch market info error`, error)
        }
    }

    async getData() {
        await Promise.all([async () => {
            while (true) {
                await this.fetchOrderbooksAndTrades();
            }
        }, async () => {
            while (true) {
                await this.fetchMarketInfo();
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }])
    }

    getPrice(pair: string) {
        try {
            if (this.data[pair].orderbook.bids.length === 0 || this.data[pair].orderbook.asks.length === 0) {
                return this.data[pair].trades[0].price
            }
            return (this.data[pair].orderbook.bids[0][0] + this.data[pair].orderbook.asks[0][0]) / 2
        } catch (error) {
            console.log(`Cex ${this.name} get price error`)
            return 0;
        }
    }


}