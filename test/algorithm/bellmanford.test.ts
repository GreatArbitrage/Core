import { suite } from 'uvu';
import assert from 'uvu/assert';
import { BellmanFord } from '../../src/algorithm/bellmanford.js';
import Decimal from 'decimal.js';

const BellmanfordTest = suite('BellmanFord');

BellmanfordTest('should correctly find the shortest path', () => {
    const graph = new BellmanFord();
    graph.addEdge('A', 'B', new Decimal(1), {});
    graph.addEdge('B', 'C', new Decimal(1), {});
    graph.addEdge('C', 'A', new Decimal(1), {});
    graph.addEdge('B', 'D', new Decimal(3), {});
    graph.addEdge('D', 'A', new Decimal(0.35), {});

    const result = graph.findPath('A');
    console.log(result);
    return
});

BellmanfordTest.run();