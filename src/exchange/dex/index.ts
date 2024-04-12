import { BaseContract, BigNumber, BigNumberish, FixedNumber, ethers, providers as pd } from "ethers";
import { chains } from "../../config.js";
import { Erc20__factory, Multicall__factory, UniswapV2__factory, UniswapV3__factory } from "./typechain-types/index.js";
import { Pair } from "../../coin-market-cap/index.js";
import { formatUnits } from "ethers/lib/utils.js";



const providers: { [key: string]: pd.BaseProvider } = {}

const Uniswapv2Interface = UniswapV2__factory.createInterface();
const UniswapV3Interface = UniswapV3__factory.createInterface();
const Erc20Interface = Erc20__factory.createInterface();

for (const chain of Object.keys(chains)) {
    try {
        providers[chain] = ethers.getDefaultProvider(chains[chain].rpc);
    }
    catch (e) {
        console.log(`Error connecting to ${chain} RPC: ${e}`);
    }
}

interface Multicall {
    target: string;
    allowFailure: boolean;
    callData: string;
}


export class Dex {
    name: string;
    chain: string;
    multicallContract: BaseContract;
    data: {
        [key: string]: {
            fee: BigNumberish,
            sqrtPricex96?: BigNumberish,
            liquidity?: BigNumberish,
            reserve0?: BigNumberish,
            reserve1?: BigNumberish,
            contractAddress: string,
            token0: {
                address?: string,
                symbol?: string,
                decimals: BigNumberish
            }
            token1: {
                address?: string,
                symbol?: string,
                decimals: BigNumberish
            }
        }
    };

    constructor(name: string, chain: string, pairs: Pair[]) {
        this.name = name;
        this.chain = chain;
        this.data = {};
        this.updatePair(pairs);
        this.multicallContract = Multicall__factory.connect(chains[this.chain].multicallAddress, providers[this.chain]);
    }

    updatePair(pairs: Pair[]) {
        for (const pair of pairs) {
            this.data[pair.pairSymbol] = {
                fee: 0,
                contractAddress: pair.contractAddress,
                token0: {
                    decimals: 18
                },
                token1: {
                    decimals: 18
                }
            }
        }

    }

    async initPools() {
        try {
            // call1 to get token0 address and token1 address and price pool
            const call1s: Multicall[] = [];
            const pairs = Object.keys(this.data);

            for (const pair of pairs) {
                call1s.push({
                    target: this.data[pair].contractAddress,
                    callData: Uniswapv2Interface.encodeFunctionData('token0', undefined),
                    allowFailure: true
                });
                call1s.push({
                    target: this.data[pair].contractAddress,
                    callData: Uniswapv2Interface.encodeFunctionData('token1', undefined),
                    allowFailure: true
                });
            }


            if (this.name == 'pancakeswap-v2' || this.name == 'uniswap-v2') {
                for (const pair of pairs) {
                    call1s.push({
                        target: this.data[pair].contractAddress,
                        callData: Uniswapv2Interface.encodeFunctionData('getReserves', undefined),
                        allowFailure: true
                    });
                }
            }
            else if (this.name == 'pancakeswap-v3' || this.name == 'uniswap-v3') {
                for (const pair of pairs) {
                    call1s.push({
                        target: this.data[pair].contractAddress,
                        callData: UniswapV3Interface.encodeFunctionData('slot0', undefined),
                        allowFailure: true
                    });
                    call1s.push({
                        target: this.data[pair].contractAddress,
                        callData: UniswapV3Interface.encodeFunctionData('liquidity', undefined),
                        allowFailure: true
                    });
                    call1s.push({
                        target: this.data[pair].contractAddress,
                        callData: UniswapV3Interface.encodeFunctionData('fee', undefined),
                        allowFailure: true

                    })
                }

            }

            const call1Results = await this.multicallContract.callStatic.aggregate3(call1s);

            // call2 to get token0 and token1 info and more info about pool v3
            const call2s: Multicall[] = [];

            for (let i = 0; i < pairs.length * 2; i += 2) {
                if (call1Results[i].success && call1Results[i + 1].success) {
                    const [token0] = Uniswapv2Interface.decodeFunctionResult('token0', call1Results[i].returnData);
                    const [token1] = Uniswapv2Interface.decodeFunctionResult('token1', call1Results[i + 1].returnData);
                    call2s.push({
                        target: token0,
                        callData: Erc20Interface.encodeFunctionData('symbol', undefined),
                        allowFailure: true
                    });
                    call2s.push({
                        target: token0,
                        callData: Erc20Interface.encodeFunctionData('decimals', undefined),
                        allowFailure: true
                    })

                    call2s.push({
                        target: token1,
                        callData: Erc20Interface.encodeFunctionData('symbol', undefined),
                        allowFailure: true
                    });
                    call2s.push({
                        target: token1,
                        callData: Erc20Interface.encodeFunctionData('decimals', undefined),
                        allowFailure: true
                    })
                }
            }

            if (this.name == 'pancakeswap-v2' || this.name == 'uniswap-v2') {
                for (let i = pairs.length * 2; i < pairs.length * 3; i++) {
                    if (call1Results[i].success) {
                        const [reserve0, reserve1] = Uniswapv2Interface.decodeFunctionResult('getReserves', call1Results[i].returnData);
                        this.data[pairs[(i - pairs.length * 2)]].reserve0 = reserve0;
                        this.data[pairs[(i - pairs.length * 2)]].reserve1 = reserve1;
                        this.data[pairs[(i - pairs.length * 2)]].fee = this.name == 'pancakeswap-v2' ? 2500 : 3000;
                    }
                }
            }
            else if (this.name == 'pancakeswap-v3' || this.name == 'uniswap-v3') {
                for (let i = pairs.length * 2; i < pairs.length * 5; i += 3) {
                    if (call1Results[i].success && call1Results[i + 1].success && call1Results[i + 2].success) {
                        const [sqrtPriceX96] = UniswapV3Interface.decodeFunctionResult('slot0', call1Results[i].returnData);
                        const [liquidity] = UniswapV3Interface.decodeFunctionResult('liquidity', call1Results[i + 1].returnData);
                        const [fee] = UniswapV3Interface.decodeFunctionResult('fee', call1Results[i + 2].returnData);
                        this.data[pairs[(i - pairs.length * 2) / 3]].sqrtPricex96 = sqrtPriceX96;
                        this.data[pairs[(i - pairs.length * 2) / 3]].liquidity = liquidity;
                        this.data[pairs[(i - pairs.length * 2) / 3]].fee = fee;
                    }
                }
            }

            const call2Results = await this.multicallContract.callStatic.aggregate3(call2s);

            for (let i = 0; i < pairs.length * 4; i += 4) {
                if (call2Results[i].success && call2Results[i + 1].success && call2Results[i + 2].success && call2Results[i + 3].success) {
                    const [symbol0] = Erc20Interface.decodeFunctionResult('symbol', call2Results[i].returnData);
                    const [decimals0] = Erc20Interface.decodeFunctionResult('decimals', call2Results[i + 1].returnData);
                    const [symbol1] = Erc20Interface.decodeFunctionResult('symbol', call2Results[i + 2].returnData);
                    const [decimals1] = Erc20Interface.decodeFunctionResult('decimals', call2Results[i + 3].returnData);
                    this.data[pairs[i / 4]].token0 = {
                        symbol: symbol0,
                        decimals: decimals0
                    }
                    this.data[pairs[i / 4]].token1 = {
                        symbol: symbol1,
                        decimals: decimals1
                    }
                }
            }
        } catch (error) {
            console.log(`Init ${this.name} info error`, (error as any)?.reason || (error as any)?.message)
        }


    }


    async updatePools() {
        try {
            const call1s: Multicall[] = [];
            const pairs = Object.keys(this.data);
            if (this.name == 'pancakeswap-v3' || this.name == 'uniswap-v3') {
                for (const pair of pairs) {
                    call1s.push({
                        target: this.data[pair].contractAddress,
                        callData: UniswapV3Interface.encodeFunctionData('slot0', undefined),
                        allowFailure: true
                    });
                    call1s.push({
                        target: this.data[pair].contractAddress,
                        callData: UniswapV3Interface.encodeFunctionData('liquidity', undefined),
                        allowFailure: true
                    });
                }
            }
            else if (this.name == 'pancakeswap-v2' || this.name == 'uniswap-v2') {
                for (const pair of pairs) {
                    call1s.push({
                        target: this.data[pair].contractAddress,
                        callData: Uniswapv2Interface.encodeFunctionData('getReserves', undefined),
                        allowFailure: true
                    });
                }
            }


            const call1Results = await this.multicallContract.callStatic.aggregate3(call1s);

            if (this.name == 'pancakeswap-v2' || this.name == 'uniswap-v2') {
                for (let i = 0; i < pairs.length; i++) {
                    if (call1Results[i].success) {
                        const [reserve0, reserve1] = Uniswapv2Interface.decodeFunctionResult('getReserves', call1Results[i].returnData);
                        this.data[pairs[i]].reserve0 = reserve0;
                        this.data[pairs[i]].reserve1 = reserve1;
                    }
                }
            }
            else if (this.name == 'pancakeswap-v3' || this.name == 'uniswap-v3') {
                for (let i = 0; i < pairs.length * 2; i += 2) {
                    if (call1Results[i].success && call1Results[i + 1].success) {
                        const [sqrtPriceX96] = UniswapV3Interface.decodeFunctionResult('slot0', call1Results[i].returnData);
                        const [liquidity] = UniswapV3Interface.decodeFunctionResult('liquidity', call1Results[i + 1].returnData);
                        this.data[pairs[i / 2]].sqrtPricex96 = sqrtPriceX96;
                        this.data[pairs[i / 2]].liquidity = liquidity;
                    }
                }
            }

        } catch (error) {
            console.log('Update pool error', (error as any)?.reason)
        }

    }

    async getData() {
        await this.initPools();
        while (true) {
            await this.updatePools();
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }

    getPrice(pair: string) {
        if (this.name == 'pancakeswap-v2' || this.name == 'uniswap-v2') {
            const decimals0 = this.data[pair].token0.decimals;
            const decimals1 = this.data[pair].token1.decimals;
            const reserve0 = FixedNumber.from(formatUnits(this.data[pair].reserve0 || 1, decimals0));
            const reserve1 = FixedNumber.from(formatUnits(this.data[pair].reserve1 || 1, decimals1));
            let isToken0 = this.data[pair].token0.symbol == pair.split('/')[0];
            return isToken0 ? reserve1.divUnsafe(reserve0) : reserve0.divUnsafe(reserve1);

        }
        else if (this.name == 'pancakeswap-v3' || this.name == 'uniswap-v3') {
            const sqrtPriceX96 = FixedNumber.from(this.data[pair].sqrtPricex96 || 0);
            const twox192 = FixedNumber.from(BigNumber.from(2).pow(192).toString());
            const price = sqrtPriceX96.mulUnsafe(sqrtPriceX96).divUnsafe(twox192);
            const decimals0 = this.data[pair].token0.decimals;
            const decimals1 = this.data[pair].token1.decimals;
            const isToken0 = this.data[pair].token0.symbol == pair.split('/')[0];
            const ten = BigNumber.from(10);
            const division = FixedNumber.from(ten.pow(decimals0).div(ten.pow(decimals1)).toString());
            return isToken0 ? price.mulUnsafe(division) : division.divUnsafe(price);
        }
    }

    simulateTrade(pair: string, amount: BigNumberish, isBuy: boolean) {
    }
}