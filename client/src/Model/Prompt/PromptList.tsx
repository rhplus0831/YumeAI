import {FormControl, FormLabel, Input} from "@chakra-ui/react";
import React from "react";
import PromptBox from "./PromptBox.tsx";
import BaseList from "../Base/BaseList";
import Prompt from "./Prompt.ts";

export default function PromptList({selectedPrompt, setSelectedPrompt, prompts, setPrompts, selectButtonText}: {
    selectedPrompt: Prompt | null,
    setSelectedPrompt: (persona: Prompt | null) => void,
    prompts: Prompt[],
    setPrompts: React.Dispatch<React.SetStateAction<Prompt[]>>,
    selectButtonText: string
}) {
    const [name, setName] = React.useState("");

    return (
        <BaseList<Prompt> display={selectedPrompt === null} items={prompts} setItems={setPrompts} displayName={'프롬프트'}
                          endpoint={'prompt/'} createBox={(prompt) => (
            <PromptBox prompt={prompt} setSelectedPrompt={setSelectedPrompt} key={prompt.id}
                       selectButtonText={selectButtonText}></PromptBox>)}
                          createForm={(initialRef) => (
                              <FormControl>
                                  <FormLabel>프롬프트 이름</FormLabel>
                                  <Input ref={initialRef} value={name} onChange={(event) => {
                                      setName(event.target.value)
                                  }} placeholder='프롬프트 이름'/>
                              </FormControl>
                          )} createItemJson={() => {
            return JSON.stringify({
                'name': name,
                'prompt': '',
                'llm': 'openai',
                'llm_config': ''
            })
        }}>
        </BaseList>
    )
}