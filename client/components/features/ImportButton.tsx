"use client";

import {useRef, useState} from "react";
import {Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Progress} from "@nextui-org/react";
import ErrorPopover from "@/components/ui/ErrorPopover";
import {useRouter} from "next/navigation";


export default function ImportButton({mime, importer, label}: {
    mime: string,
    importer: (arrayBuffer: ArrayBuffer, setLoadingStatus: (status: string) => void) => Promise<void>,
    label: string,
}) {
    const hiddenFileInput = useRef<HTMLInputElement>(null);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [isInUpload, setIsInUpload] = useState(false);

    const [loadingStatus, setLoadingStatus] = useState<string>("초기화...")

    const router = useRouter();

    async function uploadZip(fileList: FileList) {
        setIsInUpload(true)
        const file = fileList[0];
        const reader = new FileReader();

        reader.onload = async (e) => {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            if (!arrayBuffer) {
                throw new Error("Array buffer is empty")
            }

            importer(arrayBuffer, setLoadingStatus).then(() => {
                setIsInUpload(false)
                router.refresh()
            }).catch((err) => {
                console.log(err)
                if (err instanceof Error) {
                    setErrorMessage(err.message)
                }
                setIsInUpload(false)
            })
        };

        reader.onerror = (err) => {
            console.log(err)
            if (err instanceof Error) {
                setErrorMessage(err.message)
            }
            setIsInUpload(false)
        };

        reader.readAsArrayBuffer(file);

        setErrorMessage("")
        router.refresh()
    }

    return <>
        <input type={'file'} multiple={false} ref={hiddenFileInput} accept={mime} hidden={true}
               onChange={(event) => {
                   const fileList = event.target.files
                   if (!fileList || !fileList.length) {
                       return
                   }
                   uploadZip(fileList).then()
               }}></input>
        <Modal isOpen={isInUpload}>
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">{label}</ModalHeader>
                        <ModalBody>
                            <Progress isIndeterminate label={loadingStatus} className="max-w-md" size="sm"/>
                        </ModalBody>
                        <ModalFooter/>
                    </>
                )}
            </ModalContent>
        </Modal>
        <ErrorPopover errorMessage={errorMessage}>
            <Button isLoading={isInUpload} className={"w-full"} onPress={async () => {
                hiddenFileInput.current?.click()
            }}>{label}</Button>
        </ErrorPopover>
    </>
}