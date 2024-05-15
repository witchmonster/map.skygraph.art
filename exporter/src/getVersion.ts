import { getConfig } from "./common/config";
import { InputGraphData } from "./common/model";
import * as fs from "fs";

const config = getConfig(false);
const filePath = config.getDefaultLayout(false).graphFilePath;
let graph: InputGraphData | undefined;

if (fs.existsSync(filePath)) {
    graph = JSON.parse(fs.readFileSync(filePath, "utf8")) as InputGraphData;
}

if (!graph?.graphVersion
    || graph.graphVersion === config.settings.graphVersion) {
    console.log("graphVersion:" + config.settings.graphVersion);
}