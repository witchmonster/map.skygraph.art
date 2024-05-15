import { FC, Dispatch, SetStateAction } from "react";
import { getConfig } from "../common/visualConfig"
import { getTranslation, getValueByLanguage, lang2ToNames } from "../common/translation";
import { GroupLegend, ClusterConfig, BuiltAtlasLayout } from "../../exporter/src/common/model";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'

interface LegendProps {
    hideMenu: boolean;
    legend: boolean;
    setLegend: Dispatch<SetStateAction<boolean>>;
    layout: BuiltAtlasLayout;
    showHiddenClusters: boolean;
    currentLanguage: string
}

const buildLinks = (links: {
    title: string;
    url: string;
}[]) => {
    const compiledLinks: any[] = [];
    links.forEach(link => compiledLinks.push(<p className="mt-0">
        <a
            href={link.url}
            target="_blank"
            className="font-bold text-xs underline-offset-1 underline"
        > {link.title}
        </a>
    </p>))
    return <div>{compiledLinks}</div>;
}

const buildExtras = (extras: string[]) => {
    const compiledExtras: any[] = [];
    extras.forEach(extra => compiledExtras.push(<p className="mt-2">
        {extra}
    </p>))
    return <div>{compiledExtras}</div>;
}

const Legend: FC<LegendProps> = ({
    hideMenu,
    legend,
    setLegend,
    layout,
    showHiddenClusters,
    currentLanguage }) => {
    const buildLegend = (legendGroup: GroupLegend) => {
        const clusterLegends: any[] = [];
        legendGroup.clusters?.forEach(clusterName => {
            const cluster: ClusterConfig = getConfig(layout.isSubLayout).getClusterByName(clusterName);
            const hideCluster = !includedClusters.get(clusterName) //not included in the graph
                || (hiddenClusters.get(clusterName) && !showHiddenClusters); //hidden when option show all clusters is off
            if (cluster && cluster.legend && !hideCluster) {
                const legend = getValueByLanguage(cluster.legend, currentLanguage) ?? cluster.legend[getConfig(layout.isSubLayout).settings.languages[0]];
                if (legend) {
                    const clusterLegend = getValueByLanguage(cluster.legend, currentLanguage);
                    const newLegend = legend && <div>
                        {clusterLegend && clusterLegend.description && <p className="mt-4">
                            <span className="px-2 inline-flex text-xs leading-5 font-bold rounded-full"
                                style={{
                                    backgroundColor: cluster.color,
                                    color: getConfig(layout.isSubLayout).getContrastColor(cluster.color)
                                }}>
                                {cluster.label && getValueByLanguage(cluster.label, currentLanguage)}
                            </span> - {legend.description}
                        </p>}
                        {legend.extra && <p className="mt-0">
                            {legend.extra}
                        </p>}
                        {legend.links && <p className="mt-0 mb-5">
                            {buildLinks(legend.links)}
                        </p>}
                    </div>;
                    clusterLegends.push(newLegend);
                }
            }
        });
        const legend = getValueByLanguage(legendGroup.legend, currentLanguage) ?? legendGroup.legend[getConfig(layout.isSubLayout).settings.languages[0]];
        return <div>
            <h5 className="text-sm font-semibold leading-10 text-gray-600 mt-2">{legend.label}</h5>
            <p className="mt-2">
                {legend && legend.description}
            </p>
            {legend && legend.extras && <p className="mt-0">
                {buildExtras(legend.extras)}
            </p>}
            {legend && legend.links && <p className="mt-0 mb-5">
                {buildLinks(legend.links)}
            </p>}
            {clusterLegends}
        </div>
    }

    const legendGroups: any[] = [];
    const includedClusters: Map<string, boolean> = getConfig(layout.isSubLayout).includedClusters.get(layout.name) ?? new Map();
    const hiddenClusters: Map<string, boolean> = getConfig(layout.isSubLayout).hiddenClusters.get(layout.name) ?? new Map();
    const currentLayoutLegendName = getConfig(layout.isSubLayout).getLayout(layout.name) && getConfig(layout.isSubLayout).getLayout(layout.name)?.legend;
    const currentLayoutLegend = getConfig(layout.isSubLayout).legend.legends.filter(legend => legend.name === currentLayoutLegendName)[0];
    const currentLayoutLegends: GroupLegend[] = currentLayoutLegend.groups ?? [];

    currentLayoutLegends.forEach(group => {
        const hasIncludedClusters = group.clusters && group.clusters.filter(clusterName => includedClusters.get(clusterName)
            && (showHiddenClusters || !hiddenClusters.get(clusterName))).length > 0;
        const shouldShowGroup = hasIncludedClusters && group.hide !== true;
        if (shouldShowGroup) {
            legendGroups.push(buildLegend(group));
        }
    });

    return (
        <div className="bg-white shadow desktop:rounded-md absolute
    mobile:top-1 smobile:left-0 mobile:right-0 mobile:w-full
    desktop:right-1/2 desktop:top-2 desktop:right-2 desktop:w-5/12 desktop:max-w-lg
    z-50">
            <div className="border-b divide-y divide-gray-200 border-gray-200 bg-white px-3 py-2 desktop:px-6">
                <div className="-ml-4 -mt-2 -mb-1 desktop:mt-0 flex flex-wrap items-center justify-between desktop:flex-nowrap">
                    <div className="ml-4">
                        <h3 className="text-base font-semibold leading-6 text-gray-900">
                            {getTranslation('clusters_legend', currentLanguage)}
                        </h3>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                        <button
                            type="button"
                            onClick={() => {
                                setLegend(!legend);
                            }}
                            className={
                                `relative inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold text-white shadow-sm  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2` +
                                " bg-gray-400 hover:bg-gray-500 focus-visible:ring-green-500"
                            }
                        >
                            <FontAwesomeIcon icon={faXmark} />
                        </button>
                    </div>
                </div>
                <div className={`z-50 mt-2 desktop:mt-2 text-sm text-gray-500
                ${hideMenu
                        ? 'mobile:h-[70lvh] xs:h-[73lvh]'
                        : 'mobile:h-[50lvh] xs:h-[54lvh]'}
                desktop:h-[50lvh]
                overflow-scroll`}>
                    <p className="bg-green-100 text-green-800">
                        {getTranslation('algo_note', currentLanguage)}{" "}
                        {getTranslation('available_languages', currentLanguage)}{": "}{lang2ToNames(getConfig(layout.isSubLayout).settings.languages)}
                    </p>
                    <h5 className="text-sm font-semibold leading-10 text-gray-600">
                        {getTranslation('overview_title', currentLanguage)}
                    </h5>
                    {currentLayoutLegend.overview && getValueByLanguage(currentLayoutLegend.overview, currentLanguage) &&
                        <div>
                            {getValueByLanguage(currentLayoutLegend.overview, currentLanguage).summary &&
                                <p className="mt-2">
                                    {getValueByLanguage(currentLayoutLegend.overview, currentLanguage).summary}
                                </p>}
                            {getValueByLanguage(currentLayoutLegend.overview, currentLanguage).nodes &&
                                <p className="mt-2">
                                    {getValueByLanguage(currentLayoutLegend.overview, currentLanguage).nodes}
                                </p>}
                            {getValueByLanguage(currentLayoutLegend.overview, currentLanguage).nodeWeight &&
                                <p className="mt-2">
                                    {getValueByLanguage(currentLayoutLegend.overview, currentLanguage).nodeWeight}
                                </p>}
                            {getValueByLanguage(currentLayoutLegend.overview, currentLanguage).relationships &&
                                <p className="mt-2">
                                    {getValueByLanguage(currentLayoutLegend.overview, currentLanguage).relationships}
                                </p>}
                            {getValueByLanguage(currentLayoutLegend.overview, currentLanguage).relationshipWeight &&
                                <p className="mt-2">
                                    {getValueByLanguage(currentLayoutLegend.overview, currentLanguage).relationshipWeight}
                                </p>}
                            {getValueByLanguage(currentLayoutLegend.overview, currentLanguage).overview_red_arrows &&
                                <p className="mt-2">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">{getTranslation('red_arrows', currentLanguage)}</span> - {getValueByLanguage(currentLayoutLegend.overview, currentLanguage).overview_red_arrows}.
                                </p>}
                            {getValueByLanguage(currentLayoutLegend.overview, currentLanguage).overview_blue_arrows &&
                                <p className="mt-2">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">{getTranslation('blue_arrows', currentLanguage)}</span> - {getValueByLanguage(currentLayoutLegend.overview, currentLanguage).overview_blue_arrows}.
                                </p>}
                            <h5 className="text-sm font-semibold leading-10 text-gray-600">
                                {getTranslation('algo', currentLanguage)}
                            </h5>
                            {getValueByLanguage(currentLayoutLegend.overview, currentLanguage).algo &&
                                <p className="mt-2">
                                    {getValueByLanguage(currentLayoutLegend.overview, currentLanguage).algo}
                                </p>}
                        </div>}
                    <h5 className="text-sm font-semibold leading-10 text-gray-600">
                        {getTranslation('overview_clusters', currentLanguage)}
                    </h5>
                    {legendGroups}
                </div>
            </div>
        </div>
    )
}

export default Legend;