import {Center, Grid, GridItem, Text} from "@chakra-ui/react";
import * as React from "react";
import Message, {MessageRole} from "./Message";
import Room from "../Room";
import YumeAvatar from "../../Base/YumeAvatar.tsx";
import {getAPIServer} from "../../../Configure";

export default function MessageBox({room, message}: { room: Room | null, message: Message }) {
    const getAvatarSrc = () => {
        if (message.role === MessageRole.User) {
            if (room?.persona?.profileImageId !== undefined) {
                return getAPIServer() + 'image/' + room.persona.profileImageId
            }
        } else {
            if (room?.bot?.profileImageId !== undefined) {
                return getAPIServer() + 'image/' + room.bot.profileImageId
            }
        }
        return undefined
    }

    const getName = () => {
        if (message.role === MessageRole.User) {
            if (room?.persona !== undefined) {
                if (room.persona.displayName.trim() !== '') {
                    return room.persona.displayName
                } else {
                    return room.persona.name
                }
            }
        } else {
            if (room?.bot !== undefined) {
                if (room.bot.displayName.trim() !== '') {
                    return room.bot.displayName
                } else {
                    return room.bot.name
                }
            }
        }
    }

    return (
        <Grid templateAreas={`"icon name"
                  "icon message"`}
              gridTemplateRows={'auto auto'}
              gridTemplateColumns={'auto 1fr'}
              gap={1}
        >
            <GridItem area={'icon'}>
                <Center marginEnd={"8px"} display={'flex'}>
                    <YumeAvatar src={getAvatarSrc()}></YumeAvatar>
                </Center>
            </GridItem>
            <GridItem area={'name'}>
                <Text>
                    {getName()}
                </Text>
            </GridItem>
            <GridItem area={'message'}>
                <Text>
                    {message.text}
                </Text>
            </GridItem>
        </Grid>
    )
}