import {FormControl, FormLabel, Input} from "@chakra-ui/react";
import React from "react";
import RoomBox from "./RoomBox";
import BaseList from "../Base/BaseList";
import Room from "./Room";

export default function RoomList({rooms, setRooms, selectedRoom, setSelectedRoom}: {
    rooms: Room[],
    setRooms: React.Dispatch<React.SetStateAction<Room[]>>,
    selectedRoom: Room | null,
    setSelectedRoom: (id: Room | null) => void
}) {


    const initialRef = React.useRef(null)
    const [name, setName] = React.useState("");

    return (
        <BaseList<Room> display={selectedRoom === null} displayName={'방'} endpoint={'room/'}
                        createBox={(room) => (<RoomBox setSelectedRoom={setSelectedRoom} room={room}></RoomBox>)}
                        createForm={() => (<FormControl>
                            <FormLabel>방 이름</FormLabel>
                            <Input ref={initialRef} value={name} onChange={(event) => {
                                setName(event.target.value)
                            }} placeholder='대화방 이름'/>
                        </FormControl>)} createItemJson={() => {
            return JSON.stringify({'name': name})
        }} items={rooms} setItems={setRooms}></BaseList>
    )
}