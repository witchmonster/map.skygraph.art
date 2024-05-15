import { useEffect, useState, useRef } from "react";
import { BskyAgent } from '@atproto/api'
const bsky = new BskyAgent({
    service: 'https://bsky.social'
})

const password = process.env.BSKY_APP_PASSWORD
const identifier = process.env.BSKY_IDENTIFIER

export function useTokenExpiration(onTokenRefreshRequired: Function) {
    const clearAutomaticRefresh = useRef<number>();
    const [tokenExpiration, setTokenExpiration] = useState<Date>();

    // const getAvatarURL = async (node: string) => {
    //     const response = await bsky.getProfile({
    //       actor: graph?.getNodeAttribute(node, "did")
    //     });
    //     setAvatarURI(response.data.avatar);
    //   }
    //   const getAvatarMootsAvatarUrls = async (list: MootNode[], setList: React.Dispatch<SetStateAction<MootNode[]>>) => {
    //     list.forEach(async (node) => {
    //       const response = await bsky.getProfile({
    //         actor: graph?.getNodeAttribute(node, "did")
    //       });
    //       node.avatarUrl = response.data.avatar;
    //     });
    //     setList(list);
    //   }

    // useEffect(() => {
    // if (accessJwt === "") {
    //     async function loginBskyClient() {
    //         const response = await bsky.login({
    //             identifier: identifier || "",
    //             password: password || ""
    //         })
    //         setAccessJwt(`${response.data.accessJwt}`);
    //         setRefreshJwt(`${response.data.refreshJwt}`)
    //     }
    //     try {
    //         loginBskyClient();
    //     } catch {
    //         console.log("login failed");
    //     }
    // }
    // }, [onTokenRefreshRequired, tokenExpiration]);

    // useEffect(() => {
    //   if (accessJwt !== "" && selectedCommunity && communityList) {
    //     // getAvatarMootsAvatarUrls(communityList, setCommunityList);
    //   }
    // }, [communityList, selectedCommunity, accessJwt]);

    // useEffect(() => {
    //   if (accessJwt !== "" && selectedNode) {
    //     console.log(`accessJwt = ${accessJwt}`);
    //     if (mootList) {
    //       // getAvatarMootsAvatarUrls(mootList, setMootList);
    //     }
    //     // getAvatarURL(selectedNode);
    //   }
    // }, [selectedNode, accessJwt]);

    // useEffect(() => {
    //     // get a new access token with the refresh token when it expires
    //     if (tokenExpiration instanceof Date && !isNaN(tokenExpiration.valueOf())) {
    //         const now = new Date();
    //         const triggerAfterMs = tokenExpiration.getTime() - now.getTime();

    //         clearAutomaticRefresh.current = window.setTimeout(async () => {
    //             onTokenRefreshRequired();
    //         }, triggerAfterMs);
    //     }

    //     return () => {
    //         window.clearTimeout(clearAutomaticRefresh.current);
    //     };
    // }, [onTokenRefreshRequired, tokenExpiration]);

    const clearAutomaticTokenRefresh = () => {
        window.clearTimeout(clearAutomaticRefresh.current);
        setTokenExpiration(undefined);
    };

    return {
        clearAutomaticTokenRefresh,
        setTokenExpiration,
    };
}