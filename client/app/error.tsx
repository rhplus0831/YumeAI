"use client";

import {useEffect} from "react";
import {Button} from "@nextui-org/react";
import {useRouter} from "next/navigation";

export default function Error({
                                  error,
                                  reset,
                              }: {
    error: Error;
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        /* eslint-disable no-console */
        console.error(error);
    }, [error]);

    return (
        <div className={"flex flex-col items-center justify-center gap-4 py-8 md:py-10"}>
            <h2>오 이런, 뭔가 잘못되었네요! 아래에 있는것들을 시도해보세요!</h2>
            <Button onPress={() => {
                window.document.location.reload();
            }}>
                새로고침
            </Button>
            <Button onPress={() => {
                window.document.location.pathname = "/login";
            }}>
                재 로그인 하기
            </Button>
        </div>
    );
}
