import Lore, {deleteLore, LoreBase, RawLore, updateLore} from "@/lib/data/lore/Lore";
import SubmitSpan from "@/components/ui/SubmitSpan";
import {LoreChapterBoxProps} from "@/components/features/lore/LoreChapterBox";
import DeleteConfirmButton from "@/components/ui/DeleteConfirmButton";
import {ReactNode} from "react";
import AsyncProgressCheckbox from "@/components/ui/AsyncProgressCheckbox";

export interface LoreBoxProps extends LoreChapterBoxProps {
    lore: Lore;
}

export default function LoreBox(props: LoreBoxProps) {
    const {lore, updateLore: updateLoreUI} = props;

    async function applyValue(value: string, target: keyof LoreBase) {
        const newLore = {...lore}

        let parsedValue = isNaN(Number(value)) || value.trim().length === 0 ? value : Number(value);

        const data: Partial<RawLore> = {
            [target]: parsedValue
        }

        await updateLore(props.book, props.chapter, props.lore.id, data)

        // @ts-expect-error : 완벽하게 올바르진 않은데, 일단 어느정도 안정성 보장이 되고, 이걸 커버하기 위해서 작성해야 하는게 너무 많음
        newLore[target] = parsedValue
        props.updateLore(props.chapter, newLore)
    }

    function ValueCheckBox({target, children}: { target: keyof LoreBase, children: ReactNode }) {
        return <AsyncProgressCheckbox isSelected={lore[target] as any} onValueChangeAsync={async (value) => {
            const newLore = {...lore}
            await updateLore(props.book, props.chapter, lore.id, {
                [target]: value
            })

            // @ts-expect-error : 완벽하게 올바르진 않은데, 일단 어느정도 안정성 보장이 되고, 이걸 커버하기 위해서 작성해야 하는게 너무 많음
            newLore[target] = value

            props.updateLore(props.chapter, newLore)
        }}>{children}</AsyncProgressCheckbox>
    }

    return <div className={"flex flex-col gap-2 px-4"}>
        <DeleteConfirmButton confirmCount={4} onConfirmedAsync={async () => {
            await deleteLore(props.book, props.chapter, props.lore.id);
            props.deleteLore(props.chapter, lore);
        }}/>
        <SubmitSpan value={lore.name} label={"로어 이름"} submit={async (value) => {
            await applyValue(value, 'name')
        }}/>
        <SubmitSpan value={lore.keyword} label={"키워드"} submit={async (value) => {
            await applyValue(value, 'keyword')
        }}/>
        <ValueCheckBox target={'searchable'}>검색가능</ValueCheckBox>
        <ValueCheckBox target={'attached'}>부착형</ValueCheckBox>
        <span
            className={"text-xs text-foreground-400"}>이 옵션을 활성화 하면, 다른 로어가 이 로어가 속한 챕터를 활성화 한경우에도 이 로어가 따라 나옵니다.</span>
        <ValueCheckBox target={'always'}>항상 사용</ValueCheckBox>
        <span className={"text-xs text-foreground-400"}>이 옵션을 활성화 하면, 검색가능 여부나 키워드 매치 여부와 상관없이 이 로어가 사용됩니다.</span>

        <SubmitSpan value={lore.order.toString()} enforceInteger label={"출력 순서"} submit={async (value) => {
            await applyValue(value, 'order')
        }}/>

        <SubmitSpan value={lore.display_order.toString()} enforceInteger label={"표시 순서"} submit={async (value) => {
            await applyValue(value, 'display_order')
        }}/>

        <span className={"text-xs text-gray-600"}>표시 순서는 에디터 상에서 표시 순서를, 출력 순서는 로어북이 출력될 때의 순서를 정합니다</span>

        <SubmitSpan value={lore.priority.toString()} enforceInteger label={"중요도"}
                    description={"로어북 길이 제한에 걸렸을때, 중요도가 높을수록 나중에 제외됩니다."} submit={async (value) => {
            await applyValue(value, 'priority')
        }}/>


        <SubmitSpan value={lore.content} useTextarea label={"로어 내용"} submit={async (value) => {
            await applyValue(value, 'content')
        }}/>
    </div>
}