import React, { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { MultiDirectedGraph } from "graphology";
import Menu from "./Menu";
import getNodeProgramImage from "sigma/rendering/programs/node-image";
import {
  SigmaContainer,
  useRegisterEvents,
  useLoadGraph,
  useSigmaContext,
} from "@react-sigma/core";
import { Coordinates } from "sigma/types";
import "@react-sigma/core/lib/react-sigma.min.css";
import iwanthue from "iwanthue";
import Loading from "./Loading";
import Legend from "./Legend";
import { getConfig } from "../common/visualConfig"
import { getTranslation, getLanguageOrDefault, getTranslationWithOverride, getValueByLanguage } from "../common/translation";
import Footer from "./Footer";
import { useMediaQuery } from 'react-responsive'
import { Node, Edge, MootNode, Cluster } from "../model";
import MootsMenu from "./MootsMenu";
import useWindowDimensions from "./hooks/viewPort";
import { BuiltAtlasLayout, defaultSettings } from "../../exporter/src/common/model";

const rootConfig = getConfig(false);
const subLayoutConfig = getConfig(true);

// Hook
function usePrevious<T>(value: T): T {
  // The ref object is a generic container whose current property is mutable ...
  // ... and can hold any value, similar to an instance property on a class
  const ref: any = useRef<T>();
  // Store current value in ref
  useEffect(() => {
    ref.current = value;
  }, [value]); // Only re-run if value changes
  // Return previous value (happens before update in useEffect above)
  return ref.current;
}

function constructEdgeMap(graph: MultiDirectedGraph): Map<string, Edge> {
  const edgeMap = new Map<string, Edge>();
  graph?.forEachEdge((edge, attrs, source, target) => {
    if (source !== undefined && target !== undefined && attrs.weight !== null) {
      edgeMap.set(edge, {
        source: source,
        target: target,
        weight: attrs.weight,
        ogWeight: attrs.ogWeight,
      });
    }
  });
  return edgeMap;
}

function constructNodeMap(graph: MultiDirectedGraph): Map<string, Node> {
  const nodeMap = new Map<string, Node>();
  graph?.forEachNode((_, attrs) => {
    nodeMap.set(attrs.label, {
      key: attrs.key,
      size: attrs.size,
      label: attrs.label,
      cType: attrs.cType,
      did: attrs.did,
    });
  });
  return nodeMap;
}

const isLocal = document.location.hostname === "localhost";

interface GraphProps {
  fetchLayoutURL: (layoutName: string, isSubLayout: boolean) => string;
}

const GraphContainer: React.FC<GraphProps> = ({ fetchLayoutURL }) => {
  // Router info
  const [searchParams, setSearchParams] = useSearchParams();
  // Graph raw data
  const [graphDump, setGraphDump] = React.useState<any>(null);

  // Graph stats
  const [userCount, setUserCount] = React.useState<number>(0);
  const [edgeCount, setEdgeCount] = React.useState<number>(0);
  const [totalWeight, setTotalWeight] = React.useState<number>(0);

  // Selected Node properties
  const [selectedNode, setSelectedNode] = React.useState<string | null>(null);
  const [legend, setLegend] = React.useState<boolean>(false);
  const [showHiddenClusters, setShowHiddenClusters] = React.useState<boolean>(false);
  const [hideMenu, setHideMenu] = React.useState<boolean>(searchParams.get("hm") === "true");
  const [moderator] = React.useState<boolean>(searchParams.get("moderator") === "true");

  const isMobile = useMediaQuery({ query: '(max-width: 600px)' });
  const [viewPort, setViewPort] = React.useState<{ width: number, height: number }>(useWindowDimensions());
  const [accessJwt, setAccessJwt] = React.useState<string>("");
  const [refreshJwt, setRefreshJwt] = React.useState<string>("");

  const [layout] = React.useState<BuiltAtlasLayout>(rootConfig.getLayout(searchParams.get("layout"))
    || subLayoutConfig.getLayout(searchParams.get("layout"))
    || rootConfig.getDefaultLayout(moderator, isMobile)
  );

  const currentLayoutName = layout.name;

  const [currentLanguage, setCurrentLanguage] = React.useState<string>(getLanguageOrDefault(searchParams.get("lang")));
  // const [showExperimental, setShowExperimental] = React.useState<boolean>(false);
  const [selectedNodeCount, setSelectedNodeCount] = React.useState<number>(-1);
  const [inWeight, setInWeight] = React.useState<number>(-1);
  const [outWeight, setOutWeight] = React.useState<number>(-1);
  const [selectedNodeEdges, setSelectedNodeEdges] = React.useState<
    string[] | null
  >(null);
  const [useSubclusterOverlay, setUseSubclusterOverlay] =
    React.useState<boolean>(searchParams.get("sc") === "true");
  const [showSecondDegreeNeighbors, setShowSecondDegreeNeighbors] =
    React.useState<boolean>(false);

  const previousSelectedNode: string | null = usePrevious<string | null>(
    selectedNode
  ) || "";
  const previousSecondDegreeNeighbors: boolean = usePrevious<boolean>(
    showSecondDegreeNeighbors
  ) || false;
  const previousUseSubclusterOverlay: boolean = usePrevious<boolean>(
    useSubclusterOverlay
  ) || false;

  // Graph State
  const [graph, setGraph] = React.useState<MultiDirectedGraph | null>(null);
  const [graphShouldUpdate, setGraphShouldUpdate] =
    React.useState<boolean>(true);
  const [loading, setLoading] = React.useState<boolean>(true);

  // Moot List State
  const [mootList, setMootList] = React.useState<MootNode[]>([]);
  const [clusterList, setClusterList] = React.useState<MootNode[]>([]);
  const [clusterLists, setClusterLists] = React.useState<Map<string, MootNode[]>>(new Map());
  const [communityList, setCommunityList] = React.useState<MootNode[]>([]);
  const [showMootList, setShowMootList] = React.useState<boolean>(searchParams.get("ml") === "true");
  const [showCommunityList, setShowCommunityList] = React.useState<boolean>(searchParams.get("cl") === "true");

  const [avatarURI, setAvatarURI] = React.useState<string>();
  const [edgeMap, setEdgeMap] = React.useState<Map<string, Edge>>(new Map());
  const [nodeMap, setNodeMap] = React.useState<Map<string, Node>>(new Map());

  const [clusters, setClusters] = React.useState<Cluster[]>([]);
  const [showCommunityLabels, setShowCommunityLabels] =
    React.useState<boolean>(getConfig(layout.isSubLayout).getLayoutSetting(layout, "showLabels") || defaultSettings.showLabels);

  const SocialGraph: React.FC = () => {
    const loadGraph = useLoadGraph();
    const registerEvents = useRegisterEvents();
    const { sigma, container } = useSigmaContext();
    const title = getTranslationWithOverride({ key: 'title', language: currentLanguage, layout });

    document.title = title;

    useEffect(() => {
      // Create the graph
      const newGraph = new MultiDirectedGraph();

      const hiddenClusters = getConfig(layout.isSubLayout).hiddenClusters.get(currentLayoutName) ?? new Map();
      if (graphDump !== null && (graph === null || graphShouldUpdate)) {
        setGraphShouldUpdate(false);
        newGraph.import(graphDump);

        // Construct the edge and node maps
        const newEdgeMap = constructEdgeMap(newGraph);
        const newNodeMap = constructNodeMap(newGraph);
        setEdgeMap(newEdgeMap);
        setNodeMap(newNodeMap);

        const communityClusters = newGraph.getAttribute("clusters");

        if (communityClusters === null) {
          return;
        }
        const colorCount = Object.keys(communityClusters).length -
          Object.keys(getConfig(layout.isSubLayout).knownClusterColorMappings).length -
          Object.keys(getConfig(layout.isSubLayout).knownOverlayClusterColorMappings).length || 1;
        const palette = iwanthue(
          colorCount,
          {
            quality: 100,
            seed: "cool-palette",
            colorSpace: layout.subLayoutCommunityName?.startsWith("Giga") ? "purple-wine"
              : layout.subLayoutCommunityName?.startsWith("Super") ? "ice-cube"
                : "red-roses",
            clustering: "force-vector",
          }
        );

        // create and assign one color by cluster
        for (const community in communityClusters) {
          const cluster = communityClusters[community];
          if (cluster.name !== undefined) {
            cluster.color = useSubclusterOverlay
              ? (getConfig(layout.isSubLayout).knownOverlayClusterColorMappings.get(cluster.name) ?? "#f0f0f0") //use overlay color
              : getConfig(layout.isSubLayout).knownClusterColorMappings.get(cluster.name) //use normal color
              ?? palette.pop();
          } else {
            cluster.color = palette.pop();
          }
        }

        // Set the color of each node to the color of its cluster
        newGraph?.updateEachNodeAttributes((_, attr) => {
          if (
            attr.community !== undefined &&
            attr.community in communityClusters
          ) {
            if (showHiddenClusters || !hiddenClusters.get(communityClusters[attr.community].label)) {
              attr.color = communityClusters[attr.community].color;
            } else {
              //todo remove completely and use different layout
              attr.color = getConfig(layout.isSubLayout).getLayoutSetting(layout, "hiddenClusterColor") || defaultSettings.hiddenClusterColor;
            }
          }
          return attr;
        });

        // Hide all edges
        newGraph.forEachEdge((edge) => {
          newGraph.setEdgeAttribute(edge, "hidden", true);
        });

        newGraph.setAttribute("clusters", communityClusters);

        setUserCount(newGraph.order);
        setEdgeCount(newGraph.size);
        setTotalWeight(
          newGraph.reduceEdges(
            (acc, edge) => acc + newGraph.getEdgeAttribute(edge, "ogWeight"),
            0
          )
        );

        newGraph?.forEachNode((_, attr) => {
          attr["old-color"] = attr.color;
        });

        // Initialize cluster positions
        const newClusters: Cluster[] = [];
        for (const community in communityClusters) {
          const cluster = communityClusters[community];
          // adapt the position to viewport coordinates
          const viewportPos = sigma.graphToViewport(cluster as Coordinates);
          if (showHiddenClusters || !hiddenClusters.get(cluster.name)) {
            newClusters.push({
              name: cluster.name,
              displayName: cluster.displayName,
              idx: cluster.idx,
              x: viewportPos.x,
              y: viewportPos.y,
              color: cluster.color,
              size: cluster.size,
              positions: cluster.positions,
            });
          }
        }

        const dropCommunities = getConfig(layout.isSubLayout).dropCommunities;
        const communityProperty = getConfig(layout.isSubLayout).getLayoutSetting(layout, "communityProperty") || defaultSettings.communityProperty;
        const dropOptedOut = getConfig(false).optout;

        newGraph?.nodes().forEach((node) => {
          if (dropOptedOut) {
            const currentNodeHandle = newGraph.hasNode(node) && newGraph?.getNodeAttribute(node, "label")
            if (newGraph.hasNode(node) && dropOptedOut.filter(opt => opt.handle === currentNodeHandle).length !== 0) {
              newGraph?.setNodeAttribute(node, "hidden", true);
              newGraph?.setNodeAttribute(node, "label", undefined);
              newGraph?.dropNode(node);
            }
          }
          if (dropCommunities && dropCommunities.get(currentLayoutName)) {
            const currentNodeCommunity = newGraph.hasNode(node) && newGraph?.getNodeAttribute(node, communityProperty)
            if (newGraph.hasNode(node) && dropCommunities.get(currentLayoutName)?.get(currentNodeCommunity)) {
              newGraph?.setNodeAttribute(node, "hidden", true);
              newGraph?.setNodeAttribute(node, "label", undefined);
              newGraph?.dropNode(node);
            }
          }
        });

        sigma.setSetting("renderLabels", !layout.nodesAreCommunities || (layout.nodesAreCommunities && showCommunityLabels));

        setClusters(newClusters);
        setGraph(newGraph);
        loadGraph(newGraph);
        setLoading(false);
      }
    }, [loadGraph]);

    // Render Cluster Labels
    const renderClusterLabels = () => {
      if (graph === null) {
        return;
      }
      // create the clustersLabel layer
      const communityClusters = graph.getAttribute("clusters");

      // Initialize cluster positions
      for (const community in communityClusters) {
        const cluster = communityClusters[community];
        // adapt the position to viewport coordinates
        const viewportPos = sigma.graphToViewport(cluster as Coordinates);
        const clusterLabel = document.getElementById(`cluster-${cluster.idx}`);
        // update position from the viewport
        if (clusterLabel !== null) {
          clusterLabel.style.top = `${viewportPos.y.toFixed(2)}px`;
          clusterLabel.style.left = `${viewportPos.x.toFixed(2)}px`;
        }
      }
    };

    // Select Node Effect
    useEffect(() => {
      if (
        graph !== null &&
        selectedNode !== null &&
        (
          selectedNode !== previousSelectedNode
          || showSecondDegreeNeighbors !== previousSecondDegreeNeighbors
          || useSubclusterOverlay !== previousUseSubclusterOverlay
        )
      ) {

        // Hide all edges
        graph?.edges().forEach((edge) => {
          graph?.setEdgeAttribute(edge, "hidden", true);
          // Set all edges to a light gray
          graph?.setEdgeAttribute(edge, "color", "#e0e0e0");
        });

        // Hide or fade all nodes
        graph?.updateEachNodeAttributes((_, attrs) => {
          attrs.highlighted = false;
          if (showSecondDegreeNeighbors) {
            attrs.hidden = true;
          } else {
            attrs.hidden = false;
            attrs.color = "rgba(0,0,0,0.03)";
          }
          return attrs;
        });

        // Get all neighbors of selected node
        const neighbors = graph?.neighbors(selectedNode);

        // Build the MootList, an ordered list of neighbors by weight
        const mootList = graph?.reduceEdges<MootNode[]>(
          selectedNode,
          (acc, _, edgeAttrs, source, target, sourceAttrs, targetAttrs) => {
            const weight = edgeAttrs.weight;
            const existingMootEntry = acc.find((entry) => {
              return (
                entry.node.toString() === target.toString() ||
                entry.node.toString() === source.toString()
              );
            });
            if (existingMootEntry === undefined && source !== target) {
              const key =
                source === selectedNode ? targetAttrs.key : sourceAttrs.key;
              const label =
                source === selectedNode ? targetAttrs.label : sourceAttrs.label;
              const did =
                source === selectedNode ? targetAttrs.did : sourceAttrs.did;
              const communityProperty = getConfig(layout.isSubLayout).getLayoutSetting(layout, "communityProperty") || defaultSettings.communityProperty;
              const community = graph?.getNodeAttribute(key, communityProperty);
              const dropCommunities = getConfig(layout.isSubLayout).dropCommunities.get(currentLayoutName);
              const shouldSkip = dropCommunities?.get(community);
              if (!shouldSkip) {
                acc.push({
                  node: key,
                  size: graph?.getNodeAttribute(key, "size"),
                  total: graph?.getNodeAttribute(key, "total"),
                  community: graph?.getNodeAttribute(key, "community"),
                  weight: weight,
                  direction: layout.isSubLayout ? false : source === selectedNode,
                  label: label,
                  did: did,
                });
              }
            }
            return acc;
          },
          []
        );

        mootList.sort((a, b) => b.weight - a.weight);

        setMootList(mootList);

        const { detailedCluster } = getConfig(layout.isSubLayout).identifyClusters(graph?.getNodeAttribute(selectedNode, "community"), currentLayoutName);
        const communityList: MootNode[] = graph?.filterNodes((_, atts) => {
          return atts.community === detailedCluster?.community;
        }).map(key => {
          return {
            node: key,
            size: graph?.getNodeAttribute(key, "size"),
            total: graph?.getNodeAttribute(key, "total"),
            community: graph?.getNodeAttribute(key, "community"),
            weight: graph?.getNodeAttribute(key, "size"),
            direction: true,
            label: graph?.getNodeAttribute(key, "label"),
            did: graph?.getNodeAttribute(key, "did"),
          }
        }
        );

        communityList.sort((a, b) => b.weight - a.weight);

        setCommunityList(communityList);

        const clusters = getConfig(layout.isSubLayout).identifyClusters(graph?.getNodeAttribute(selectedNode, "community"), currentLayoutName);
        const mainClusterCommunity = clusters.mainCluster?.community;

        let clusterList: MootNode[];
        if (mainClusterCommunity && clusterLists.get(mainClusterCommunity)) {
          const foundClusterList = clusterLists.get(mainClusterCommunity);
          if (foundClusterList) {
            setClusterList(foundClusterList);
            clusterLists.set(mainClusterCommunity, foundClusterList);
            setClusterLists(clusterLists);
          }
        } else {
          clusterList = graph?.filterNodes((_, atts) => {

            return clusters.mainClusterChildren ? clusters.mainClusterChildren?.indexOf(atts.community) !== -1
              //dirty hack for empty overlay nebulas in sub_config
              : clusters.mainCluster?.name.startsWith("c") ? true
                : clusters.mainCluster?.community === atts.community;
          }).map(key => {
            return {
              node: key,
              size: graph?.getNodeAttribute(key, "size"),
              total: graph?.getNodeAttribute(key, "total"),
              community: graph?.getNodeAttribute(key, "community"),
              weight: graph?.getNodeAttribute(key, "size"),
              label: graph?.getNodeAttribute(key, "label"),
              did: graph?.getNodeAttribute(key, "did"),
            }
          }
          );

          clusterList.sort((a, b) => b.weight - a.weight);
          setClusterList(clusterList);
          if (mainClusterCommunity) {
            clusterLists.set(mainClusterCommunity, clusterList)
            setClusterLists(clusterLists);
          }
        }

        // Re-color all communityNodes
        if (useSubclusterOverlay && communityList && communityList.length > 0) {
          communityList.forEach(node => {
            graph?.setNodeAttribute(node.node, 'hidden', false);
            graph?.setNodeAttribute(node.node, 'color', graph?.getNodeAttribute(node.node, 'old-color'));
          })
        }

        // Re-color all nodes connected to selected node
        graph?.forEachNeighbor(selectedNode, (node, attrs) => {
          attrs.hidden = false;
          attrs.color = attrs["old-color"];
          // Set all 2nd degree neighbors to a light grey
          if (showSecondDegreeNeighbors) {
            graph?.forEachNeighbor(node, (neighbor, neighborAttrs) => {
              if (!neighbors?.includes(neighbor)) {
                neighborAttrs.hidden = false;
                neighborAttrs.color = "rgba(0,0,0,0.1)";
              }
              // Show 2nd degree neighbor edges
              graph?.forEachEdge(node, neighbor, (_, attrs) => {
                attrs.hidden = false;
              });
            });
          }
        });

        // Re-show edges connected to selected node
        graph?.forEachInEdge(selectedNode, (_, attrs) => {
          attrs.hidden = false;
          attrs.color = "#4b33ff";
        });

        graph?.forEachOutEdge(selectedNode, (_, attrs) => {
          attrs.hidden = false;
          attrs.color = "#ff5254";
        });

        // Re-color selected node and highlight it
        graph?.updateNodeAttributes(selectedNode, (attrs) => {
          attrs.color = attrs["old-color"];
          attrs.highlighted = true;
          attrs.hidden = false;
          return attrs;
        });

        // Update selected node count and weight for display
        setSelectedNodeCount(graph?.degree(selectedNode) || 0);
        setInWeight(
          graph?.reduceInEdges(
            selectedNode,
            (acc, edge) => acc + graph.getEdgeAttribute(edge, "ogWeight"),
            0
          ) || 0
        );
        setOutWeight(
          graph?.reduceOutEdges(
            selectedNode,
            (acc, edge) => acc + graph.getEdgeAttribute(edge, "ogWeight"),
            0
          ) || 0
        );
        setSelectedNodeEdges(graph?.edges(selectedNode) || null);
        sigma.refresh();
      } else if (graph !== null && selectedNode === null) {
        graph?.edges().forEach((edge) => {
          graph?.setEdgeAttribute(edge, "hidden", true);
          graph?.setEdgeAttribute(edge, "color", "#e0e0e0");
        });
        graph?.nodes().forEach((node) => {
          const oldColor = graph.getNodeAttribute(node, "old-color");
          graph?.setNodeAttribute(node, "color", oldColor);
          graph?.setNodeAttribute(node, "highlighted", false);
          graph?.setNodeAttribute(node, "hidden", false);
        });
        setSelectedNodeCount(-1);
        setSelectedNodeEdges(null);
        setInWeight(-1);
        setOutWeight(-1);
        sigma.refresh();
      }
    }, [selectedNode, showSecondDegreeNeighbors, useSubclusterOverlay]);

    useEffect(() => {
      renderClusterLabels();
      // Register the events
      registerEvents({
        clickNode: (event: any) => {
          const nodeLabel = graph?.getNodeAttribute(event.node, "label");
          searchParams.set('s', `${nodeLabel}`);
          if (showMootList) {
            searchParams.set('ml', `${showMootList}`);
          }
          if (showCommunityList) {
            searchParams.set('cl', `${showCommunityList}`);
          }
          setSearchParams(searchParams);
        },
        doubleClickNode: (event: any) => {
          window.open(
            `https://bsky.app/profile/${graph?.getNodeAttribute(
              event.node,
              "did"
            )}`,
            "_blank"
          );
        },
        afterRender: () => {
          renderClusterLabels();
        },
        clickStage: (_: any) => {
          searchParams.delete('s');
          setSearchParams(searchParams);
        },
      });
    }, [registerEvents]);

    return null;
  };

  async function fetchGraph() {
    const textGraph = await fetch(fetchLayoutURL(layout.name, layout.isSubLayout));
    const responseJSON = await textGraph.json();
    setGraphDump(responseJSON);
  }

  useEffect(() => {
    const selectedUserFromParams = searchParams.get("s");
    if (selectedUserFromParams !== null) {
      const selectedNodeKey = nodeMap.get(selectedUserFromParams)?.key;
      if (selectedNodeKey !== undefined) {
        setSelectedNode(selectedNodeKey.toString());
      }
    } else {
      setSelectedNode(null);
      searchParams.delete("s");
      setSearchParams(searchParams);
    }
  }, [searchParams, nodeMap]);

  useEffect(() => {
    fetchGraph();
  }, []);

  const hideClusterLabels = getConfig(layout.isSubLayout).hideClusterLabels.get(currentLayoutName);
  const knownClusterNamesPerLayout = getConfig(layout.isSubLayout).knownClusterNames.get(layout.name);
  return (
    <div className="overflow-hidden">
      {loading && <Loading message={getTranslation('loading_graph', currentLanguage)} />}
      <SigmaContainer
        graph={MultiDirectedGraph}
        style={{ height: "100vh" }}
        settings={{
          nodeProgramClasses: { image: getNodeProgramImage() },
          defaultNodeType: "image",
          defaultEdgeType: "arrow",
          labelDensity: 0.07,
          labelGridCellSize: 60,
          labelRenderedSizeThreshold: 9,
          labelSize: 12,
          labelFont: "Lato, sans-serif",
          zIndex: true,
        }}
      >
        {selectedNode !== null && mootList.length >= 0 && (
          <MootsMenu
            hideMenu={hideMenu}
            layout={layout}
            currentLanguage={currentLanguage}
            selectedNode={selectedNode}
            previousSelectedNode={previousSelectedNode}
            setSelectedNode={setSelectedNode}
            showMootList={showMootList}
            setShowMootList={setShowMootList}
            mootList={mootList}
            communityList={communityList}
            clusterList={clusterList}
            avatarURI={avatarURI}
            searchParams={searchParams}
            setSearchParams={setSearchParams}
            graph={graph}
            showHiddenClusters={showHiddenClusters}
            showCommunityList={showCommunityList}
            setShowCommunityList={setShowCommunityList}
            useSubclusterOverlay={useSubclusterOverlay}
          />
        )}
        {legend && (<Legend
          hideMenu={hideMenu}
          legend={legend}
          setLegend={setLegend}
          layout={layout}
          showHiddenClusters={showHiddenClusters}
          currentLanguage={currentLanguage}
        />)}
        <div className="overflow-hidden w-screen h-screen absolute top-0 left-0">
          {clusters.map((cluster) => {
            if (cluster.name !== undefined) {
              return (
                <div
                  key={cluster.idx}
                  id={`cluster-${cluster.idx}`}
                  hidden={!showCommunityLabels}
                  className={`clusterLabel ${getConfig(layout.isSubLayout).getContrastColor(cluster.color) === "#000000"
                    ? "blackShadow" : "whiteShadow"}
                  absolute desktop:text-xl mobile:text-md xs:text-sm tracking-tight font-emoji`}
                  style={{
                    fontVariant: 'small-caps',
                    fontWeight: "bolder",
                    wordSpacing: -16,
                    color: `${cluster.color}`,
                    top: `${cluster.y}px`,
                    left: `${cluster.x}px`,
                    zIndex: 3,
                  }}
                >
                  {hideClusterLabels?.get(cluster.name)
                    ? ""
                    : (knownClusterNamesPerLayout?.get(cluster.name)
                      && getValueByLanguage(knownClusterNamesPerLayout?.get(cluster.name), currentLanguage))
                    ?? ""
                    // ?? (cluster.displayName || cluster.name)
                  }
                </div>
              );
            }
          })}
        </div>
        <SocialGraph />
        <Menu
          isMobile={isMobile}
          viewPort={viewPort}
          selectedNodeCount={selectedNodeCount}
          userCount={userCount}
          selectedNodeEdges={selectedNodeEdges}
          edgeCount={edgeCount}
          graph={graph}
          showMootList={showMootList}
          layout={layout}
          currentLanguage={currentLanguage}
          searchParams={searchParams}
          setSearchParams={setSearchParams}
          setLoading={setLoading}
          useSubclusterOverlay={useSubclusterOverlay}
          setUseSubclusterOverlay={setUseSubclusterOverlay}
          setGraphShouldUpdate={setGraphShouldUpdate}
          showHiddenClusters={showHiddenClusters}
          setShowHiddenClusters={setShowHiddenClusters}
          showSecondDegreeNeighbors={showSecondDegreeNeighbors}
          setShowSecondDegreeNeighbors={setShowSecondDegreeNeighbors}
          showClusterLabels={showCommunityLabels}
          setShowClusterLabels={setShowCommunityLabels}
          legend={legend}
          setLegend={setLegend}
          moderator={moderator}
          hideMenu={hideMenu}
          setHideMenu={setHideMenu} />
      </SigmaContainer>
      <Footer
        currentLanguage={currentLanguage}
        config={getConfig(layout.isSubLayout)}
        graph={graph}
        searchParams={searchParams}
        setSearchParams={setSearchParams}
        setCurrentLanguage={setCurrentLanguage} />
    </div>
  );
};

export default GraphContainer;
