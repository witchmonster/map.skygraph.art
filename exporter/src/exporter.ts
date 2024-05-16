import { MultiDirectedGraph } from "graphology";
import { Node, IndexNode, Edge, AtlasLayout, BuiltAtlasLayout } from "./common/model"
import { getConfig } from "./common/config";
import path from "node:path";
import fs from "fs-extra";
import unzip from "unzip-stream";
import { SemVer, parse } from "semver";

import { fetchGraph } from "./generation/0_fetchGraph";
import { addNodes } from "./generation/1_addNodes.js";
import { addEdges } from "./generation/2_addEdges.js";
import { assignNodeSizeAndColor } from "./generation/3_assignNodeSizesAndColor";
import { generateLayout } from "./generation/4_generateLayout";
import { initializeClusters } from "./generation/5_initializeClusters";
import { filterEdges } from "./generation/6_filterEdges.js";
import { assignClusterPositions } from "./generation/7_assignClusterPositions";
import { writeFiles } from "./generation/8_writeFiles";
import { writeSearch } from "./generation/9_writeSearch";

// log logs a message with a timestamp in human-readale format
function log(msg: string) {
  console.log(`${new Date().toLocaleString()}: ${msg}`);
}

async function generateLayouts() {
  log("Starting exporter...");

  const rootConfig = getConfig(false);
  const subLayoutConfig = getConfig(true);

  const outputPath = "./out/"

  const versionsPath = path.join(outputPath, "/versions/");
  const subLayoutsVersionsPath = path.join(versionsPath, "/sub_layouts/");

  const layoutOutputPath = path.join(outputPath, "/layouts/");
  const subLayoutOutputPath = path.join(layoutOutputPath, "/sub_layouts/");

  if (!fs.existsSync(outputPath))
    fs.mkdirSync(outputPath);

  if (!fs.existsSync(versionsPath))
    fs.mkdirSync(versionsPath);

  if (!fs.existsSync(layoutOutputPath))
    fs.mkdirSync(layoutOutputPath);

  if (!fs.existsSync(subLayoutsVersionsPath))
    fs.mkdirSync(subLayoutsVersionsPath);

  if (!fs.existsSync(subLayoutOutputPath))
    fs.mkdirSync(subLayoutOutputPath);

  interface GraphData {
    graphVersion: number,
    edges: Edge[];
    nodes: Node[],
    timestamp?: string
  }
  async function exportLayout(
    getGraphDataCallback: () => GraphData,
    layout: BuiltAtlasLayout
  ) {

    const versionPath = layout.isSubLayout ? subLayoutsVersionsPath : versionsPath;
    const layoutPath = layout.isSubLayout ? subLayoutOutputPath : layoutOutputPath;

    const outputPathEnriched = path.join(layoutPath, `${layout.name + "_" ?? ""}layout.json`);
    const layoutVersionPath = path.join(versionPath, `${layout.name + "_" ?? ""}layout_version.json`);
    const searchVersionPath = path.join(versionPath, `${layout.name + "_" ?? ""}search_version.json`);
    const configVersionedPath = path.join(versionPath, `${rootConfig.configVersion}_config.json`);
    // const configLatestPath = path.join(outputPath, `config.json`);
    // const subConfigLatestPath = path.join(outputPath, `sub_config.json`);

    var layoutVersion: any;
    var searchVersion: any;
    try {
      layoutVersion = JSON.parse(fs.readFileSync(layoutVersionPath, "utf8")) as {
        configVersion: string;
        graphVersion: number;
      };
      searchVersion = JSON.parse(fs.readFileSync(searchVersionPath, "utf8")) as {
        configVersion: string;
        graphVersion: number;
      };
    } catch (err) {
      // log(`Failed to read version file ${layoutVersionPath} or ${searchVersionPath}`)
    }

    // fs.writeFileSync(configLatestPath, JSON.stringify(rootConfig.json));
    // fs.writeFileSync(subConfigLatestPath, JSON.stringify(subLayoutConfig.json));

    function writeVersionFile(path: string) {
      log(`Writing version file ${path}...`);
      fs.writeFileSync(path, JSON.stringify({
        configVersion: rootConfig.configVersion.raw,
        graphVersion: rootConfig.settings.graphVersion
      }));
      fs.writeFileSync(configVersionedPath, JSON.stringify(rootConfig.json));
    }

    const layoutFileExists = fs.existsSync(outputPathEnriched);

    const layoutConfigVersion: SemVer | null = parse(layoutVersion?.configVersion);
    const searchConfigVersion: SemVer | null = parse(searchVersion?.configVersion);

    async function doWriteSearch() {
      if (searchVersion && searchConfigVersion
        && rootConfig.settings.graphVersion <= searchVersion.graphVersion
        && rootConfig.configVersion.major <= searchConfigVersion.major
        && rootConfig.configVersion.minor <= searchConfigVersion.minor) {
        log(`No changes requiring search ${layout.name} re-gen.`);
        log("Skipping search export.");
        writeVersionFile(searchVersionPath);
        return;
      } else {
        await writeSearch(log, layout, outputPath);
        writeVersionFile(searchVersionPath);
      }
    }

    if (layout.isSubLayout && layoutFileExists) {
      return;
    }

    if (layoutVersion && layoutConfigVersion && layoutFileExists
      && rootConfig.settings.graphVersion <= layoutVersion.graphVersion
      && rootConfig.configVersion.major <= layoutConfigVersion.major
      && rootConfig.configVersion.minor <= layoutConfigVersion.minor) {
      log(`No changes requiring layout ${layout.name} re-gen.`);
      if (rootConfig.configVersion.patch > layoutConfigVersion.patch) {
        log(`Updating version: ${rootConfig.configVersion}.`);
      }
      log("Skipping export.");
      writeVersionFile(layoutVersionPath);
      doWriteSearch();
      return;
    }

    log(`Generating layout ${layout.name} on config version: ${rootConfig.configVersion}`);


    const graphData = getGraphDataCallback();
    const { edges, nodes } = graphData;
    // Create the graph
    const graph = new MultiDirectedGraph();
    const totalEdges = edges.length;
    const totalNodes = nodes.length;
    const indexNodes: Map<string, IndexNode> = new Map();
    const hiddenNodes: Map<string, boolean> = new Map();

    //Step 1 add nodes
    addNodes(log, layout, { totalNodes, nodes, indexNodes, hiddenNodes }, graph);

    //Step 2 add edges
    const totalWeight = addEdges(log, { totalEdges, edges, indexNodes, hiddenNodes }, graph);

    const communitiesGraph = new MultiDirectedGraph();

    //Step 3 calculate weights and assign sizes and colors
    assignNodeSizeAndColor(log, layout, totalWeight, graph);

    //Step 4 run Force Atlas 2 iterations
    generateLayout(log, graph, layout, communitiesGraph);

    //Step 5 write cluster labels
    const communityClusters = initializeClusters(log, layout, graph);

    //Step 6 filter out edges (optimization)
    filterEdges(log, layout, graph);

    //Step 7 assign cluster positions
    assignClusterPositions(log, layout, communityClusters, graph);

    //Step 8 export layout file
    writeFiles(log, { graphData, outputPathEnriched }, graph);

    //Step 9 export search file
    await doWriteSearch();

    if (!layout.isSubLayout)
      await writeVersionFile(layoutVersionPath);
  }

  const rootLayouts = rootConfig.getAllLayouts();
  const subLayouts = subLayoutConfig.getAllLayouts();

  //Step 0
  if (rootLayouts && rootLayouts.length > 0) {
    const graphDatum: Map<string, { graphVersion: number, edges: Edge[]; nodes: Node[], timestamp?: string }> = new Map();
    const fileNames = new Set(rootLayouts.map(layout => layout.graphFilePath));

    // do not listen to the IDE, do NOT remove await
    async function loadFileNames() {
      fileNames.forEach(async fileName => {
        log(`Loading ${fileName}`);
        const graphData = await fetchGraph(log, fileName);
        graphDatum.set(fileName, graphData);

        log(`Loaded ${graphData?.nodes?.length} nodes and ${graphData?.edges?.length} edges.`);
      })
    }

    await loadFileNames();

    //generate main layouts
    async function generateMainLayouts() {
      rootLayouts.forEach(async layout => {
        const graphData = graphDatum.get(layout.graphFilePath);
        if (graphData) {
          log(`Processing layout ${layout.name}`);
          await exportLayout(() => graphData, layout);
          async function unzipSubLayouts(layout: BuiltAtlasLayout, callback?: () => void) {
            if (layout.subLayoutsFilePath && !rootConfig.settings.isDev) {
              if (fs.existsSync("../exporter/input/sub_layouts/")) {
                log("Emptying sub_layouts out directory...");
                fs.emptyDirSync("../exporter/input/sub_layouts/");
              }

              fs.ensureDirSync("../exporter/input/sub_layouts/");

              log("Unzipping sub layouts...");
              const subLayoutsOutDir = "../exporter/out/layouts/";
              fs.createReadStream("../exporter/input/" + layout.subLayoutsFilePath)
                .pipe(unzip.Extract({ path: subLayoutsOutDir + "sub_layouts/" })).on("finish", () => {
                  log("Done exporting search");
                }).on('finish', () => {
                  callback && callback();
                });
            }
          }

          await unzipSubLayouts(layout);
        }
      });
    }

    //generate sub layouts
    async function generateSubLayouts() {
      subLayouts.forEach(async layout => {
        const filePath = "/sub_layouts/" + layout.graphFilePath;
        const fetchGraphCallback = () => fetchGraph(log, filePath);
        log(`Checking ${filePath}`);
        if (fs.existsSync("../exporter/input/" + filePath)) {
          log(`Processing layout ${layout.name}`);
          await exportLayout(fetchGraphCallback, layout);
        }
      });
    }

    await generateMainLayouts();

    if (rootConfig.settings.isDev)
      await generateSubLayouts();

  }
}

generateLayouts();

export { generateLayouts }