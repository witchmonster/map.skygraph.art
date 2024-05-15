interface Edge {
    source: string;
    target: string;
    weight: number;
    ogWeight: number;
}

interface Node {
    key: number;
    size: number;
    cType: string;
    label: string;
    did: string;
}

interface MootNode {
    node: string;
    size: number;
    total?: number;
    community: string;
    avatarUrl?: string;
    label: string;
    did: string;
    direction?: boolean;
    weight: number;
}

interface SearchNode {
    did: string;
    handle: string;
    communities: string[];
}

interface CommunitiesNode {
    key: string;
    name: string;
    community: string;
}

interface Cluster {
    name?: string;
    displayName?: string;
    idx: string;
    x?: number;
    y?: number;
    color?: string;
    size: number;
    positions: { x: number; y: number }[];
}

export type { Edge, Node, MootNode, SearchNode, CommunitiesNode, Cluster };