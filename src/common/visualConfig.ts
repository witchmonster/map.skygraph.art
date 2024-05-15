import { getConfig } from '../../exporter/src/common/config';
import xolor from 'xolor';

function buildVisualConfig(isSubLayout: boolean) {
    const config = getConfig(isSubLayout);
    let hideClusterLabels: Map<string, Map<string, boolean>> = new Map();
    let dropCommunities: Map<string, Map<string, boolean>> = new Map();
    const overlayClusterParents: Map<string, string> = new Map();
    const knownClusterColorMappings: Map<string, string> = new Map();
    const knownOverlayClusterColorMappings: Map<string, string> = new Map();
    const knownClusterNames: Map<string, Map<string, { [lang: string]: string }>> = new Map();

    for (let layout of config.layout.layouts) {
        let knownClusterNamesPerLayout: Map<string, { [lang: string]: string }> = new Map()
        let hideClusterLabelsPerLayout: Map<string, boolean> = new Map();
        let dropCommunitiesPerLayout: Map<string, boolean> = new Map();

        knownClusterNames.set(layout.name, knownClusterNamesPerLayout);
        hideClusterLabels.set(layout.name, hideClusterLabelsPerLayout);
        dropCommunities.set(layout.name, dropCommunitiesPerLayout);
        let allLayoutGroups = layout.groups.hidden ? layout.groups.main.concat(layout.groups.hidden) : layout.groups.main;
        for (let group of allLayoutGroups) {
            const label = config.clusters.filter(cluster => cluster.name === group.name)[0]?.label;
            if (label)
                knownClusterNamesPerLayout.set(group.name, label);
            if (group['dropNodes']) {
                dropCommunitiesPerLayout.set(config.getClusterByName(group.name).community, true);
            }
            if (group['hide-label']) {
                hideClusterLabelsPerLayout.set(group.name, true);
            }
            if (group.overlay) {
                const parentCluster = group.name;
                for (let overlayCluster of group.overlay) {
                    const overlayLabel = config.clusters.filter(cluster => cluster.name === overlayCluster)[0]?.label;
                    if (overlayLabel) {
                        knownClusterNamesPerLayout.set(overlayCluster, overlayLabel);
                    }
                    if (group['hide-overlay-labels'] !== false) {
                        hideClusterLabelsPerLayout.set(overlayCluster, true);
                    }
                    overlayClusterParents.set(overlayCluster, parentCluster);
                }
            }
            if (group.underlay) {
                for (let underlayCluster of group.underlay) {
                    if (group['hide-underlay-labels'] !== false) {
                        hideClusterLabelsPerLayout.set(underlayCluster, true);
                    }
                }
            }
        }
    }

    for (var cluster of config.clusters) {
        if (!cluster.name) {
            //err
        }

        if (cluster.color) {
            const parentClusterName = overlayClusterParents.get(cluster.name);
            if (parentClusterName) {
                //get main color from parent cluster, will be shown by default
                knownClusterColorMappings.set(cluster.name, config.getClusterByName(parentClusterName).color);
                //get overlay color from itself, will be shown when overlays are on
                knownOverlayClusterColorMappings.set(cluster.name, cluster.color)
            } else {
                knownClusterColorMappings.set(cluster.name, cluster.color);
            }
        }
        // if (cluster['hide-label']) {
        //     hideClusterLabels.set(cluster.name, true);
        // }
    }

    const getContrastColor = (color: string | undefined): string => {
        if (!color) {
            return "#000000";
        }

        const c = xolor(color);
        const brightness = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
        return brightness >= 128 ? "#000000" : "#ffffff";
    }

    return {
        ...config,
        getContrastColor,
        dropCommunities: dropCommunities,
        hideClusterLabels: hideClusterLabels,
        hiddenClusters: config.hiddenClusters,
        knownClusterNames: knownClusterNames,
        knownClusterColorMappings: knownClusterColorMappings,
        knownOverlayClusterColorMappings: knownOverlayClusterColorMappings
    }
}

const config = buildVisualConfig(false);
const subConfig = buildVisualConfig(true);

function getVisualConfig(isSubLayout: boolean) {
    return isSubLayout ? subConfig : config;
}

export {
    getVisualConfig as getConfig
}