"use client";

import {Input} from "@nextui-org/input";
import {useEffect, useState} from "react";
import {api, login, register} from "@/lib/api-client";
import AsyncProgressButton from "@/components/ui/AsyncProgressButton";
import SHA512 from "crypto-js/sha512";
import {useRouter} from "next/navigation";
import {Checkbox, Link} from "@nextui-org/react";
import {Card, CardBody} from "@nextui-org/card";
import EncryptAssetCheckbox from "@/components/ui/EncryptAssetCheckbox";

export default function LoginPage() {
    const isSharing = !!process.env.NEXT_PUBLIC_IS_SHARING;

    const [isRegisterAllowed, setIsRegisterAllowed] = useState(false)

    const [myId, setMyId] = useState("")
    const [myPassword, setMyPassword] = useState("")
    const [myPasswordConfirm, setMyPasswordConfirm] = useState("")

    const [tryRegister, setTryRegister] = useState(false)
    const [agreeRegister, setAgreeRegister] = useState(false)

    const router = useRouter()

    useEffect(() => {
        async function check() {
            try {
                await api('check-register-available', {
                    method: 'GET'
                })
                setIsRegisterAllowed(true)
            } catch {
                setIsRegisterAllowed(false)
            }
        }

        check().then()
    }, [])

    return <div className={"w-full flex flex-col justify-center items-center p-5"}>
        <span className={"font-extrabold text-2xl"}>YumeAI {tryRegister ? "회원가입" : "로그인"}</span>
        <div className={"w-fit flex flex-col gap-2 max-w-xl"}>
            <Input variant={"underlined"} size={"md"} label={"아이디"} type={"username"}
                   description={"영소문자와 -, _ 를 사용할 수 있습니다."} onValueChange={setMyId}/>
            <Input variant={"underlined"} size={"md"} label={"비밀번호"} type={"password"} onValueChange={setMyPassword}/>
            {tryRegister && <Input variant={"underlined"} size={"md"} label={"비밀번호 확인"} type={"password"}
                                   onValueChange={setMyPasswordConfirm}/>}
            <EncryptAssetCheckbox />

            {isRegisterAllowed && <Checkbox isSelected={tryRegister} onValueChange={setTryRegister}>회원가입</Checkbox>}

            {tryRegister && !isSharing && <div className={"text-center flex flex-col gap-4"}>
                <span className={"font-extrabold text-xl"}>안녕하세요!</span>
                <Card>
                    <CardBody>
                        <span>
                            셀프 호스팅 혹은 로컬 실행 환경인것 같습니다.<br/>
                            자기 자신이 데이터의 주체가 된다는것은 굉장히 좋은일이죠.<br/>
                            <span className={"text-danger"}>백업을 생활화</span>하고 <span className={"text-danger"}>비밀번호를 기억</span> 해야 한다는 사실을 잊지 마세요!
                        </span>
                    </CardBody>
                </Card>
                <Checkbox isSelected={agreeRegister} onValueChange={setAgreeRegister}>백업을 열심히 하겠습니다.</Checkbox>
            </div>}

            {tryRegister && isSharing && <div className={"text-center flex flex-col gap-4"}>
                <span className={"font-extrabold text-2xl"}>서비스 이용약관의 요약</span>
                <Card>
                    <CardBody>
                        <span>
                            YumeAI 서버는 에셋 데이터(이미지, 오디오, 비디오)를 제외한 데이터(API 키, 프로프트 등)를 사용자가 가입할 때 입력한 비밀번호를 기반으로 암호화 하여 보관합니다.<br/>
                            비밀번호 정보는 해시로 변환되어 브라우저에 쿠키로 남으며, 서버는 이 쿠키 정보를 기반으로 암호화된 정보를 처리합니다.<br/>
                            이는 사용자가 비밀번호를 잊어버리면 <span className={"text-danger"}>데이터를 복구할 방법이 없음</span>을 의미합니다.
                        </span>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <span>
                            제공자는 법적 의무가 있는 경우를 제외하고, 귀하의 데이터를 제3자에게 전송, 전달, 공개 또는 접근 권한을 부여하지 않습니다.
                        </span>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <span>
                            제공자는 이 서비스가 항상 동작할것을 보증하지 않고, 서비스로 인해 발생한 피해를 책임지지 않습니다.
                        </span>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <span>
                            <Link href={"/tos"} isExternal>이용약관의 전문</Link>을 읽을수도 있습니다!
                        </span>
                    </CardBody>
                </Card>
                <Checkbox checked={agreeRegister} onValueChange={setAgreeRegister}>이용 약관에 동의하며 저는 14세 이상입니다.</Checkbox>
            </div>}

            <AsyncProgressButton isDisabled={tryRegister && !agreeRegister} onPressAsync={async () => {
                const assetKey = SHA512("yumeAsset-" + myPassword).toString()
                if( localStorage.getItem("useEncrypt") === "true" ) {
                    localStorage.setItem("assetKey", assetKey)
                    navigator?.serviceWorker?.ready?.then(serviceWorkerRegistration => {
                        serviceWorkerRegistration?.active?.postMessage({
                            type: 'assetKey',
                            payload: assetKey,
                        });
                    })
                } else {
                    localStorage.setItem("assetKey", '')
                    navigator?.serviceWorker?.ready?.then(serviceWorkerRegistration => {
                        serviceWorkerRegistration?.active?.postMessage({
                            type: 'assetKey',
                            payload: '',
                        });
                    })
                }
                if (tryRegister) {
                    if (myPassword != myPasswordConfirm) {
                        throw new Error("비밀번호와 비밀번호 확인이 일치하지 않습니다.")
                    }
                    if (myPassword.length < 8) {
                        throw new Error("안전을 위해 8자 이상의 비밀번호를 설정해주세요!")
                    }
                    await register(myId, SHA512("yumeAI-" + myPassword).toString())
                    router.push('/rooms')
                } else {
                    await login(myId, SHA512("yumeAI-" + myPassword).toString())
                    router.push('/rooms')
                }
            }}>{tryRegister ? '회원가입' : '로그인'}</AsyncProgressButton>
        </div>
    </div>
}