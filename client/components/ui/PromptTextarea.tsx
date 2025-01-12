"use client";

import {Textarea} from "@nextui-org/input";
import {useEffect, useRef, useState} from "react";
import {MdOutlineCheck, MdOutlineEditNote, MdOutlineError} from "react-icons/md";
import {Button, CircularProgress} from "@nextui-org/react";

export interface PromptTextareaProps {
    onSave: (text: string) => Promise<void>;
    prompt: string
    title: string
    setStatus?: (status: string) => void
}

export default function PromptTextarea(props: PromptTextareaProps) {
    const [prompt, setPrompt] = useState(props.prompt)
    const [errorMessage, setErrorMessage] = useState("")
    const [status, setStatus] = useState("normal")

    useEffect(() => {
        setPrompt(props.prompt)
    }, [props.prompt]);

    useEffect(() => {
        props?.setStatus?.(status)
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // status가 normal이 아니면 경고 메시지 띄우기
            if (status !== "normal") {
                e.preventDefault();
                e.returnValue = ""; // 일부 브라우저에서 경고를 보여주기 위한 설정
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        // 컴포넌트 언마운트 시 이벤트 리스너 해제
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [status]); // status가 변경될 때마다 효과 재실행

    function getStatusElement() {
        if(errorMessage) return <>
            <MdOutlineError className={"text-red-500"} size={"32"} />
            {errorMessage}
        </>

        if(status === "normal") return (<>
            <MdOutlineCheck className={"text-green-500"} size={"32"} />
            최신 상태
        </>)

        if(status === "progress") return (<>
            <CircularProgress />
            저장중
        </>)

        if(status === "edited") return <>
            <MdOutlineEditNote className={"text-yellow-500"} size={"32"} />
            수정됨
        </>

        return <></>
    }

    const isProcessing = useRef(false)

    async function save() {
        if(isProcessing.current) return;

        isProcessing.current = true;
        setStatus("progress")
        try {
            await props.onSave(prompt)
            setStatus("normal")
        } catch (e: unknown) {
            if(e instanceof Error) {
                setErrorMessage(e.message)
            }
        } finally {
            isProcessing.current = false;
        }
    }

    return <article className={"w-full h-full flex flex-col"}>
        <Textarea disableAutosize className={"flex-1"} label={props.title} classNames={{
            base: "w-full h-full",
            input: "w-full h-full",
            inputWrapper: "flex-1"
        }} value={prompt} onChange={(e) => {
            setErrorMessage("")
            setStatus("edited")
            setPrompt(e.target.value)
        }}>
        </Textarea>
        <div className={"flex-none flex flex-row mt-3 mb-1 items-center"}>
            <div className={"flex-1 flex flex-row gap-2 items-center text-lg"}>
                {getStatusElement()}
            </div>
            <div className={"flex-none"}>
                <Button onPress={save}>저장하기</Button>
            </div>
        </div>
    </article>
}