import * as React from "react"
import {
    Button,
    ButtonGroup,
    Center,
    ChakraProvider,
    Container,
    Flex,
    Image,
    Spacer,
    Text,
    theme,
} from "@chakra-ui/react"
import {ColorModeSwitcher} from "./ColorModeSwitcher"
import PersonaAppContainer from "./Model/Persona/PersonaAppContainer";
import RoomAppContainer from "./Model/Room/RoomAppContainer";
import BotAppContainer from "./Model/Bot/BotAppContainer";

export default function App() {
    const roomContainer = (<RoomAppContainer />)
    const personaContainer = (<PersonaAppContainer />)
    const botContainer = (<BotAppContainer />)

    const [usingContainer, setUsingContainer] = React.useState<React.ReactElement>(roomContainer)

    return (
        <ChakraProvider theme={theme}>
            <Container minWidth="container.xl" maxWidth="container.xl" minHeight="100vh" maxHeight='100vh'>
                <Flex minHeight="48px">
                    <Center>
                        <Image borderRadius='full' boxSize='32px' src="icon.png"></Image>
                        <Text marginLeft="6px" fontSize="xl">YumeAI</Text>
                        <ButtonGroup marginLeft={'16px'} size='md' variant={'ghost'} spacing={'2'}>
                            <Button onClick={() => {
                                setUsingContainer(roomContainer)
                            }}>채팅</Button>
                            <Button onClick={() => {
                                setUsingContainer(personaContainer)
                            }}>페르소나</Button>
                            <Button onClick={() => {
                                setUsingContainer(botContainer)
                            }}>봇</Button>
                        </ButtonGroup>
                    </Center>
                    <Spacer/>
                    <Center>
                        <ColorModeSwitcher justifySelf="flex-end"/>
                    </Center>
                </Flex>
                {usingContainer}
            </Container>
        </ChakraProvider>
    )
}