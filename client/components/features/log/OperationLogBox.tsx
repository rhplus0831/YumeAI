import OperationLog from "@/lib/data/OperationLog";
import {Divider} from "@nextui-org/react";

export default function OperationLogBox({log}: { log: OperationLog }) {
    return <div className={"flex flex-col gap-2"}>
        <span className={"text-lg"}>{log.title}</span>
        <Divider/>
        <span className={"whitespace-pre-line"}>{log.message}</span>
    </div>
}