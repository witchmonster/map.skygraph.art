interface InputGraphData {
    graphVersion?: number;
    nodes: {
        did: string;
        handle?: string;
        community: string;
        size?: number;
        cType?: string
    }[];
    rels: {
        source: string;
        target: string;
        weight: number;
    }[];
    timestamp?: string;
}

interface Edge {
    source: string;
    target: string;
    weight: number;
}

interface Node {
    did: string;
    handle: string;
    community: string;
    size?: number;
    cType?: string;
}

interface IndexNode {
    key: number;
    did: string;
    label: string;
    community: string;
}

interface Cluster {
    name?: string;
    displayName?: string;
    idx: string;
    dbIndex?: number;
    x?: number;
    y?: number;
    color?: string;
    prio?: number;
    size: number;
    representative?: string;
    positions: { x: number; y: number }[];
}

interface ClusterConfig {
    community: string;
    name: string;
    label?: { [language: string]: string; }
    leader?: string;
    hide?: boolean;
    "hide-label"?: boolean;
    color: string;
    type?: string;
    prio?: number;
    group?: string;
    legend?: {
        [language: string]: {
            description: string;
            extra?: string;
            links?: {
                title: string;
                url: string;
            }[]
        }
    }
}

interface AtlasSettings {
    settings: {
        graphVersion: number;
        isDev?: boolean;
        dataSetTime: { [lang: string]: string };
        configVersion: string;
        languages: string[];
        layoutDefaults: LayoutSettings
    },
    optout?: [{ handle: string; did: string }]
    legend: AtlasLegend;
    layout: AtlasLayoutSettings;
    clusters: ClusterConfig[];
}

interface AtlasLegend {
    author: {
        name: string;
        url: string;
        github: string;
    },
    legends: {
        name: string;
        overview?: {
            [language: string]: {
                summary: string,
                nodes: string,
                nodeWeight: string,
                relationships: string,
                relationshipWeight: string,
                algo: string,
                overview_red_arrows: string,
                overview_blue_arrows: string
            }
        },
        translation_overrides?: {
            [language: string]: { key: string, value: string }[]
        }
        groups: GroupLegend[]
    }[];
}

interface AtlasLayoutSettings {
    modes: {
        default: string[],
        moderator: string[]
    },
    layouts: AtlasLayout[];
}

interface NodeMapping {
    id: {
        type: "fromNodeProperty" | "concatUnderscore" | string
        nodeProperty: string,
    }
    weight: {
        type: "harmonicFromEdges" | "fromNodeProperty" | string
        nodeProperty?: string
    }
    label: {
        nodeProperty?: string;
    }
    score: {
        property?: string
    }
}

interface LayoutSettings {

    // layout display
    showLabels?: boolean;
    communityProperty?: string;
    topSize?: number;

    // global layout generation
    iterationCount?: number;
    globus?: boolean;
    rotate?: boolean;
    angle?: number; //values from 0 to 2
    blackHoleGravity?: number;

    // node size calculation
    maxHistoricWeightSum?: number; //hint: run once, then chose a better property
    minSize?: number;
    maxSize?: number;

    // edges
    topNonRemovableEdges?: number,
    maxEdges?: number,

    // node display
    colors?: string[]
    hiddenClusterColor?: string;
}

const defaultSettings = {
    showLabels: true,
    communityProperty: "community",
    topSize: 100,

    iterationCount: 600,
    rotate: false,
    angle: 0,
    barnesHutTheta: 1.0,

    maxHistoricWeightSum: 10000000,
    minSize: 1.5,
    maxSize: 100,

    topNonRemovableEdges: 3,
    maxEdges: 10,

    colors: [ //Sky Blue palette
        "#009ACD", // DeepSkyBlue3
        "#1E90FF", // DodgerBlue
        "#00BFFF", // DeepSkyBlue
        "#7EC0EE", // SkyBlue2
        "#55eeFf", // LightSkyBlue1
        "#5B9BD5", // CornflowerBlue
        "#4A708B", // SkyBlue4
    ],
    hiddenClusterColor: "#f5f5f5"
}

interface MainAtlasLayout {
    isSubLayout: boolean;
    subLayoutCommunityName?: string;
    parentLayout?: string;
    name: string;
    version: string;
    isMobile?: boolean;
    nodesAreCommunities?: boolean;
    label: { [key: string]: string };
    graphFilePath: string;
    subLayoutsFilePath?: string;
    search?: {
        searchSrcFileName?: string;
        outDir: string;
        prefixesFile: string;
        communitiesFile: string;
        searchFileNamePrefix: string;
        searchFileNameDelimiter: string;
        searchFileNameExtension: string;
    };
    settings: LayoutSettings;
    nodeMapping: NodeMapping;
    groups: {
        main: LayoutClusterGroup[];
        hidden?: LayoutClusterGroup[];
    };
    legend?: string;
}

interface BuiltAtlasLayout extends MainAtlasLayout {
    subLayouts?: BuiltAtlasLayout[];
}

type AtlasLayout = BuiltAtlasLayout | InheritedAtlasLayout;

interface InheritedAtlasLayout {
    isSubLayout?: boolean;
    name: string;
    from: string;
    label: { [key: string]: string };
    override_settings: LayoutSettings;
    groups: {
        main: LayoutClusterGroup[];
        hidden?: LayoutClusterGroup[];
    };
}

interface LayoutClusterGroup {
    name: string;
    maxEdges?: number;
    dropNodes?: boolean;
    "hide-label"?: boolean; //default false
    "hide-overlay-labels"?: boolean; //default true
    "hide-underlay-labels"?: boolean; //default true
    overlay?: string[],
    underlay?: string[]
}

interface GroupLegend {
    name: string;
    hide?: boolean;
    clusters?: string[],
    cluster_templates?: string[],
    legend: {
        [language: string]: {
            label: string;
            description: string;
            extras?: string[],
            links?: {
                title: string;
                url: string;
            }[]
        }
    }

}

interface GraphNode {
    key: number,
    did: string,
    label: string,
    community: string,
    size: number;
    cType?: string;
}

interface ClusterRepPrio {
    label: string;
    prio: number;
    displayName?: string;
    dbIndex?: number;
}

export { defaultSettings, InputGraphData, GraphNode, AtlasLayout, MainAtlasLayout, BuiltAtlasLayout, InheritedAtlasLayout, GroupLegend, ClusterConfig, LayoutClusterGroup, Edge, Node, IndexNode, Cluster, AtlasSettings, ClusterRepPrio };