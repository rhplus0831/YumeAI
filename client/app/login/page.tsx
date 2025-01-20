"use client";

import {Input} from "@nextui-org/input";
import {useEffect, useState} from "react";
import {api, login, register} from "@/lib/api-client";
import AsyncProgressButton from "@/components/ui/AsyncProgressButton";
import SHA512 from "crypto-js/sha512";
import {useRouter} from "next/navigation";
import {Checkbox} from "@nextui-org/react";
import {Card, CardBody} from "@nextui-org/card";

export default function LoginPage() {
    const isSharing = process.env.NEXT_PUBLIC_IS_SHARING;

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
        <div className={"w-fit flex flex-col gap-2"}>
            <Input variant={"underlined"} size={"md"} label={"아이디"} type={"username"}
                   description={"영소문자와 -, _ 를 사용할 수 있습니다."} onValueChange={setMyId}/>
            <Input variant={"underlined"} size={"md"} label={"비밀번호"} type={"password"} onValueChange={setMyPassword}/>
            {tryRegister && <Input variant={"underlined"} size={"md"} label={"비밀번호 확인"} type={"password"}
                                   onValueChange={setMyPasswordConfirm}/>}

            {isRegisterAllowed && <Checkbox checked={tryRegister} onValueChange={setTryRegister}>회원가입 할래요</Checkbox>}

            {tryRegister && <div className={"text-center flex flex-col gap-4"}>
                <span className={"font-extrabold text-xl"}>회원가입 안내사항</span>
                <Card>
                    <CardBody>
                        <span>
                            YumeAI는 <span className={"text-danger"}>종단간 암호화를 지원하지 않습니다.</span>
                        </span>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <span>
                            개발자는 <span className={"text-danger"}>데이터 유출 및 유실</span>을 방지하기 위해 노력하지만 이<span className={"text-danger"}>에 대한 책임을 지지는 않습니다.</span><br/>
                            사용자는 데이터를 안전하게 관리하고 주기적으로 백업해야 합니다.
                        </span>
                    </CardBody>
                </Card>
                {isSharing && <Card>
                    <CardBody>
                        <span>
                            웹사이트 운영은 사비로 이루어지고 있으며,<br/>
                            예상치 못한 비용 문제나 기타 사정으로 인해 서비스가 중단될 수 있습니다.<br/>
                            이 경우에는 데이터 백업을 위한 유예기간을 두려고 노력합니다.
                        </span>
                    </CardBody>
                </Card>}
                <Card>
                    <CardBody>
                        <span>
                            {isSharing && <span>본 웹사이트는 YumeAI의 기능을 가볍게 체험해보는 용도로 활용하시고<br/></span>}
                            중요한 데이터는 <span className={"text-danger font-bold"}>반드시 개별적으로 백업</span>하시는 것을 권장합니다.
                        </span>
                    </CardBody>
                </Card>
                <Checkbox checked={agreeRegister} onValueChange={setAgreeRegister}>위 항목을 읽었고 백업을 열심히 하겠습니다.</Checkbox>
            </div>}

            <AsyncProgressButton isDisabled={tryRegister && !agreeRegister} onPressAsync={async () => {
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