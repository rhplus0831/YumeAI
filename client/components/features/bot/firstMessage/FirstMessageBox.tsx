import FirstMessage from "@/lib/data/bot/FirstMessage";

export default function FirstMessageBox({firstMessage}: { firstMessage: FirstMessage }) {
    return (
        <div className={"flex-1 flex flex-row items-center gap-4"}>
            <span>{firstMessage.name}</span>
        </div>
    )
}