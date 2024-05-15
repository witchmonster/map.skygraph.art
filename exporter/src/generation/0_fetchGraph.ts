import { Edge, Node, InputGraphData, AtlasLayout, BuiltAtlasLayout } from "../common/model"
import * as fs from "fs";
import { getConfig } from "../common/config";

function fetchGraph(
    log: (msg: string) => void,
    fileName: string
) {
    const config = getConfig(false);

    var graphVersion: number = -1;
    log("Loading graph...");

    var data = JSON.parse(fs.readFileSync("../exporter/input/" + fileName, "utf8")) as InputGraphData;

    //if graph version matches - parse community names, leaders, etc. from the json
    //otherwise - use legacy cluster logic
    if (data.graphVersion) {
        if (config.settings.graphVersion == data.graphVersion) {
            graphVersion = data.graphVersion;
        } else {
            //todo throw error
        }
    }

    log("Parsing graph file...");
    // Sort the nodes by did so that the order is consistent
    const nodes = data.nodes.map((node): Node => {
        return { ...node, handle: node.handle || node.did };
    }).sort((a, b) => {
        if (a.did < b.did) {
            return -1;
        } else if (a.did > b.did) {
            return 1;
        } else {
            return 0;
        }
    });

    const edges = data.rels.map((rel): Edge => {
        return { ...rel, };
    });

    log("Done parsing graph response");

    return { graphVersion, edges, nodes, timestamp: data.timestamp };
}

export { fetchGraph }