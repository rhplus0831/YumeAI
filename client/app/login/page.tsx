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
    })

    return <div className={"w-full flex flex-col justify-center items-center p-5"}>
        <span className={"font-extrabold text-2xl"}>YumeAI {tryRegister ? "회원가입" : "로그인"}</span>
        <div className={"w-fit flex flex-col gap-2"}>
            <Input variant={"underlined"} size={"md"} label={"아이디"} type={"username"}
                   description={"_로 시작하지 않는, 영소문자와 -, _ 를 사용할 수 있습니다."} onValueChange={setMyId}/>
            <Input variant={"underlined"} size={"md"} label={"비밀번호"} type={"password"} onValueChange={setMyPassword}/>
            {tryRegister && <Input variant={"underlined"} size={"md"} label={"비밀번호 확인"} type={"password"}
                                   onValueChange={setMyPasswordConfirm}/>}

            {isRegisterAllowed && <Checkbox checked={tryRegister} onValueChange={setTryRegister}>회원가입 할래요</Checkbox>}

            {tryRegister && <div className={"text-center flex flex-col gap-4"}>
                <span className={"font-extrabold text-xl"}>회원가입 안내사항</span>
                <Card>
                    <CardBody>
                        <span>
                            입력한 내용이 서버에 <span className={"font-bold text-danger"}>암호화되지 않은 상태</span>로 저장됩니다.<br/>
                            가능하다면 YumeAI를 셀프 호스팅 하거나 로컬에서 사용하세요.
                        </span>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <span>
                            개발자는 <span className={"text-danger"}>데이터 유출 및 유실</span>을 방지하기 위해 노력하지만, 이<span className={"text-danger"}>에 대한 책임을 지지는 않습니다.</span><br/>사용자는 데이터를 안전하게 관리하고 주기적으로 백업해야 합니다.
                        </span>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <span>
                            비용 문제등 사이트를 유지할 수 없는 상황이 발생하는경우, 사이트가 폐쇄될 수 있습니다.
                        </span>
                    </CardBody>
                </Card>
                <Checkbox checked={agreeRegister} onValueChange={setAgreeRegister}>안내사항을 읽었습니다.</Checkbox>
            </div>}

            <AsyncProgressButton isDisabled={tryRegister && !agreeRegister} onPressAsync={async () => {
                if (tryRegister) {
                    if (myPassword != myPasswordConfirm) {
                        throw new Error("비밀번호와 비밀번호 확인이 일치하지 않습니다.")
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