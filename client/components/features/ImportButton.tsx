"use client";

import {useRef, useState} from "react";
import {Button} from "@nextui-org/react";
import ErrorPopover from "@/components/ui/ErrorPopover";
import {api} from "@/lib/api-client";
import {useRouter} from "next/navigation";

export default function ImportButton() {
    const hiddenFileInput = useRef<HTMLInputElement>(null);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [isInUpload, setIsInUpload] = useState(false);

    const router = useRouter();

    async function uploadZip(fileList: FileList) {
        try {
            setIsInUpload(true)
            const formData = new FormData()
            formData.append('in_file', fileList[0])
            await api('import', {
                method: 'POST',
                cache: 'no-cache',
                body: formData,
            }, false)

            setErrorMessage("")
            router.refresh()
        } catch (err: any) {
            console.log(err)
            if (err instanceof Error) {
                setErrorMessage(err.message)
            }
        } finally {
            setIsInUpload(false)
        }
    }

    return <>
        <input type={'file'} multiple={false} ref={hiddenFileInput} accept={'application/zip'} hidden={true}
               onChange={(event) => {
                   const fileList = event.target.files
                   if (!fileList || !fileList.length) {
                       return
                   }
                   uploadZip(fileList).then()
               }}></input>
        <ErrorPopover errorMessage={errorMessage}>
            <Button isLoading={isInUpload} className={"w-full"} onPress={async () => {
                hiddenFileInput.current?.click()
            }}>데이터 가져오기</Button>
        </ErrorPopover>
    </>
}