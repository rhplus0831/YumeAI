import RoomList from "./RoomList";
import MessageList from "./Message/MessageList";
import * as React from "react";
import {Box, Grid, GridItem} from "@chakra-ui/react";
import RoomSidebar from "./RoomSidebar";
import Room from "./Room";

export default function RoomAppContainer() {
    const [selectedRoom, setSelectedRoom] = React.useState<Room | null>(null)
    const [rooms, setRooms] = React.useState<Room[]>([]);

    const changeSelectedRoom = (selectedRoom: Room) => {
        if (selectedRoom === null) return;

        const newRooms = rooms.map((item: Room) => {
            if (item.id == selectedRoom.id) {
                return selectedRoom;
            } else {
                return item;
            }
        })

        setRooms(newRooms)
        setSelectedRoom(selectedRoom)
    }

    return (
        <Box height={'calc(100vh - 64px)'}
             maxHeight={'calc(100vh - 64px)'}>
            <Grid
                gridTemplateRows={'1fr'}
                gridTemplateColumns={'300px 1fr'} h={'inherit'} maxHeight={'inherit'}>
                <GridItem w='300px' h={'inherit'} maxH={'inherit'}>
                    <RoomList rooms={rooms} setRooms={setRooms} selectedRoom={selectedRoom}
                              setSelectedRoom={setSelectedRoom}></RoomList>
                    <RoomSidebar selectedRoom={selectedRoom} setSelectedRoom={setSelectedRoom}
                                 onEdited={(data: Room) => {
                                     console.log("onEdited", data);
                                     changeSelectedRoom(data)
                                 }}
                                 onRemoved={(data: Room) => {
                                     const newRooms = rooms.filter((item: Room) => {
                                         return item.id != data.id;
                                     })
                                     setSelectedRoom(null)
                                     setRooms(newRooms)
                                 }}></RoomSidebar>
                </GridItem>
                <GridItem w='100%' h={'inherit'} maxH={'inherit'}>
                    <MessageList room={selectedRoom}></MessageList>
                </GridItem>
            </Grid>
        </Box>
    )
}