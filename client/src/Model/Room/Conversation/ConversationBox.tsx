import MessageBox from "./MessageBox.tsx";
import Conversation from "./Conversation.ts";
import Room from "../Room.ts";
import {TriangleDownIcon} from "@chakra-ui/icons";
import {Box} from "@chakra-ui/react";

export default function ConversationBox({room, conversation}: {room: Room | null, conversation: Conversation}) {
    return (
        <>
            {conversation.user_message ? <MessageBox message={conversation.user_message} name={room?.persona?.displayName} profileImageId={room?.persona?.profileImageId}></MessageBox> : ""}
            {conversation.assistant_message ? <>
                <Box marginY={'8px'} display={'flex'} justifyContent={'center'} alignItems={'center'}>
                    <TriangleDownIcon></TriangleDownIcon>
                </Box>
                <MessageBox message={conversation.assistant_message} name={room?.bot?.displayName} profileImageId={room?.bot?.profileImageId}></MessageBox>
            </> : ""}
        </>
    )
}