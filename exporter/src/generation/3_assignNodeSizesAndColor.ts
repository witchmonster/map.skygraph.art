import { MultiDirectedGraph } from "graphology";
import { getConfig } from "../common/config.js";
import { BuiltAtlasLayout, defaultSettings } from "../common/model.js";

function assignNodeSizeAndColor(
    log: (msg: string) => void,
    layout: BuiltAtlasLayout,
    totalWeight: number,
    graph: MultiDirectedGraph
) {
    log("Assigning attributes...");

    const config = getConfig(layout.isSubLayout);
    const palette = config.getLayoutSetting(layout, "colors")
        || defaultSettings.colors;

    const minSize = config.getLayoutSetting(layout, "minSize")
        || defaultSettings.minSize;

    const maxSize = config.getLayoutSetting(layout, "maxSize")
        || defaultSettings.maxSize;

    const maxHistoricWeightSum = config.getLayoutSetting(layout, "maxHistoricWeightSum")
        || defaultSettings.maxHistoricWeightSum

    if (layout.nodeMapping) {
        const weightNodeProperty = layout.nodeMapping.weight?.nodeProperty;

        let minWeight = Infinity;
        let maxWeight = -Infinity;
        let minNodeSize = Infinity;
        let maxNodeSize = -Infinity;
        graph.forEachNode((node: any) => {

            if (layout.nodeMapping?.weight?.type === "fromNodeProperty" && weightNodeProperty) {
                const size = graph.getNodeAttribute(node, weightNodeProperty);

                let newNodeSize =
                    minSize +
                    Math.sqrt(size / maxHistoricWeightSum) * //range from 0 to 1
                    (maxSize - minSize);
                const radius = newNodeSize / 2;
                graph.setNodeAttribute(node, "total", size);
                graph.setNodeAttribute(node, "size", newNodeSize);
                minWeight = Math.min(minWeight, size);
                maxWeight = Math.max(maxWeight, size);
                minNodeSize = Math.min(minNodeSize, newNodeSize);
                maxNodeSize = Math.max(maxNodeSize, newNodeSize);

                graph.setNodeAttribute(node, "area", Math.PI * radius * radius);

            }
        });

        log(`maxWeight: ${maxWeight}`);
        log(`minWeight: ${minWeight}`);

        log(`maxSize: ${maxNodeSize}`);
        log(`minSize: ${minNodeSize}`);
    }


    //legacy generation
    if (!layout.nodeMapping) {
        log("Legacy node size generation");
        let minHarmonicWeightSum = Infinity;
        let maxHarmonicWeightSum = -Infinity;

        graph.forEachNode((node) => {
            const harmonicWeightMap = new Map<string, number>();

            const inWeightMap = graph?.reduceInEdges<any>(
                node,
                (acc, _, edgeAttrs, source, target) => {
                    const inWeight = edgeAttrs.weight;
                    const existingMootEntry = acc.get(source);
                    if (existingMootEntry === undefined && source !== target) {
                        acc.set(source, inWeight);
                    }
                    return acc;
                },
                new Map()
            );

            const outWeightMap = graph?.reduceOutEdges<any>(
                node,
                (acc, _, edgeAttrs, source, target) => {
                    const outWeight = edgeAttrs.weight;
                    if (acc.get(target) === undefined && source !== target) {
                        acc.set(target, outWeight);
                        const inWeight = inWeightMap.get(target);
                        if (inWeight !== undefined && harmonicWeightMap.get(target) === undefined) {
                            const harmonicWeight = inWeight + outWeight > 0 ? 2 * inWeight * outWeight / (inWeight + outWeight) : 0;
                            harmonicWeightMap.set(target, harmonicWeight);
                        }
                    }
                    return acc;
                },
                new Map()
            );

            const sortedHarmonicMap: number[] = Array.from(harmonicWeightMap.values());

            let harmonicWeightLogSum = 0;

            sortedHarmonicMap
                .forEach((harmonicWeight) => {
                    harmonicWeightLogSum += Math.log(1 + harmonicWeight);
                });

            minHarmonicWeightSum = Math.min(minHarmonicWeightSum, harmonicWeightLogSum);
            maxHarmonicWeightSum = Math.max(maxHarmonicWeightSum, harmonicWeightLogSum);

            let newNodeSize =
                minSize +
                Math.sqrt(harmonicWeightLogSum / maxHistoricWeightSum) * //range from 0 to 1
                (maxSize - minSize);

            let radius = newNodeSize / 2;

            // Calculate the area of the circle based on the radius
            let area = Math.PI * radius * radius;

            // Round to 2 decimal places to conserve bits in the exported graph
            newNodeSize = parseFloat(newNodeSize.toFixed(2));
            area = parseFloat(area.toFixed(2));

            graph.setNodeAttribute(node, "total", harmonicWeightLogSum);
            graph.setNodeAttribute(node, "size", newNodeSize);
            graph.setNodeAttribute(node, "area", area);

            // Set a random color
            graph.setNodeAttribute(
                node,
                "color",
                palette[Math.floor(Math.random() * 10)]
            );
        });

        log(`Min harmonic weight sum is ...${minHarmonicWeightSum}`);
        log(`Max harmonic weight sum is ...${maxHarmonicWeightSum}`);

        // Log total number of nodes, edges, and graph weight
    }

    log(
        `Nodes: ${graph.order.toLocaleString()} Connections: ${graph.size.toLocaleString()} Interactions: ${totalWeight.toLocaleString()}`
    );
}

export { assignNodeSizeAndColor }