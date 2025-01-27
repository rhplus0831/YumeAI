import {Card, CardBody, CardFooter} from "@nextui-org/card";
import {Button, Divider} from "@nextui-org/react";
import {useState} from "react";
import AsyncProgressButton from "@/components/ui/AsyncProgressButton";
import {performTranslate} from "@/lib/data/Prompt";
import Room from "@/lib/data/Room";
import {googleTranslatePlain} from "@/lib/import/GoogleTranslate";

export interface SuggestedInputBoxProps {
    text: string,
    room: Room,
    onSuggestAccept: (message: string) => void,
}

export default function SuggestedInputBox(props: SuggestedInputBoxProps) {
    const {room, onSuggestAccept, text} = props;

    const [translated, setTranslated] = useState<string>("")
    const [translateView, setTranslateView] = useState<boolean>(false)

    async function flipTranslateView() {
        if (translateView) {
            setTranslateView(false)
            return;
        }
        if (translated) {
            setTranslateView(true)
            return;
        }
        if (room.translate_method === "google") {
            setTranslated(await googleTranslatePlain(text))
        } else if (room.translate_method === "prompt") {
            if (!room.translate_prompt) {
                throw new Error("번역 방법이 프롬프트이지만 프롬프트가 설정되어 있지 않습니다.")
            }
            setTranslated(await performTranslate(room.translate_prompt?.id, text))
        }
        setTranslateView(true)
    }

    return <Card>
        <CardBody>
            <span className={"whitespace-pre-line"}>{translateView ? translated : text}</span>
        </CardBody>
        <Divider/>
        <CardFooter className={"flex flex-row gap-2"}>
            {room.translate_method && <>
                <AsyncProgressButton
                    onPressAsync={flipTranslateView}>{translateView ? '원문 보기' : '번역본 보기'}</AsyncProgressButton>
            </>}
            <Button color={"primary"} onPress={() => {
                onSuggestAccept(text)
            }}>적용하기</Button>
        </CardFooter>
    </Card>
}