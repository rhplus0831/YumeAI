import YumeAvatar from "@/components/ui/YumeAvatar";
import {buildImageLink} from "@/lib/api-client";
import {Card, CardBody} from "@nextui-org/card";

export default function MessageBox({message, name, profileImageId, extraNode}: {
    message: string,
    name: string | undefined,
    profileImageId: string | undefined,
    extraNode?: React.ReactNode
}) {
    return <article className={"flex flex-row gap-2"}>
        <YumeAvatar className={"min-w-[40px] min-h-[40px]"} src={buildImageLink(profileImageId, "avatar")}/>
        <div className={`flex flex-col gap-1`}>
            <div className={"flex flex-row gap-2 items-center"}>
                <span>{name}</span>
                {extraNode}
            </div>
            <Card className={'w-fit'}>
                <CardBody>
                    <p className={"whitespace-pre-wrap"}>{message.trim()}</p>
                </CardBody>
            </Card>
        </div>
    </article>
}