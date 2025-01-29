"use client";

import {OpenedLoreBook, OpenedLoreChapter} from "@/lib/data/lore/ReadLoreBook";
import {Accordion, AccordionItem, ButtonGroup} from "@nextui-org/react";
import {ReactNode} from "react";
import LoreBox from "@/components/features/lore/LoreBox";
import CreateWithNameButton from "@/components/ui/CreateWithNameButton";
import LoreChapter, {
    createChildChapter,
    deleteChapter,
    LoreChapterBase,
    RawLoreChapter,
    updateChapter
} from "@/lib/data/lore/LoreChapter";
import Lore, {createLore, RawLore} from "@/lib/data/lore/Lore";
import DeleteConfirmButton from "@/components/ui/DeleteConfirmButton";
import SubmitSpan from "@/components/ui/SubmitSpan";
import AsyncProgressCheckbox from "@/components/ui/AsyncProgressCheckbox";

interface OrderedNode {
    node: ReactNode,
    order: number
}

export interface LoreChapterBoxProps {
    book: OpenedLoreBook,
    chapter: OpenedLoreChapter,
    insertChapter: (chapter: RawLoreChapter, parent?: OpenedLoreChapter) => void,
    updateChapter: (chapter: OpenedLoreChapter) => void,
    deleteChapter: (chapter: OpenedLoreChapter) => void,
    insertLore: (lore: RawLore, parent: OpenedLoreChapter) => void,
    updateLore: (chapter: OpenedLoreChapter, lore: Lore) => void,
    deleteLore: (chapter: OpenedLoreChapter, lore: Lore) => void,
}

export default function LoreChapterBox(props: LoreChapterBoxProps) {
    const {book, chapter} = props;

    async function applyChapterValue(chapter: OpenedLoreChapter, value: string, target: keyof LoreChapterBase) {
        const newChapter = {...chapter}

        let parsedValue = isNaN(Number(value)) || value.trim().length === 0 ? value : Number(value);

        const data: Partial<LoreChapter> = {
            [target]: parsedValue
        }

        await updateChapter(book, chapter.id, data)
        // @ts-expect-error : 완벽하게 올바르진 않은데, 일단 어느정도 안정성 보장이 되고, 이걸 커버하기 위해서 작성해야 하는게 너무 많음
        newChapter[target] = parsedValue
        console.log('update chapter', newChapter)
        props.updateChapter(newChapter)
    }

    function renderChapterInner(chapter: OpenedLoreChapter) {
        const items: OrderedNode[] = []

        chapter.children.forEach(child => {
            items.push({
                node: (<AccordionItem key={child.id} classNames={{
                    title: "px-4",
                    indicator: "px-4",
                }} title={`하위 챕터: ${child.name}`}>
                    {renderChapter(child)}
                </AccordionItem>),
                order: child.display_order
            })
        })

        chapter.lores.forEach(lore => {
            items.push({
                node: (<AccordionItem key={lore.id} classNames={{
                    title: "px-4",
                    indicator: "px-4",
                }} title={`로어: ${lore.name}`}>
                    {<LoreBox {...props} chapter={chapter} lore={lore}/>}
                </AccordionItem>),
                order: lore.display_order
            })
        })

        return items.sort((a, b) => a.order - b.order).map(item => item.node)
    }

    function renderChapter(chapter: OpenedLoreChapter): ReactNode {
        return <div className={"flex flex-col gap-2"} key={chapter.id}>
            <div className={"flex flex-col gap-2 px-4"}>
                <ButtonGroup className={"w-full justify-start"}>
                    <CreateWithNameButton dataName={"하위 챕터"} createSelf={async (name) => {
                        props.insertChapter(await createChildChapter(book, chapter, name), chapter)
                    }}/>
                    <CreateWithNameButton dataName={"로어"} createSelf={async (name) => {
                        props.insertLore(await createLore(book, chapter, name), chapter);
                    }}/>
                    <DeleteConfirmButton confirmCount={4} onConfirmedAsync={async () => {
                        await deleteChapter(book, chapter);
                        props.deleteChapter(chapter);
                    }}/>
                </ButtonGroup>
                <SubmitSpan value={chapter.name} label={"챕터 이름"} submit={async (value) => {
                    await applyChapterValue(chapter, value, 'name')
                }}/>
                <SubmitSpan value={chapter.description} useTextarea label={"챕터 설명"} submit={async (value) => {
                    await applyChapterValue(chapter, value, 'description')
                }} adaptiveDescriptionDisplay description={"실제로 들어가지 않는, 주석 같은 개념입니다."}/>
                <SubmitSpan value={chapter.header} label={"머리말(헤더)"} useTextarea submit={async (value) => {
                    await applyChapterValue(chapter, value, 'header')
                }} adaptiveDescriptionDisplay description={"이 챕터가 인용되는 경우 상단에 삽입되는 내용입니다."}/>
                <SubmitSpan value={chapter.footer} label={"꼬리글(푸터)"} useTextarea submit={async (value) => {
                    await applyChapterValue(chapter, value, 'footer')
                }} adaptiveDescriptionDisplay description={"이 챕터가 인용되는 경우 하단에 삽입되는 내용입니다."}/>
                <SubmitSpan value={chapter.display_order.toString()} enforceInteger label={"표시 순서"}
                            description={"높을수록 마지막에 표시됩니다, 출력에는 영향을 주지 않습니다"} submit={async (value) => {
                    await applyChapterValue(chapter, value, 'display_order')
                }}/>
                <AsyncProgressCheckbox isSelected={chapter.greedy} onValueChangeAsync={async (value) => {
                    const newChapter = {...chapter}
                    newChapter.greedy = (await updateChapter(book, chapter.id, {
                        "greedy": value
                    })).greedy
                    props.updateChapter(newChapter)
                }}>독점형 챕터</AsyncProgressCheckbox>
                <span
                    className={"text-xs text-foreground-400"}>이 옵션을 활성화하면, 설정한 순서와 상관없이 이 챕터의 모든 로어가 먼저 출력된 뒤, 하위 챕터가 처리됩니다.</span>
            </div>
            {chapter.lores.length !== 0 || chapter.children.length !== 0 ?
                <Accordion selectionMode={"multiple"} className={"p-0"} variant={"bordered"}>
                    {
                        //Dirty but works...
                        renderChapterInner(chapter) as any
                    }
                </Accordion> : <span className={"px-4"}>이 로어 챕터는 비어있습니다!</span>}
        </div>
    }

    return renderChapter(chapter)
}