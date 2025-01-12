"use client";

import {Button} from "@nextui-org/react";
import {useRouter} from "next/navigation";
import {ReactNode} from "react";

export default function NavigateButton({href, children}: { href: string, children: ReactNode }) {
    const router = useRouter()

    return (<Button size={"lg"} className={"w-full h-14"} onPress={() => {
        router.push(href)
    }}>
        {children}
    </Button>)
}