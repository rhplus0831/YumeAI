"use client";

import {Checkbox} from "@nextui-org/react";
import {useEffect, useState} from "react";

export default function EncryptAssetCheckbox() {
    const isSharing = !!process.env.NEXT_PUBLIC_IS_SHARING;
    const [useEncrypt, setUseEncrypt] = useState(false)
    const [noSecure, setNoSecure] = useState(false)

    useEffect(() => {
        if (!window.isSecureContext) {
            setUseEncrypt(false)
            setNoSecure(true)
            return
        }

        if (localStorage.getItem("useEncrypt") === null) {
            localStorage.setItem("useEncrypt", isSharing.toString())
            setUseEncrypt(isSharing)
        } else {
            setUseEncrypt(localStorage.getItem("useEncrypt") === "true")
        }
    }, []);

    function toggleUseEncrypt(value: boolean) {
        localStorage.setItem("useEncrypt", value.toString())
        setUseEncrypt(value)
    }

    return noSecure ? <span>현재 암호화 상태(HTTPS)가 아니기 때문에, 에셋 암호화를 사용할 수 없습니다</span> : <>
        <Checkbox isSelected={useEncrypt} onValueChange={toggleUseEncrypt}>에셋 암호화를 사용</Checkbox>
        <span className={"text-xs"}>
                이 기능은 클라이언트 기기에서 암호화 및 복호화를 수행하므로, 기기 성능에 따라 첫 로딩 시간이 길어질 수 있습니다.<br/>
                첫 로드가 완료된 정보는 클라이언트에 캐시되므로 캐시 이후 로딩 속도에는 영향을 주지 않습니다.<br/>
                이 기능의 사용 여부는 서버에 기록되지 않으며, 중간에 사용여부를 바꾸는 경우 (비)암호화된 에셋은 사용할 수 없게 됩니다.
        </span>
    </>
}