"use client";

import {Input} from "@nextui-org/input";
import {useState} from "react";
import {login} from "@/lib/api-client";
import AsyncProgressButton from "@/components/ui/AsyncProgressButton";
import SHA512 from "crypto-js/sha512";
import {useRouter} from "next/navigation";

export default function LoginPage() {
    const [myPassword, setMyPassword] = useState("")
    const router = useRouter()

    return <div className={"w-full h-full flex flex-col gap-10 justify-center items-center"}>
        <span className={"font-extrabold text-2xl"}>YumeAI 로그인</span>
        <div className={"w-fit flex flex-col gap-4"}>
            <Input variant={"underlined"} size={"md"} label={"비밀번호"} color={"primary"} type={"password"} onValueChange={setMyPassword}/>

            <AsyncProgressButton onPressAsync={async () => {
                await login(SHA512(myPassword).toString())
                router.push('/rooms')
            }}>로그인</AsyncProgressButton>
        </div>
    </div>
}