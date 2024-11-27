import {Button, Flex, Spacer, Text} from "@chakra-ui/react";
import Room from "./Room";

export default function RoomBox({room, setSelectedRoom}: { room: Room, setSelectedRoom: (room: Room | null) => void }) {
    return (
        <Flex margin="4px">
            <Text>{room.name}</Text>
            <Spacer></Spacer>
            <Button onClick={() => {
                setSelectedRoom(room)
            }}>들어가기</Button>
        </Flex>
    )
}