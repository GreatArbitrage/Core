import Decimal from 'decimal.js';

export class BellmanFord {
    graph: { [key: string]: { [key: string]: Decimal } };
    pairInfo: { [key: string]: { [key: string]: any } };

    constructor() {
        this.graph = {}
        this.pairInfo = {}
    }

    addEdge(u: string, v: string, w: Decimal, pairInfo: any) {
        if (w.eq(0)) {
            return
        }
        if (!this.graph[u]) {
            this.graph[u] = {}
            this.pairInfo[u] = {}
        }
        if ((this.graph[u][v] && this.graph[u][v].lt(w)) || !this.graph[u][v]) {
            this.graph[u][v] = w
            this.pairInfo[u][v] = pairInfo
        }
    }

    findPath(start: string) {
        const dist: { [key: string]: Decimal } = {}
        const predecessor: { [key: string]: string } = {}
        for (const node of Object.keys(this.graph)) {
            dist[node] = new Decimal(Infinity)
        }
        dist[start] = new Decimal(0)  // Initialize the start distance as 0
        for (let i = 0; i < Object.keys(this.graph).length - 1; i++) {
            for (const u of Object.keys(this.graph)) {
                for (const v of Object.keys(this.graph[u])) {
                    // Take the negative logarithm of the weight
                    const weight = new Decimal(this.graph[u][v]).logarithm().negated()
                    if (dist[u].plus(weight).lt(dist[v])) {
                        dist[v] = dist[u].plus(weight)
                        predecessor[v] = u
                    }
                }
            }
        }

        // Find the end node that minimizes the sum of dist[end] and the weight from end to start

        for (let node of Object.keys(this.graph)) {
            for (const neighbour of Object.keys(this.graph[node])) {
                const weight = new Decimal(this.graph[node][neighbour]).logarithm().negated()
                if (dist[node].plus(weight).lt(dist[neighbour])) {
                    let cycle = [neighbour];
                    while (!cycle.includes(node)) {
                        cycle.push(node)
                        node = predecessor[node]
                    }
                    cycle.push(node)
                    console.log(cycle)
                    cycle = cycle.reverse()
                    let distance = new Decimal(1);
                    const pathInfo = []
                    for (let i = 0; i < cycle.length - 1; i++) {
                        const u = cycle[i]
                        const v = cycle[i + 1]
                        const weight = new Decimal(this.graph[u][v])
                        distance = distance.mul(weight)
                        const res = {
                            from: u,
                            to: v,
                            exchange: this.pairInfo[u][v].exchangeName,
                            symbol: this.pairInfo[u][v].symbol,
                            weight: weight,
                            chain: this.pairInfo[u][v].chain || '',
                            contractAddress: this.pairInfo[u][v].contractAddress || ''
                        }
                        pathInfo.push(res)
                    }
                    return { distance, path: pathInfo }
                }
            }
        }
        return null
    }
}