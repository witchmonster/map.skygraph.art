import { FC, Dispatch, SetStateAction } from "react";
import { MultiDirectedGraph } from "graphology";
import { getTranslation, getTranslationWithOverride } from "../common/translation";
import { getConfig } from '../common/visualConfig';
import { CustomSearch } from "./CustomSearch";
import { SetURLSearchParams } from "react-router-dom";
import LayoutMenu from "./LayoutMenu"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCaretUp, faCaretDown } from '@fortawesome/free-solid-svg-icons'
import { BuiltAtlasLayout } from "../../exporter/src/common/model";

interface MenuProps {
    isMobile: boolean;
    viewPort: { width: number, height: number };
    selectedNodeCount: number;
    userCount: number;
    selectedNodeEdges: string[] | null;
    edgeCount: number;
    graph: MultiDirectedGraph | null;
    showMootList: boolean;
    layout: BuiltAtlasLayout;
    currentLanguage: string;
    searchParams: URLSearchParams;
    setSearchParams: SetURLSearchParams;
    setLoading: Dispatch<SetStateAction<boolean>>;
    useSubclusterOverlay: boolean;
    setUseSubclusterOverlay: Dispatch<SetStateAction<boolean>>;
    setGraphShouldUpdate: Dispatch<SetStateAction<boolean>>;
    showHiddenClusters: boolean;
    setShowHiddenClusters: Dispatch<SetStateAction<boolean>>;
    showSecondDegreeNeighbors: boolean;
    setShowSecondDegreeNeighbors: Dispatch<SetStateAction<boolean>>;
    showClusterLabels: boolean;
    setShowClusterLabels: Dispatch<SetStateAction<boolean>>;
    legend: boolean;
    setLegend: Dispatch<SetStateAction<boolean>>;
    moderator: boolean;
    hideMenu: boolean;
    setHideMenu: Dispatch<SetStateAction<boolean>>;
}

const Menu: FC<MenuProps> = ({
    isMobile,
    viewPort,
    selectedNodeCount,
    userCount,
    selectedNodeEdges,
    edgeCount,
    graph,
    showMootList,
    layout,
    currentLanguage,
    searchParams,
    setSearchParams,
    setLoading,
    useSubclusterOverlay,
    setUseSubclusterOverlay,
    setGraphShouldUpdate,
    showHiddenClusters,
    setShowHiddenClusters,
    showSecondDegreeNeighbors,
    setShowSecondDegreeNeighbors,
    showClusterLabels,
    setShowClusterLabels,
    legend,
    setLegend,
    moderator,
    hideMenu,
    setHideMenu
}) => {
    const hiddenClusters = getConfig(layout.isSubLayout).hiddenClusters.get(layout.name);
    return (
        <div className="
        xs:bottom-11 mobile:bottom-11 mobile:left-0 mobile:right-0 mobile:w-full mobile:h-3/7
        desktop:left-1/2 desktop:bottom-14 desktop:transform desktop:-translate-x-1/2 desktop:w-[35rem]
        z-40 fixed">
            <div className={`${hideMenu ? 'xs:-mt-8 mobile:-mt-6 desktop:-mt-4' : 'mt-1'} fixed right-2 left:1/2`}>
                <button
                    type="button"
                    onClick={() => {
                        setHideMenu(!hideMenu);
                        searchParams.set('hm', `${!hideMenu}`);
                        setSearchParams(searchParams);
                    }}
                    className={
                        `relative inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold text-white shadow-sm  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2` +
                        " bg-gray-400 hover:bg-gray-500 focus-visible:ring-green-500"
                    }
                >
                    {hideMenu ? <FontAwesomeIcon icon={faCaretUp} /> : <FontAwesomeIcon icon={faCaretDown} />}
                </button>
            </div>
            {!hideMenu && (
                <div className="bg-white shadow desktop:rounded-lg py-1">
                    {/* <div className="xs:hidden"> */}
                    <dl className="mx-auto mobile:-mt-1 xs:-mb-0 mobile:-mb-1 grid gap-px grid-cols-2">
                        <div className="flex flex-col mobile:-ml-2 desktop:-ml-4 items-baseline bg-white text-center">
                            <dt className="desktop:text-sm mobile:4-mt-0 text-xs font-medium leading-6 text-gray-500 ml-auto mr-auto mt-1">
                                <span className="hidden desktop:inline-block">{getTranslation('represented', currentLanguage)}{" "}</span>{" "}{getTranslationWithOverride({ key: 'users', language: currentLanguage, layout })}
                            </dt>
                            <dd className="desktop:text-3xl mobile:text-lg xs:text-sm mobile:-mt-2 mr-auto ml-auto text-lg font-bold leading-10 tracking-tight text-gray-900">
                                {selectedNodeCount >= 0
                                    ? selectedNodeCount.toLocaleString()
                                    : userCount.toLocaleString()}
                            </dd>
                        </div>
                        <div className="flex flex-col mobile:-ml-8 desktop:-ml-16 items-baseline bg-white text-center">
                            <dt className="desktop:text-sm mobile:-mt-0 text-xs font-medium leading-6 text-gray-500 ml-auto mr-auto mt-1">
                                <span className="hidden desktop:inline-block">{getTranslation('represented', currentLanguage)}{" "}</span>{" "}{getTranslationWithOverride({ key: 'interactions', language: currentLanguage, layout })}
                            </dt>
                            <dd className="desktop:text-3xl mobile:text-lg xs:text-sm mobile:-mt-2 mr-auto ml-auto text-lg font-bold leading-10 tracking-tight text-gray-900">
                                {selectedNodeEdges
                                    ? selectedNodeEdges.length.toLocaleString()
                                    : edgeCount.toLocaleString()}
                            </dd>
                        </div>
                    </dl>
                    {/* </div> */}
                    <div className="table px-2 xs:py-0 mobile:py-1 py-2 desktop:p-3 w-full">
                        <div className="table-row-group">
                            <div className="table-row">
                                <div className="table-cell w-5/12">
                                    <div className="flex flex-row">
                                        <div className="flex h-8 desktop:h-10 xs:ml-0 mobile:ml-2 desktop:ml-6 items-center">
                                            <CustomSearch
                                                isMobile={isMobile}
                                                layout={layout}
                                                viewPort={viewPort}
                                                currentLanguage={currentLanguage}
                                                onLocate={(node) => {
                                                    const nodeLabel = graph?.getNodeAttribute(node, "label");
                                                    searchParams.set('s', `${nodeLabel}`)
                                                    if (showMootList) {
                                                        searchParams.set('ml', `${showMootList}`);
                                                    }
                                                    setSearchParams(searchParams);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="table-cell xs:w-0 mobile:w-0 desktop:w-0">
                                    {/* empty */}
                                </div>
                                <div className="table-cell w-6/12">
                                    <div className="flex flex-row">
                                        <div className="flex h-3 desktop:h-4 xs:ml-1 mobile:ml-4 desktop:ml-12 items-center">
                                            <LayoutMenu
                                                layout={layout}
                                                setLoading={setLoading}
                                                setGraphShouldUpdate={setGraphShouldUpdate}
                                                searchParams={searchParams}
                                                setSearchParams={setSearchParams}
                                                moderator={moderator}
                                                currentLanguage={currentLanguage} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="table-row">
                                <div className="table-cell w-5/12">
                                    <div className="flex flex-row">
                                        <div className="flex h-6 items-center">
                                            <input
                                                id="clusterLabels"
                                                name="clusterLabels"
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                                checked={showClusterLabels}
                                                onChange={() => {
                                                    setShowClusterLabels(!showClusterLabels);
                                                    setLoading(true);
                                                    setGraphShouldUpdate(true);
                                                }}
                                            />
                                        </div>
                                        <div className="flex desktop:text-sm text-xs leading-6 pl-1 desktop:pl-3 mb-auto mt-auto mr-2">
                                            <label
                                                htmlFor="clusterLabels"
                                                className="font-medium text-gray-900"
                                            >
                                                {getTranslation('labels_of_clusters', currentLanguage, { viewPort, xs: 20, mobile: 23 })}
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="table-cell xs:w-0 mobile:w-0 desktop:w-0">
                                    {/* empty */}
                                </div>
                                <div className="table-cell w-6/12">
                                    <div className="flex flex-row">
                                        <div className="flex h-6 items-center mt-auto mb-auto">
                                            <input
                                                id="neighbors"
                                                name="neighbors"
                                                type="checkbox"
                                                className="h-4 w-4 ml-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                                checked={showSecondDegreeNeighbors}
                                                onChange={() =>
                                                    setShowSecondDegreeNeighbors(!showSecondDegreeNeighbors)
                                                }
                                            />
                                        </div>
                                        <div className="flex desktop:text-sm text-xs leading-6 pl-1 desktop:pl-3 mb-auto mt-auto mr-2">
                                            <label
                                                htmlFor="neighbors"
                                                className="font-medium text-gray-900"
                                            >
                                                {getTranslationWithOverride({ key: 'interactions_of_friends', language: currentLanguage, layout })}
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="table-row">
                                <div className="table-cell w-5/12">
                                    {getConfig(layout.isSubLayout).overlayLayouts.get(layout.name) &&
                                        <div className="flex flex-row">
                                            <div className="flex h-6 items-center">
                                                <input
                                                    id="clusterLabels"
                                                    name="clusterLabels"
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                                    checked={useSubclusterOverlay}
                                                    onChange={() => {
                                                        searchParams.set('sc', !useSubclusterOverlay ? "true" : "false")
                                                        setSearchParams(searchParams);
                                                        setUseSubclusterOverlay(!useSubclusterOverlay);
                                                        setLoading(true);
                                                        setGraphShouldUpdate(true);
                                                    }}
                                                />
                                            </div>
                                            <div className="desktop:text-sm flex text-xs leading-6 pl-1 desktop:pl-3 mb-auto mt-auto">
                                                <label
                                                    htmlFor="clusterLabels"
                                                    className="font-medium text-gray-900"
                                                >
                                                    {getTranslation('show_communities', currentLanguage, { viewPort, xs: 20, mobile: 23 })}{" "}<span className="mobile:hidden inline">{getTranslation('graph_will_refresh', currentLanguage)}</span>
                                                </label>
                                            </div>
                                        </div>}
                                </div>
                                <div className="table-cell xs:w-0 mobile:w-0 desktop:w-0">
                                    {/* empty */}
                                </div>
                                <div className="table-cell w-6/12">
                                    <div className="flex flex-row">
                                        <div className="flex h-6 items-center">
                                            <input
                                                id="clusterLabels"
                                                name="clusterLabels"
                                                type="checkbox"
                                                className="h-4 w-4 ml-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                                checked={legend}
                                                onChange={() => setLegend(!legend)}
                                            />
                                        </div>
                                        <div className="flex desktop:text-sm text-xs leading-6 pl-1 desktop:pl-3 mb-auto mt-auto mr-2">
                                            <label
                                                htmlFor="clusterLabels"
                                                className="font-medium text-gray-900"
                                            >
                                                {getTranslation('more_details', currentLanguage, { viewPort, xs: 20, mobile: 23 })}
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="table-row">
                                <div className="table-cell w-5/12">
                                    {hiddenClusters && hiddenClusters.size > 0 && <div>
                                        <div className="flex flex-row">
                                            <div className="flex h-6 items-center">
                                                <input
                                                    id="clusterLabels"
                                                    name="clusterLabels"
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                                    checked={showHiddenClusters}
                                                    onChange={() => { setLoading(true); setShowHiddenClusters(!showHiddenClusters); setGraphShouldUpdate(true); }}
                                                />
                                            </div>
                                            <div className="flex desktop:text-sm text-xs leading-6 pl-1 desktop:pl-3 mb-auto mt-auto">
                                                <label
                                                    htmlFor="clusterLabels"
                                                    className="font-medium text-gray-900"
                                                >
                                                    {getTranslation('show_hidden_clusters', currentLanguage, { viewPort, xs: 20, mobile: 23 })}{" "}<span className="mobile:hidden inline">{getTranslation('graph_will_refresh', currentLanguage)}</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>}
                                </div>
                                <div className="table-cell xs:w-0 mobile:w-0 desktop:w-0">
                                    {/* empty */}
                                </div>
                                <div className="table-cell w-5/12">

                                </div>
                            </div>

                        </div>
                    </div>
                </div >
            )
            }
        </div >
    )
}

export default Menu;