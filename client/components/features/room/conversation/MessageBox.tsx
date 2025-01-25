import YumeAvatar from "@/components/ui/YumeAvatar";
import {ReactNode} from "react";
import {buildImageLink} from "@/lib/data/Image";

export default function MessageBox({message, name, profileImageId, extraNode}: {
    message: ReactNode,
    name: string | undefined,
    profileImageId: string | undefined,
    extraNode?: React.ReactNode
}) {
    return <article className={"flex flex-row gap-2"}>
        <YumeAvatar className={"min-w-[40px] min-h-[40px]"} src={buildImageLink(profileImageId, "avatar")}/>
        <div className={`flex flex-col gap-2`}>
            <div className={"flex flex-row gap-2 items-center"}>
                <span>{name}</span>
                {extraNode}
            </div>
            {message}
        </div>
    </article>
}