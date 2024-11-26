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
    theme
} from "@chakra-ui/react";
import {ColorModeSwitcher} from "./ColorModeSwitcher.tsx";

function App() {
    return (
        <ChakraProvider theme={theme}>
            <Container maxWidth="container.xl" minHeight="100vh" maxHeight='100vh'>
                <Flex minHeight="48px">
                    <Center>
                        <Image borderRadius='full' boxSize='32px' src="icon.png"></Image>
                        <Text marginLeft="6px" fontSize="xl">YumeAI</Text>
                        <ButtonGroup marginLeft={'16px'} size='md' variant={'ghost'} spacing={'2'}>
                            <Button>채팅</Button>
                            <Button>페르소나</Button>
                            <Button>봇</Button>
                        </ButtonGroup>
                    </Center>
                    <Spacer/>
                    <Center>
                        <ColorModeSwitcher justifySelf="flex-end"/>
                    </Center>
                </Flex>
            </Container>

        </ChakraProvider>
    )
}

export default App
