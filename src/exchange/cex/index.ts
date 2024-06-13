import { Exchange, Market, OrderBook, Trade, pro } from "ccxt";
import { Num } from "ccxt/js/src/base/types";
import Decimal from 'decimal.js';

export class Cex {
    name: string;
    api: Exchange;
    data: {
        [key: string]: {
            orderbook: { bids: number[][], asks: number[][], timestamp: string },
            fee: { maker: number, taker: number },
            precision: { price: number, amount: number }
        }
    };

    constructor(name: string, apiKey: string, secretKey: string, pairSymbols: string[]) {
        this.name = name.split('-')[0]
        this.api = new pro[this.name as keyof typeof pro]({
            apiKey: apiKey,
            secret: secretKey
        })
        this.data = {}
        for (const symbol of pairSymbols) {
            this.data[symbol] = {
                orderbook: { bids: [], asks: [], timestamp: '' },
                fee: { maker: 0, taker: 0 },
                precision: { price: 8, amount: 8 }
            }
        }
    }

    async fetchOrderbooksAndTrades() {
        try {
            await Promise.all(Object.keys(this.data).map(async (symbol) => {
                while (true) {
                    const orderBook: OrderBook = await this.api.watchOrderBook(symbol)
                    const sortedBids = orderBook["bids"]?.map(([x, y]: [Num, Num]) => [x || 0, y || 0]).sort((a: number[], b: number[]) => b[0] - a[0])
                    const sortedAsks = orderBook["asks"]?.map(([x, y]: [Num, Num]) => [x || 0, y || 0]).sort((a: number[], b: number[]) => a[0] - b[0])
                    this.data[symbol].orderbook = {
                        bids: sortedBids,
                        asks: sortedAsks,
                        timestamp: orderBook.timestamp?.toString() || ''
                    }
                }
            }))
        } catch (error) {
            console.log(`Cex ${this.name} fetch orderbook error`, error)
        }
    }

    async fetchMarketInfo() {
        while (true) {
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
                await new Promise(resolve => setTimeout(resolve, 24 * 60 * 60 * 1000));
            } catch (error) {
                console.log(`Cex ${this.name} fetch market info error`, error)
            }
        }

    }

    async getData() {
        await Promise.all([
            this.fetchOrderbooksAndTrades(),
            this.fetchMarketInfo()
        ])
    }

    getPrice(pair: string) {
        try {
            const u = new Decimal(this.data[pair].orderbook.asks[0][0])
            const v = (new Decimal(1)).dividedBy(new Decimal(this.data[pair].orderbook.bids[0][0]))
            return [u, v]
        } catch (error) {
            return [new Decimal(0), new Decimal(0)];
        }
    }

}