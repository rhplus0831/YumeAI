"use client";

import {useRef, useState} from "react";
import {Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Progress} from "@nextui-org/react";
import ErrorPopover from "@/components/ui/ErrorPopover";
import {useRouter} from "next/navigation";


export default function ImportButton({mime, importer, label}: {
    mime: string,
    importer: (mime: string, arrayBuffer: ArrayBuffer, setLoadingStatus: (status: string) => void) => Promise<string | undefined>,
    label: string,
}) {
    const hiddenFileInput = useRef<HTMLInputElement>(null);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [isInUpload, setIsInUpload] = useState(false);
    const [importMessage, setImportMessage] = useState<string | undefined>(undefined);

    const [loadingStatus, setLoadingStatus] = useState<string>("초기화...")

    const router = useRouter();

    function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const arrayBuffer = e.target?.result as ArrayBuffer;
                if (!arrayBuffer) {
                    reject(new Error("Array buffer is empty"));
                } else {
                    resolve(arrayBuffer);
                }
            };

            reader.onerror = (err) => {
                reject(err);
            };

            reader.readAsArrayBuffer(file);
        });
    }

    async function uploadZip(fileList: FileList) {
        setErrorMessage("")
        setIsInUpload(true)
        const file = fileList[0];

        try {
            const arrayBuffer = await readFileAsArrayBuffer(file);
            setImportMessage(await importer(file.type, arrayBuffer, setLoadingStatus));
            setIsInUpload(false);
            router.refresh();
        } catch (err) {
            console.error(err);
            if (err instanceof Error) {
                setErrorMessage(err.message);
            }
            setIsInUpload(false);
        }
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
        <Modal isOpen={isInUpload || !!importMessage}>
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">{label}</ModalHeader>
                        <ModalBody>
                            {importMessage ? <span>{importMessage}</span> :
                                <Progress isIndeterminate label={loadingStatus} className="max-w-md" size="sm"/>}
                        </ModalBody>
                        <ModalFooter>
                            {importMessage && <Button onPress={() => {
                                setImportMessage(undefined)
                            }}>확인했습니다</Button>}
                        </ModalFooter>
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