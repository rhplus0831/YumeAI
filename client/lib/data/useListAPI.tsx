import {useState} from "react";
import {api} from "@/lib/api-client";

export function useListAPI<dataType>({endpoint, limit}: { endpoint?: string, limit: number }) {
    const [items, setItems] = useState([] as dataType[]);
    const [hasMore, setHasMore] = useState(!!endpoint);
    const [isLoading, setIsLoading] = useState(false);
    const [offset, setOffset] = useState(0);

    if (!endpoint) {
        const onLoadMore = () => {
            //do not anything
        }

        return {
            items,
            loadSelf,
            hasMore,
            isLoading,
            onLoadMore,
        };
    }

    if (!endpoint.endsWith("?") && !endpoint.endsWith("&")) {
        throw Error("Endpoint must end with '?' or '&'");
    }

    const loadData = async (currentOffset: number) => {
        const controller = new AbortController();
        const {signal} = controller;

        try {
            setIsLoading(true);

            const data: dataType[] = await api(`${endpoint}offset=${currentOffset}&limit=${limit}`, {
                method: 'GET'
            })

            if (data.length === 0) {
                console.log("No more data");
                setHasMore(false);
                return;
            }

            // Append new results to existing ones
            setItems((prevItems) => [...prevItems, ...data]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const onLoadMore = () => {
        console.log("onLoadMore");
        const newOffset = offset + limit;

        setOffset(newOffset);
        loadData(newOffset);
    };

    async function loadSelf() {
        setItems([]);
        setHasMore(true);
        setOffset(0)
        await loadData(0);
    }

    return {
        items,
        loadSelf,
        hasMore,
        isLoading,
        onLoadMore,
    };
}

