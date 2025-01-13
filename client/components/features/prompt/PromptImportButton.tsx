"use client";

import {Button, ButtonProps} from "@nextui-org/react";
import {useRef, useState} from "react";
import ErrorPopover from "@/components/ui/ErrorPopover";
import {parseRisuPrompt} from "@/lib/import/risu/preset/risuPreset";
import {createPrompt, putPrompt} from "@/lib/data/Prompt";
import {useRouter} from "next/navigation";

export default function PromptImportButton(props: ButtonProps) {
    const hiddenFileInput = useRef<HTMLInputElement>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const router =useRouter()

    async function importPrompt(file: File) {
        try {
            const arrayBuffer = await file.arrayBuffer(); // 파일을 ArrayBuffer로 읽기
            const uint8Array = new Uint8Array(arrayBuffer); // ArrayBuffer를 Uint8Array로 변환
            const prompt = await parseRisuPrompt({
                name: file.name,
                data: uint8Array,
            })
            const generated = await createPrompt(prompt.name)
            await putPrompt(generated.id, prompt)
            router.refresh()
        } catch (error) {
            console.log(error)
            if(error instanceof Error) {
                setErrorMessage(
                    error.message
                )
            }
        }
    }

    return <>
        <input type={'file'} multiple={false} ref={hiddenFileInput} accept={'.risup'} hidden={true}
               onChange={(event) => {
                   const fileList = event.target.files
                   if (!fileList || !fileList.length) {
                       return
                   }
                   importPrompt(fileList[0]).then()
               }}></input>
        <ErrorPopover errorMessage={errorMessage} >
            <div>
                <Button {...props} onPress={() => {
                    hiddenFileInput.current?.click()
                }}>
                    프롬프트 가져오기
                </Button>
            </div>
        </ErrorPopover>
    </>
}