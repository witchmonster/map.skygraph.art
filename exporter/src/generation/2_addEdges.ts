import { MultiDirectedGraph } from "graphology";
import { Edge, IndexNode } from "../common/model.js"

function addEdges(
    log: (msg: string) => void,
    ctx: {
        totalEdges: number;
        edges: Edge[];
        indexNodes: Map<string, IndexNode>;
        hiddenNodes: Map<string, boolean>;
    },
    graph: MultiDirectedGraph
) {
    log("Adding edges...");

    // Create a map of edges for quick reverse lookups
    const edgeMap: Map<string, Edge> = new Map();
    for (let i = 0; i < ctx.totalEdges; i++) {
        const edge = ctx.edges[i];
        edgeMap.set(`${edge.source}-${edge.target}`, edge);
    }

    // First, find the minimum and maximum weights in the graph
    let minWeight = Infinity;
    let maxWeight = -Infinity;
    let totalWeight = 0;

    for (let i = 0; i < ctx.totalEdges; i++) {
        const edge = ctx.edges[i];
        minWeight = Math.min(minWeight, edge.weight);
        maxWeight = Math.max(maxWeight, edge.weight);
        totalWeight += edge.weight;
    }

    // Then, set the size of each edge based on its weight relative to the min and max weights
    const logMinWeight = Math.log(minWeight);
    const logMaxWeight = Math.log(maxWeight);
    const minEdgeSize = 0.2;
    const maxEdgeSize = 10;
    for (let i = 0; i < ctx.totalEdges; i++) {
        if (i % 100000 === 0) {
            log(`Adding edge ${i} of ${ctx.totalEdges - 1}`);
        }
        const edge = ctx.edges[i];

        let weight = edge.weight;
        const partnerEdge = edgeMap.get(`${edge.target}-${edge.source}`);
        if (partnerEdge !== undefined) {
            const bothEdgeWeight = edge.weight + partnerEdge.weight;
            const mutualityFactor =
                (edge.weight / bothEdgeWeight) * (partnerEdge.weight / bothEdgeWeight);
            weight =
                mutualityFactor * bothEdgeWeight * (1 + Math.log(bothEdgeWeight));
        }

        // Calculate the size based on the logarithm of the edge weight relative to the range of weights
        const size =
            minEdgeSize +
            ((Math.log(weight) - logMinWeight) / (logMaxWeight - logMinWeight)) *
            (maxEdgeSize - minEdgeSize);

        if (!ctx.hiddenNodes.get(edge.source) && !ctx.hiddenNodes.get(edge.target)) {
            graph.addEdge(
                ctx.indexNodes.get(edge.source)?.key,
                ctx.indexNodes.get(edge.target)?.key,
                {
                    ogWeight: edge.weight,
                    weight: parseFloat(weight.toFixed(2)),
                    size: parseFloat(size.toFixed(2)),
                }
            );
        }
    }

    log("Done adding edges");
    return totalWeight;
}

export { addEdges }