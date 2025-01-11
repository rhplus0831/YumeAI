"use client";

import {ReactNode, useEffect, useState} from "react";
import AsyncProgressButton from "@/components/ui/AsyncProgressButton";
import {Card, CardBody} from "@nextui-org/card";

export default function BaseSelectableCard<Data>({onSelect, data, generateBox}: {
    onSelect: () => Promise<void>,
    generateBox: (data: Data) => ReactNode,
    data: Data | undefined
}) {
    const [box, setBox] = useState<ReactNode>(undefined)

    useEffect(() => {
        if(!data) {
            setBox(undefined)
            return
        }

        setBox(generateBox(data))
    }, [data]);

    const [searchButton, _] = useState<ReactNode>(<AsyncProgressButton onPressAsync={async () => {
        await onSelect()
    }} className={"w-full"}>선택</AsyncProgressButton>)

    if(!box) return searchButton

    return <Card>
        <CardBody className={"flex flex-row items-center gap-4"}>
            {box}
            <div className={"flex-none"}>
                {searchButton}
            </div>
        </CardBody>
    </Card>
}