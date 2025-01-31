import {Button, useDisclosure} from "@nextui-org/react";
import Bot, {putBot} from "@/lib/data/bot/Bot";
import BaseSelectModal from "@/components/ui/base/BaseSelectModal";
import LoreBook from "@/lib/data/lore/LoreBook";

export default function LoreSelectButtonWithModal({bot, setBot}: { bot: Bot, setBot: (bot: Bot) => void }) {

    const disclosure = useDisclosure()

    return (<>
        <Button onPress={disclosure.onOpen}>로어북 연결하기</Button>
        <BaseSelectModal disclosure={disclosure} displayName={'로어북'} endpoint={'lorebook?'}
                         onSelect={async (lore_book: LoreBook) => {
                             setBot(await putBot(bot.id, {
                                 lore_book_id: lore_book.id,
                             }))
                             disclosure.onClose()
                         }} generateBox={(lore_book: LoreBook) => (
            <div className={"flex-1 flex flex-row items-center gap-4"}>
                <span>{lore_book.name}</span>
            </div>)}/>
    </>)
}