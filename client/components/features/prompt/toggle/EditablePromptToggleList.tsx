import Prompt from "@/lib/data/Prompt";
import SubmitSpan from "@/components/ui/SubmitSpan";
import AsyncProgressButton from "@/components/ui/AsyncProgressButton";

export default function EditablePromptToggleList({prompt, onEdited}: {
    prompt: Prompt,
    onEdited: (value: string) => Promise<void>
}) {
    return <div>
        <div className={"flex flex-col mb-2"}>
            <span>토글 목록</span>
            <span className={"text-xs"}>텍스트를 비우고 저장하면 토글이 제거됩니다.</span>
        </div>
        <section className={"flex flex-col gap-1"}>
            {prompt.toggles && prompt.toggles.split("\n").map((toggle, index) => {
                if (!toggle) return undefined;

                const [name, display] = toggle.split("=")

                return <SubmitSpan key={toggle} value={toggle} label={display} submit={async (value) => {
                    if (!prompt.toggles) return;
                    let newToggles: string[];
                    if(!value) {
                        newToggles = prompt.toggles.split("\n").filter((innerToggle, innerIndex) => {
                            if (innerIndex === index) return false;

                            return true;
                        })
                    } else {
                        if (!value.includes("=")) {
                            throw Error("토글은 {{토글 이름}}={{표시 이름}} 으로 작성해야 합니다.")
                        }
                        newToggles = prompt.toggles.split("\n").map((innerToggle, innerIndex) => {
                            if (innerIndex === index) return value;

                            return innerToggle;
                        })
                    }
                    onEdited(newToggles.join("\n"))
                }}/>
            })}
            <AsyncProgressButton onPressAsync={async () => {
                if(!prompt.toggles) {
                    onEdited("sample=샘플")
                } else {
                    onEdited(prompt.toggles + "\nsample=샘플")
                }
            }}>
                새 토글 추가
            </AsyncProgressButton>
        </section>
    </div>
}