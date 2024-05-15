import { MultiDirectedGraph } from "graphology";
import { AtlasLayout, Cluster } from "../common/model"

function assignClusterPositions(
    log: (msg: string) => void,
    layout: AtlasLayout,
    communityClusters: { [key: string]: Cluster },
    graph: MultiDirectedGraph) {
    graph.forEachNode((_, atts) => {
        if (atts.community === undefined
            || atts.community === null
        ) return;
        const cluster = communityClusters[atts.community];
        if (cluster === undefined) return;
        cluster.positions.push({ x: atts.x, y: atts.y });
    });

    log("Assigning communities...");

    // Filter positions that are 2 standard deviations away from the mean and compute the barycenter of each cluster
    for (const community in communityClusters) {
        let x_positions = communityClusters[community].positions.map((p) => p.x);
        let y_positions = communityClusters[community].positions.map((p) => p.y);

        log(`Processing community ${communityClusters[community].name}...`);

        if (x_positions.length === 0 || y_positions.length === 0) {
            log(`Skipping community ${communityClusters[community].name}...`);
            continue; // Skip this community if it has no positions
        }

        const mean_x =
            x_positions.reduce((acc, x) => acc + x, 0) / x_positions.length;
        const mean_y =
            y_positions.reduce((acc, y) => acc + y, 0) / y_positions.length;

        const std_x = Math.sqrt(
            x_positions
                .map((x) => Math.pow(x - mean_x, 2))
                .reduce((a, b) => a + b, 0) / x_positions.length
        );
        const std_y = Math.sqrt(
            y_positions
                .map((y) => Math.pow(y - mean_y, 2))
                .reduce((a, b) => a + b, 0) / y_positions.length
        );

        log(
            `Community ${communityClusters[community].name} mean: (${mean_x}, ${mean_y}) std: (${std_x}, ${std_y})`
        );

        log(
            `Community ${communityClusters[community].name} positions: ${communityClusters[community].positions.length}`
        );

        const filtered_positions = communityClusters[community].positions.filter(
            (p) =>
                Math.abs(p.x - mean_x) <= 2 * std_x &&
                Math.abs(p.y - mean_y) <= 2 * std_y
        );

        log(
            `Community ${communityClusters[community].name} filtered positions: ${filtered_positions.length}`
        );

        if (filtered_positions.length === 0) {
            log(`Skipping community ${communityClusters[community].name}...`);
            continue; // Skip this community if there are no positions within 2 standard deviations
        }

        communityClusters[community].x = parseFloat(
            (
                filtered_positions.reduce((acc, p) => acc + p.x, 0) /
                filtered_positions.length
            ).toFixed(2)
        );
        communityClusters[community].y = parseFloat(
            (
                filtered_positions.reduce((acc, p) => acc + p.y, 0) /
                filtered_positions.length
            ).toFixed(2)
        );

        log(
            `Community ${communityClusters[community].name} barycenter: (${communityClusters[community].x}, ${communityClusters[community].y})`
        );
    }

    // Strip the positions from the cluster objects
    for (const community in communityClusters) {
        communityClusters[community].positions = [];
    }

    graph.setAttribute("clusters", communityClusters);

    log(`Number of clusters: ${Object.keys(communityClusters).length}`);
    for (const communityIdx in communityClusters) {
        const community = communityClusters[communityIdx];
        log(
            `Cluster ${community.name || community.idx
            }, size: ${community.size.toLocaleString()}, representative: ${community.representative || "N/A"
            }`
        );
    }

    log("Communities processed...");
}

export { assignClusterPositions }