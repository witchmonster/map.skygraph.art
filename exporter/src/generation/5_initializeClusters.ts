import { MultiDirectedGraph } from "graphology";
import { BuiltAtlasLayout, Cluster, defaultSettings } from "../common/model"
import { getConfig } from "../common/config";

function initializeClusters(
    log: (msg: string) => void,
    layout: BuiltAtlasLayout,
    graph: MultiDirectedGraph
) {
    // initialize clusters from graph data
    log("Initializing clusters...");

    const communityClusters: { [key: string]: Cluster } = {};

    graph.forEachNode((_, atts) => {
        const config = getConfig(layout.isSubLayout);
        // attr.
        const communityProperty = config.getLayoutSetting(layout, "communityProperty") || defaultSettings.communityProperty;
        const community = atts[communityProperty];
        const cluster = config.getClusterByCommunity(community);
        // If this node is in a community that hasn't been seen yet, create a new cluster
        if (!communityClusters[community]) {
            communityClusters[community] = {
                idx: community,
                positions: [],
                name: cluster && cluster.name || community,
                size: 1,
            };
            if (cluster && cluster.prio)
                communityClusters[community].prio = cluster.prio;
            if (cluster && cluster.leader)
                communityClusters[community].representative = cluster.leader;
        } else {
            // Otherwise, increment the size of the cluster
            communityClusters[community].size++;
        }
    });


    log("Truncating node position assignments...");
    // Reduce precision on node x and y coordinates to conserve bits in the exported graph
    graph.updateEachNodeAttributes((_, attrs) => {
        attrs.x = parseFloat(attrs.x.toFixed(2));
        attrs.y = parseFloat(attrs.y.toFixed(2));
        return attrs;
    });
    log("Done truncating node position assignments");

    return communityClusters;
}

export { initializeClusters }