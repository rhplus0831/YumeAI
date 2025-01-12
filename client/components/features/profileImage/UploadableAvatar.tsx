"use client";

import YumeAvatar from "@/components/ui/YumeAvatar";
import ProfileImage from "@/lib/data/ProfileImage";
import {useEffect, useRef, useState} from "react";
import {Skeleton} from "@nextui-org/react";
import {api, buildAPILink, buildImageLink} from "@/lib/api-client";
import ErrorPopover from "@/components/ui/ErrorPopover";

export default function UploadableAvatar<Data>({profileImageId, endpoint, onEdited}: {
    profileImageId: string | undefined,
    endpoint: string,
    onEdited: (data: Data) => void
}) {
    const hiddenFileInput = useRef<HTMLInputElement>(null);
    const [profileUploaded, setProfileUploaded] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const uploadProfile = async (fileList: FileList) => {
        setProfileUploaded(false)
        const formData = new FormData()
        formData.append('image_file', fileList[0])
        try {
            const data = await api(endpoint, {
                method: 'POST',
                cache: 'no-cache',
                body: formData,
            }, false)

            setErrorMessage('')
            onEdited(data)
        } catch (err) {
            console.log(err)
            if (err instanceof Error) {
                setErrorMessage(err.message)
            }
        }
    }

    useEffect(() => {
        setProfileUploaded(true)
    }, [profileImageId]);

    return <>
        <input type={'file'} multiple={false} ref={hiddenFileInput} accept={'image/*'} hidden={true}
               onChange={(event) => {
                   const fileList = event.target.files
                   if (!fileList || !fileList.length) {
                       return
                   }
                   uploadProfile(fileList).then()
               }}></input>
        <ErrorPopover errorMessage={errorMessage} >
            <Skeleton key={profileImageId} className={"w-10 h-10 rounded-full"} isLoaded={profileUploaded} onClick={() => hiddenFileInput.current?.click()}>
                <YumeAvatar src={buildImageLink(profileImageId)} />
            </Skeleton>
        </ErrorPopover>
    </>
}