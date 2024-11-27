import {Button, Center, Flex, Spacer, Text} from "@chakra-ui/react";
import {getAPIServer} from "../../Configure";
import Persona from "./Persona";
import YumeAvatar from "../Base/YumeAvatar.tsx";

export default function PersonaBox({persona, setSelectedPersona, selectButtonText}: {
    persona: Persona,
    setSelectedPersona: ((persona: Persona | null) => void) | null,
    selectButtonText: string | null
}) {
    return (
        <Flex margin="4px">
            <YumeAvatar marginRight={'6px'}
                        src={persona.profileImageId !== null ? getAPIServer() + 'image/' + persona.profileImageId : undefined}></YumeAvatar>
            <Center>
                <Text>{persona.name}({persona.displayName})</Text>
            </Center>

            <Spacer></Spacer>
            {
                selectButtonText !== null ?
                    <Center>
                        <Button onClick={() => {
                            if (setSelectedPersona === null) return
                            setSelectedPersona(persona)
                        }}>{selectButtonText}</Button>
                    </Center> : null
            }
        </Flex>
    )
}