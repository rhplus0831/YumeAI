import {
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverHeader,
    PopoverTrigger,
    SkeletonCircle
} from "@chakra-ui/react";
import {getAPIServer} from "../../Configure";
import React, {useRef, useState} from "react";
import YumeAvatar from "./YumeAvatar.tsx";

export interface ProfileImage {
    profileImageId: string | undefined
}

export default function UploadableProfileBox<dataType>({selected, endpoint, onEdited}: {
    selected: ProfileImage | null,
    endpoint: string,
    onEdited: (data: dataType) => void
}) {
    const [profileUploaded, setProfileUploaded] = React.useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const hiddenFileInput = useRef<HTMLInputElement>(null);

    const uploadProfile = async (fileList: FileList) => {
        if (selected === null) return

        setProfileUploaded(false)
        const formData = new FormData()
        formData.append('image_file', fileList[0])

        const notifyError = (detail: string = "") => {
            setErrorMessage(detail)
        }

        setProfileUploaded(false)
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                cache: 'no-cache',
                body: formData,
            })
            const data = await response.json();
            if (!response.ok) {
                if (typeof (data.detail) !== "string") {
                    notifyError(data.detail[0].msg)
                } else {
                    notifyError(data.detail)
                }
            } else {
                setErrorMessage('')
                onEdited(data)
            }
        } catch (err) {
            console.log(err)
            try {
                if(err instanceof Error) {
                    notifyError(err.message)
                }
            } catch { /* empty */ }
        }
        setProfileUploaded(true)
    }

    return (
        <>
            <input type={'file'} multiple={false} ref={hiddenFileInput} accept={'image/*'} hidden={true}
                   onChange={(event) => {
                       const fileList = event.target.files
                       if (!fileList || !fileList.length) {
                           return
                       }
                       uploadProfile(fileList).then()
                   }}></input>
            <SkeletonCircle isLoaded={profileUploaded} size='12'>
                <Popover isOpen={errorMessage !== ''} onClose={() => {
                    setErrorMessage("")
                }}>
                    <PopoverTrigger>
                        <YumeAvatar
                            src={selected?.profileImageId ? getAPIServer() + 'image/' + selected?.profileImageId : undefined}
                            onClick={() => {
                                hiddenFileInput.current?.click()
                            }}/>
                    </PopoverTrigger>
                    <PopoverContent>
                        <PopoverArrow/>
                        <PopoverCloseButton/>
                        <PopoverHeader>에러 발생</PopoverHeader>
                        <PopoverBody>{errorMessage}</PopoverBody>
                    </PopoverContent>
                </Popover>
            </SkeletonCircle>
        </>
    )
}