import * as fs from "fs";
import { MultiDirectedGraph } from "graphology";


async function writeFiles(
    log: (msg: string) => void,
    ctx: {
        graphData: any;
        outputPathEnriched: string;
    },
    graph: MultiDirectedGraph
) {
    graph.setAttribute("lastUpdated", ctx.graphData.timestamp || new Date().toISOString());

    log("Exporting graph...");
    fs.writeFileSync(ctx.outputPathEnriched, JSON.stringify(graph.export()));
    log("Done exporting graph");

}

export { writeFiles }