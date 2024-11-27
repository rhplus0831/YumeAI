import {Button, Center, Flex, Spacer, Text} from "@chakra-ui/react";
import {getAPIServer} from "../../Configure";
import Bot from "./Bot";
import YumeAvatar from "../Base/YumeAvatar.tsx";

export default function BotBox({bot, setSelectedBot, selectButtonText}: {
    bot: Bot,
    setSelectedBot: ((bot: Bot | null) => void) | null,
    selectButtonText: string | null
}) {
    return (
        <Flex margin="4px">
            <YumeAvatar objectPosition={'top'} marginRight={'6px'}
                        src={bot.profileImageId !== null ? getAPIServer() + 'image/' + bot.profileImageId : undefined}></YumeAvatar>
            <Center>
                <Text>{bot.name}({bot.displayName})</Text>
            </Center>

            <Spacer></Spacer>
            {
                selectButtonText !== null ?
                    <Center>
                        <Button onClick={() => {
                            if (setSelectedBot === null) return
                            setSelectedBot(bot)
                        }}>{selectButtonText}</Button>
                    </Center> : null
            }
        </Flex>
    )
}