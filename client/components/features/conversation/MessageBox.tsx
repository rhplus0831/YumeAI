import YumeAvatar from "@/components/ui/YumeAvatar";
import {buildImageLink} from "@/lib/api-client";
import {Card, CardBody} from "@nextui-org/card";

export default function MessageBox({message, name, profileImageId}: {
    message: string,
    name: string | undefined,
    profileImageId: string | undefined
}) {
    return <article className={"flex flex-row gap-2"}>
        <YumeAvatar className={"min-w-[40px] min-h-[40px]"} src={buildImageLink(profileImageId, "avatar")}/>
        <div className={`flex flex-col gap-1`}>
            <span>{name}</span>
            <Card className={'w-fit'}>
                <CardBody>
                    <p className={"whitespace-pre-wrap"}>{message}</p>
                </CardBody>
            </Card>
        </div>
    </article>
}