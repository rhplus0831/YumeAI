import {Button, Center, Flex, Spacer, Text} from "@chakra-ui/react";
import Prompt from "./Prompt.ts";

export default function PromptBox({prompt, setSelectedPrompt, selectButtonText}: {
    prompt: Prompt,
    setSelectedPrompt: ((prompt: Prompt | null) => void) | null,
    selectButtonText: string | null
}) {
    return (
        <Flex margin="4px">
            <Center>
                <Text>{prompt.name}</Text>
            </Center>
            <Spacer></Spacer>
            {
                selectButtonText !== null ?
                    <Center>
                        <Button onClick={() => {
                            if (setSelectedPrompt === null) return
                            setSelectedPrompt(prompt)
                        }}>{selectButtonText}</Button>
                    </Center> : null
            }
        </Flex>
    )
}