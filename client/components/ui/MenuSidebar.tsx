"use client";

import {ReactNode, useEffect, useState} from "react";
import {YumeMenuDest} from "@/components/MenuPortal";

export default function MenuSidebar() {
    const [content, setContent] = useState<ReactNode | undefined>(undefined);

    useEffect(() => {
        function updateSidebar() {
            const sidebarWidth = 320;
            const screenWidth = window.innerWidth;
            const preferWidth = 1920
            if (screenWidth >= preferWidth) {
                const left = ((screenWidth - 1600) / 2) - (sidebarWidth / 2);
                setContent(
                    <aside className={"absolute pt-[4rem] w-80 h-screen left-0 top-0 overflow-y-scroll"}
                           style={{transform: `translate(${left}px, 0px)`}}>
                        <YumeMenuDest/>
                    </aside>
                )
            } else {
                setContent(undefined)
            }
        }

        updateSidebar();
        window.addEventListener("resize", updateSidebar);

        return () => window.removeEventListener("resize", updateSidebar);
    }, []);

    return content
}