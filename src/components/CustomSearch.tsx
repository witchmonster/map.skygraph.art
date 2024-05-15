import React, { ChangeEvent, useEffect, useState, CSSProperties } from "react";
import { Attributes } from "graphology-types";
import { getTranslation } from "../common/translation";
import { useRegisterEvents, useCamera, useSigma } from "@react-sigma/core";
import { CommunitiesNode, SearchNode } from "../model";
import { Trie } from "../common/trie";
import { BuiltAtlasLayout } from "../../exporter/src/common/model";
import { getConfig } from "../common/visualConfig";

type SearchLabelKeys = "text" | "placeholder";

const optout = getConfig(false).optout;

/**
 * Properties for `SearchControl` component
 */
export interface SearchControlProps {
  isMobile: boolean;

  layout: BuiltAtlasLayout;

  viewPort: { width: number, height: number }
  /**
   * HTML id
   */
  id?: string;

  /**
   * HTML class
   */
  className?: string;

  /**
   * HTML CSS style
   */
  style?: CSSProperties;

  currentLanguage: string;

  /**
   * Map of the labels we use in the component.
   * This is usefull for I18N
   */
  labels?: { [Key in SearchLabelKeys]?: string };

  onLocate?: (nodeId: string) => void;
}

/**
 * The `SearchControl` create an input text where user can search a node in the graph by its label.
 * There is an autocomplete based on includes & lower case.
 * When a node is found, the graph will focus on the highlighted node
 *
 * ```jsx
 * <SigmaContainer>
 *   <ControlsContainer>
 *     <SearchControl />
 *   </ControlsContainer>
 * </SigmaContainer>
 * ```
 * See [[SearchControlProps]] for more information.
 *
 * @category Component
 */

function getUniqueKey(): string {
  return Math.random().toString(36).slice(2);
}

export const CustomSearch: React.FC<SearchControlProps> = ({
  isMobile,
  layout,
  viewPort,
  id,
  className,
  style,
  currentLanguage,
  labels = {},
  onLocate,
}: SearchControlProps) => {
  // Get sigma
  const sigma = useSigma();
  // Get event hook
  const registerEvents = useRegisterEvents();
  // Get camera hook
  const { goto: cameraGoTo } = useCamera();
  // Search value
  const [search, setSearch] = useState<string>("");
  // Datalist values
  const [values, setValues] = useState<Map<string, { id: string, label: string }>>(new Map());
  // Selected
  const [selected, setSelected] = useState<string | null>(null);
  // random id for the input
  const [inputId, setInputId] = useState<string>("");


  //pre-loaded
  const [communitiesLoaded, setCommunitiesLoaded] = useState<boolean>(false);
  const [communitiesMap, setCommunitiesMap] = useState<Map<string, string>>(new Map());
  const [prefixesLoaded, setPrefixesLoaded] = useState<boolean>(false);
  const [prefixExistsMap, setPrefixExistsMap] = useState<Map<string, boolean>>(new Map());

  //cache
  const [prefixSearchMapLoaded, setPrefixSearchMapLoaded] = useState<Map<string, boolean>>(new Map());
  // const [handleTrieByPrefix, setHandleTrieByPrefix] = useState<Map<string, Trie>>(new Map());
  const [cachedSearchMapByPrefix, setCachedSearchMapByPrefix] = useState<Map<string, Map<string, SearchNode>>>(new Map());

  //loaded on the fly
  const [handleSearchMap, setHandlesSearchMap] = useState<Map<string, SearchNode>>(new Map());

  async function fetchCommunities() {
    let responseJSON: {
      nodes: CommunitiesNode[]
    };
    if (layout?.search && layout.search.communitiesFile) {
      const textGraph = await fetch("./exporter/out/search/" + layout.search.outDir + "/" + layout.search.communitiesFile);
      responseJSON = await textGraph.json();
      responseJSON.nodes.forEach(node => {
        communitiesMap.set(node.community, node.name);
      });
      if (responseJSON) {
        setCommunitiesMap(communitiesMap);
        setCommunitiesLoaded(true);
      }
    }
  }

  async function fetchPrefixes() {
    let responseJSON: {
      nodes: string[]
    };
    if (layout?.search && layout.search.prefixesFile) {
      const textGraph = await fetch("./exporter/out/search/" + layout.search.outDir + "/" + layout.search.prefixesFile);
      responseJSON = await textGraph.json();
      responseJSON.nodes.forEach(node => {
        prefixExistsMap.set(node, true);
      });
      if (responseJSON) {
        setPrefixExistsMap(prefixExistsMap);
        setPrefixesLoaded(true);
      }
    }
  }

  async function fetchSearch(search: string) {
    const prefix = search.substring(0, 3);
    let responseJSON: {
      graphVersion: number;
      nodes: SearchNode[]
    };

    if (layout?.search) {
      try {
        const textGraph = await fetch("./exporter/out/search/" + layout.search.outDir + "/"
          + layout.search.searchFileNamePrefix
          + layout.search.searchFileNameDelimiter
          + prefix
          + layout.search.searchFileNameExtension
        );
        responseJSON = await textGraph.json();
        if (responseJSON) {
          const handleToCommunities = new Map();
          const handleTrie = new Trie();
          responseJSON.nodes.forEach(node => {
            handleToCommunities.set(node.handle, node);
            handleTrie.insert(node.handle);
          });

          cachedSearchMapByPrefix.set(prefix, handleToCommunities);
          // handleTrieByPrefix.set(prefix, handleTrie);
          setCachedSearchMapByPrefix(cachedSearchMapByPrefix);
          // setHandleTrieByPrefix(handleTrieByPrefix);
          prefixSearchMapLoaded.set(prefix, true);
          setPrefixSearchMapLoaded(prefixSearchMapLoaded);
        }
      } catch (err) {
        //search failed
      }
    }
  }

  async function fetchCachedSearch(search: string) {
    const prefix = search.substring(0, 3);

    //put it in trie instead
    const searchMapByPrefix = cachedSearchMapByPrefix.get(prefix);

    if (searchMapByPrefix) {
      const newSearchMap = new Map();
      // const found = handleTrieByPrefix.get(prefix)?.search(search);
      // if (found) {
      //   newSearchMap.set(found, searchMapByPrefix.get(search))
      // }


      searchMapByPrefix.forEach((value) => {
        if (value.handle.startsWith(search)
          && optout?.filter(opt => opt.handle === value.handle).length === 0
        ) {
          newSearchMap.set(value.handle, value);
        }
      });

      setHandlesSearchMap(newSearchMap);
    }
  }

  /**
   * When component mount, we set a random input id.
   */
  useEffect(() => {
    setInputId(`search-${getUniqueKey()}`);
  }, []);

  //pre-load
  useEffect(() => {
    if (!communitiesLoaded) {
      fetchCommunities();
    }
    if (!prefixesLoaded) {
      fetchPrefixes();
    }
  }, [communitiesLoaded, prefixesLoaded]);

  useEffect(() => {
    const prefix = search.substring(0, 3);
    const prefixExists = prefixExistsMap.get(prefix);
    if (search && search.length >= 3 && prefixExists && !prefixSearchMapLoaded.get(prefix)) {
      fetchSearch(search);
    }
    if (search && search.length >= 5 && prefixExists && prefixSearchMapLoaded.get(prefix)) {
      fetchCachedSearch(search);
    }
  }, [search, prefixSearchMapLoaded]);

  /**
   * When the search input changes, recompute the autocomplete values.
   */
  useEffect(() => {
    const newValues: Map<string, { id: string, label: string }> = new Map();
    if (!selected && search.length >= 5) {
      if (layout?.search) {
        const foundValues: Map<string, string> = new Map();
        handleSearchMap.forEach((node, key) => {
          if (
            key &&
            key.toLowerCase().startsWith(search.toLowerCase())
          ) {
            node.communities.forEach(community => {
              const communityName = communitiesMap.get(community);
              if (communityName && !foundValues.get(communityName)) {
                foundValues.set(communityName, key);
              }
            })
          }
        });
        sigma
          .getGraph()
          .forEachNode((key: string, attributes: Attributes): void => {
            foundValues.forEach((user, name) => {
              if (
                attributes.label &&
                attributes.label.toLowerCase().includes(name.toLowerCase())
              )
                if (!newValues.get(key)) {
                  newValues.set(key, { id: key, label: user + ":" + name });
                }
            });
          });
      } else {
        sigma
          .getGraph()
          .forEachNode((key: string, attributes: Attributes): void => {
            if (
              attributes.label
              && attributes.label.toLowerCase().includes(search.toLowerCase())
              && optout?.filter(opt => opt.handle === attributes.label).length === 0
            )
              if (!newValues.get(key)) {
                newValues.set(key, { id: key, label: attributes.label });
              }
          });
      }
    }
    setValues(newValues);
  }, [search]);

  /**
   * When use clik on the stage
   *  => reset the selection
   */
  useEffect(() => {
    registerEvents({
      clickStage: () => {
        setSelected(null);
        setSearch("");
      },
    });
  }, [registerEvents]);

  /**
   * When the selected item changes, highlighted the node and center the camera on it.
   */
  useEffect(() => {
    if (!selected) {
      return;
    }

    if (onLocate) {
      onLocate(selected);
    }

    sigma.getGraph().setNodeAttribute(selected, "highlighted", true);

    const nodeDisplayData = sigma.getNodeDisplayData(selected);

    document.getElementById(inputId)?.blur();

    cameraGoTo({
      x: nodeDisplayData && nodeDisplayData.x,
      y: nodeDisplayData && nodeDisplayData.y,
      ratio: 0.1,
    });

    return () => {
      sigma.getGraph().setNodeAttribute(selected, "highlighted", false);
    };
  }, [selected]);

  /**
   * On change event handler for the search input, to set the state.
   */
  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const searchString = e.target.value;
    const valueItem = Array.from(values.values()).find((value) => value.label === searchString);
    if (valueItem) {
      setSearch(valueItem.label);
      setValues(new Map());
      setSelected(valueItem.id);
    } else {
      setSelected(null);
      setSearch(searchString);
    }
  };

  // Common html props for the div
  const htmlProps = {
    className: `react-sigma-search ${className ? className : ""}`,
    id,
    style,
  };

  return (
    <div {...htmlProps} className="w-full">
      <label htmlFor={inputId} style={{ display: "none" }}>
        {labels["text"] || "Search a node"}
      </label>
      <input
        id={inputId}
        type="text"
        className="block w-full text-xs xs:max-w-36 mobile:max-w-48 desktop:max-w-80 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 desktop:text-sm pl-3"
        placeholder={labels["placeholder"] || getTranslation('search_for_a_handle', currentLanguage, { viewPort, xs: 17 })}
        list={`${inputId}-datalist`}
        value={search}
        onChange={onInputChange}
      />
      <datalist id={`${inputId}-datalist`}>
        {Array.from(values.values()).map((value: { id: string; label: string }) => (
          <option key={value.id} value={value.label}>
            {value.label}
          </option>
        ))}
      </datalist>
    </div>
  );
};
