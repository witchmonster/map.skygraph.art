import { AtlasSettings, ClusterRepPrio, ClusterConfig, BuiltAtlasLayout, InheritedAtlasLayout, MainAtlasLayout } from "./model";
import importedJson from "../../../exporter/input/config.json"
import importedSubLayoutsJson from "../../../exporter/input/sub_config.json"
import { AtlasLayout, LayoutClusterGroup } from "../common/model"
import { parse } from "semver";

function buildConfig(json: any) {
    //important for type check
    const configJson: AtlasSettings = json as any;
    const clusterRepresentatives: Map<string, ClusterRepPrio> = new Map();

    //more edges will be shown for focus clusters
    var groupMaxEdgeOverrides: Map<string, number> = new Map();
    var maxEdgesOverrides: Map<string, number> = new Map();
    const toBeExcludedCommunities: Map<string, Map<string, boolean>> = new Map();
    const toBeIncludedTemplates: Map<string, Map<string, boolean>> = new Map();
    const includedClusters: Map<string, Map<string, boolean>> = new Map();
    const hiddenClusters: Map<string, Map<string, boolean>> = new Map();
    const overlayLayouts: Map<string, boolean> = new Map();
    var configVersion = parse(json.settings.configVersion);

    if (configVersion == null) {
        throw new Error('Could not parse config version');
    }

    var allLayouts: AtlasLayout[] = json.layout.layouts;

    for (var layout of allLayouts) {
        var clustersIncludedInLayers: Map<string, boolean> = new Map();
        var layoutToBeIncludedCommunitiesByTemplates: Map<string, boolean> = new Map();
        var layoutToBeExcludedCommunities: Map<string, boolean> = new Map();
        var layoutHiddenClusters: Map<string, boolean> = new Map();
        var allClusterGroups: LayoutClusterGroup[] = layout.groups.main;
        toBeExcludedCommunities.set(layout.name, layoutToBeExcludedCommunities);
        toBeIncludedTemplates.set(layout.name, layoutToBeIncludedCommunitiesByTemplates);
        includedClusters.set(layout.name, clustersIncludedInLayers);
        hiddenClusters.set(layout.name, layoutHiddenClusters);

        if (layout.groups.hidden) {
            allClusterGroups = allClusterGroups.concat(layout.groups.hidden);
            for (var clusterInHiddenGroup of layout.groups.hidden) {
                layoutHiddenClusters.set(clusterInHiddenGroup.name, true);
                if (clusterInHiddenGroup.underlay) {
                    for (var clusterInHiddenUnderlay of clusterInHiddenGroup.underlay) {
                        layoutHiddenClusters.set(clusterInHiddenUnderlay, true);
                    }
                }
            }
        }

        for (var clusterInGroup of allClusterGroups) {
            clustersIncludedInLayers.set(clusterInGroup.name, true);
            if (clusterInGroup.overlay) {
                overlayLayouts.set(layout.name, true);
                for (var clusterNameInOverlay of clusterInGroup.overlay) {
                    clustersIncludedInLayers.set(clusterNameInOverlay, true);
                }
            }
            if (clusterInGroup.underlay) {
                for (var clusterNameInUnderlay of clusterInGroup.underlay) {
                    clustersIncludedInLayers.set(clusterNameInUnderlay, true);
                }
            }
        }

        if (json.clusters && json.clusters.length > 0) {
            for (var cluster of json.clusters) {
                const shouldBeRemoved = !clustersIncludedInLayers.get(cluster.name);
                if (shouldBeRemoved && cluster.community !== "" && !layout.isSubLayout) {
                    layoutToBeExcludedCommunities.set(cluster.community, true)
                }
            }
        }

    }

    if (json.clusters && json.clusters.length > 0) {
        for (var cluster of json.clusters) {
            const maxEdgesOverride = cluster.group && groupMaxEdgeOverrides.get(cluster.group);
            if (maxEdgesOverride) {
                maxEdgesOverrides.set(cluster.name, maxEdgesOverride)
            }

            if (cluster.leader) {
                clusterRepresentatives.set(cluster.leader, {
                    label: cluster.name,
                    prio: cluster.prio ?? 0
                });
            }
        }
    }

    function getAllLayoutsByMode(moderator: boolean): BuiltAtlasLayout[] {
        const defaultLayouts = getAllLayouts().filter(layout => config.layout.modes.default.indexOf(layout.name) !== -1);
        const moderatorLayouts = getAllLayouts().filter(layout => config.layout.modes.moderator.indexOf(layout.name) !== -1);
        return moderator && moderatorLayouts.length > 0 ? moderatorLayouts : defaultLayouts;
    }

    function getMainLayout(layout: AtlasLayout): BuiltAtlasLayout | undefined {
        if ((layout as any).settings) {
            return setSubLayouts(<MainAtlasLayout>layout);
        } else {
            const parentLayout = getMainLayoutByName((<InheritedAtlasLayout>layout).from);
            if (!parentLayout) {
                return undefined;
            }
            const currentLayoutOverride = <InheritedAtlasLayout>layout;
            const currentLayout = { ...parentLayout, ...currentLayoutOverride };
            currentLayout.settings = { ...parentLayout.settings, ...currentLayoutOverride.override_settings }
            return setSubLayouts(currentLayout);
        }
    }

    function setSubLayouts(layout: MainAtlasLayout): BuiltAtlasLayout {
        return layout;
    }

    function getAllLayouts(): BuiltAtlasLayout[] {
        return <BuiltAtlasLayout[]>config.layout.layouts
            .map(layout => getMainLayout(layout))
            .filter(layout => layout !== undefined);
    }

    function getLayoutSetting(layout: BuiltAtlasLayout, setting: string) {
        return (layout.settings as any)[setting]
            || (config.settings.layoutDefaults as any)[setting];
    }

    function getDefaultLayout(moderator: boolean, isMobile?: boolean): BuiltAtlasLayout {
        var searchForLayout = getAllLayoutsByMode(moderator)
            .filter(layout => isMobile === layout.isMobile || (!layout.isMobile))[0];
        return searchForLayout;
    }

    function getLayout(layoutName: string | null): BuiltAtlasLayout | undefined {
        return !layoutName ? undefined : getAllLayouts().filter(layout => layout.name === layoutName)[0];
    }

    function getSubLayoutByCommunityName(layoutName: string | null): BuiltAtlasLayout | undefined {
        return !layoutName ? undefined : getAllLayouts().filter(layout => layout.subLayoutCommunityName === layoutName)[0];
    }

    function getMainLayoutByName(layoutName: string | null): BuiltAtlasLayout | undefined {
        return !layoutName ? undefined : (<BuiltAtlasLayout>config.layout.layouts
            .filter(layout => layout.name === layoutName && ((layout as any)).settings)[0]);
    }

    function getLayoutName(layoutName: string | null): string | undefined {
        return getLayout(layoutName)?.name;
    }

    function getClusterByName(clusterName: string | undefined): ClusterConfig {
        return config.clusters.filter(cluster => cluster.name === clusterName)[0];
    }

    function getClusterByCommunity(community: string): ClusterConfig {
        return config.clusters.filter(cluster => cluster.community === community)[0];
    }

    function identifyClusters(community: string, currentLayoutName: string) {
        const currentLayout = config.getLayout(currentLayoutName);
        if (!currentLayoutName || !currentLayout) {
            return {};
        }
        const clusterByCommunity = config.getClusterByCommunity(community);
        const clusterByCommunityLayout = currentLayout.groups.main
            .filter(group => group.underlay && group.underlay.indexOf(clusterByCommunity?.name) != -1)[0]
            || currentLayout.groups.hidden?.filter(group => group.underlay && group.underlay.indexOf(clusterByCommunity?.name) != -1)[0];
        const normalClusterByDetailedName = currentLayout.groups.main.filter(group => group.overlay && group.overlay.indexOf(clusterByCommunity?.name) != -1)[0];
        const hiddenClusterByDetailedName = currentLayout.groups.hidden?.filter(group => group.overlay && group.overlay.indexOf(clusterByCommunity?.name) != -1)[0];
        const mainClusterByDetailedName = normalClusterByDetailedName?.name || hiddenClusterByDetailedName?.name;
        const mainGroupByLayoutName = currentLayout.groups.main.filter(group => group.name === clusterByCommunity?.name)[0]
        const hiddenGroupByLayoutName = currentLayout.groups.hidden?.filter(group => group.name === clusterByCommunity?.name)[0];
        const clusterByLayoutName = mainGroupByLayoutName?.name || hiddenGroupByLayoutName?.name;
        const superClusterOnlyName = clusterByCommunityLayout?.underlay;
        let mainCluster = mainClusterByDetailedName ? config.getClusterByName(mainClusterByDetailedName)
            : superClusterOnlyName ? undefined
                : config.getClusterByName(clusterByLayoutName);
        const superClusterByMain = currentLayout.groups.main
            .filter(group => group.underlay && group.name === mainCluster?.name)[0]?.underlay
            || currentLayout.groups.hidden?.filter(group => group.underlay && group.name === mainCluster?.name)[0]?.underlay;
        const superCluster = superClusterOnlyName
            ? config.getClusterByName(superClusterOnlyName[0])
            : config.getClusterByName(superClusterByMain && superClusterByMain[0]);
        const detailedCluster = mainClusterByDetailedName !== undefined ? clusterByCommunity : undefined;

        let mainClusterChildren: string[] | undefined;
        if (mainCluster?.name === normalClusterByDetailedName?.name) {
            mainClusterChildren = normalClusterByDetailedName?.overlay?.map(name => getClusterByName(name)?.community);
        }

        if (mainCluster?.name === hiddenClusterByDetailedName?.name) {
            mainClusterChildren = hiddenClusterByDetailedName?.overlay?.map(name => getClusterByName(name)?.community);
        }

        //dirty hack for empty overlay nebulas in sub_config
        if (!mainCluster && currentLayout.isSubLayout && currentLayout.name.startsWith('peacock_')) {
            mainCluster = config.getClusterByCommunity(currentLayout.name.split("_")[1]);
        }

        return { detailedCluster, mainCluster, superCluster, mainClusterChildren }
    }

    function getNodeColor(community: string, currentLayoutName: string, useSubclusterOverlay: boolean): string {
        const { detailedCluster, mainCluster, superCluster } = identifyClusters(community, currentLayoutName);
        if (useSubclusterOverlay && detailedCluster) {
            return detailedCluster.color;
        } else {
            return mainCluster?.color || superCluster?.color || "#aaaaaa";
        }
    }

    const config = {
        ...configJson,
        configVersion,
        json: importedJson,
        getSubLayoutByCommunityName: getSubLayoutByCommunityName,
        getLayoutSetting: getLayoutSetting,
        getAllLayouts: getAllLayouts,
        getAllLayoutsByMode: getAllLayoutsByMode,
        getDefaultLayout: getDefaultLayout,
        getLayout,
        getLayoutName,
        getClusterByName,
        getClusterByCommunity,
        identifyClusters,
        getNodeColor,
        includedClusters: includedClusters,
        overlayLayouts: overlayLayouts,
        maxEdgesOverrides: maxEdgesOverrides,
        toBeExcludedCommunities: toBeExcludedCommunities,
        toBeIncludedTemplates: toBeIncludedTemplates,
        hiddenClusters: hiddenClusters,
        clusterRepresentatives: clusterRepresentatives,
    }

    return config;
}

const mainConfig = buildConfig(importedJson);
const subLayoutsConfig = buildConfig(importedSubLayoutsJson);

const getConfig = (isSublayout: boolean) => {
    return isSublayout ? subLayoutsConfig : mainConfig;
}

export { getConfig }