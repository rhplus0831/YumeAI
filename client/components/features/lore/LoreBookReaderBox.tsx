"use client";

import {Accordion, AccordionItem} from "@nextui-org/react";
import {OpenedLoreBook, OpenedLoreChapter} from "@/lib/data/lore/ReadLoreBook";
import LoreChapterBox from "@/components/features/lore/LoreChapterBox";
import {createChapter, RawLoreChapter} from "@/lib/data/lore/LoreChapter";
import CreateWithNameButton from "@/components/ui/CreateWithNameButton";
import YumeMenu from "@/components/MenuPortal";
import SubmitSpan from "@/components/ui/SubmitSpan";
import LoreBook, {deleteLoreBook, updateLoreBook} from "@/lib/data/lore/LoreBook";
import {useEffect, useState} from "react";
import Lore, {RawLore} from "@/lib/data/lore/Lore";
import LoreTestButton from "@/components/features/lore/LoreTestButton";
import DeleteConfirmButton from "@/components/ui/DeleteConfirmButton";
import {useRouter} from "next/navigation";

export default function LoreBookReaderBox({startBook, isStandalone}: {
    startBook: OpenedLoreBook,
    isStandalone?: boolean
}) {
    const [book, setBook] = useState(startBook)

    const router = useRouter()

    useEffect(() => {
        setBook(startBook)
        console.log('start book', startBook)
    }, [startBook])

    function updateChapterOnChild(parentChapter: OpenedLoreChapter, target: OpenedLoreChapter) {
        parentChapter.children = parentChapter.children.map(
            child => {
                if (child.id === target.id) return target;
                if (child.children.length !== 0) {
                    updateChapterOnChild(child, target)
                }
                return child;
            }
        )
    }

    function insertChapter(chapter: RawLoreChapter, parent?: OpenedLoreChapter) {
        const openedChapter = {...chapter, lores: [], children: []}
        if (parent) {
            parent.children.push(openedChapter)
            updateChapter(parent)
        } else {
            const newBook = {...book}
            newBook.chapters.push(openedChapter)
            setBook(newBook)
        }
    }

    function updateChapter(target: OpenedLoreChapter) {
        const newBook = {...book}
        newBook.chapters = book.chapters.map(c => c.id === target.id ? target : c)
        for (const chapter of newBook.chapters) {
            updateChapterOnChild(chapter, target)
        }
        setBook(newBook)
    }

    function deleteOnChild(parentChapter: OpenedLoreChapter, targetId: string) {
        parentChapter.children = parentChapter.children.filter(child => {
            if (child.id === targetId) {
                return false; // 삭제
            }
            // 자식에게 삭제 작업 전달 (재귀)
            deleteOnChild(child, targetId);
            return true; // 유지
        });
    }

    function deleteChapter(targetChapter: OpenedLoreChapter) {
        const newBook = {...book}
        newBook.chapters = book.chapters.filter(c => c.id !== targetChapter.id)

        newBook.chapters = newBook.chapters.filter(chapter => {
            if (chapter.id === targetChapter.id) {
                return false; // 삭제
            }
            if (chapter.children.length === 0) return true;
            // 재귀적으로 자식 삭제
            deleteOnChild(chapter, targetChapter.id);
            return true; // 유지
        });

        setBook(newBook)
    }

    function insertLore(lore: RawLore, parent: OpenedLoreChapter) {
        const newLore = {...lore, summarized: undefined}
        parent.lores.push(newLore)
        updateChapter(parent)
    }

    function updateLore(chapter: OpenedLoreChapter, lore: Lore) {
        const newChapter = {...chapter}
        newChapter.lores = chapter.lores.map(l => l.id === lore.id ? lore : l)
        updateChapter(newChapter)
    }

    function deleteLore(chapter: OpenedLoreChapter, lore: Lore) {
        const newChapter = {...chapter}
        newChapter.lores = chapter.lores.filter(l => l.id !== lore.id)
        updateChapter(newChapter)
    }

    async function applyLoreBookValue(value: string, target: keyof LoreBook) {
        const newBook = {...book}
        const data: Partial<LoreBook> = {
            [target]: value
        }

        const updated = await updateLoreBook(book.id, data)
        newBook[target] = updated[target]
        setBook(newBook)
    }

    const controller = (
        <div className={`flex flex-col gap-2${isStandalone ? " p-2" : " mb-4"}`}>
            <SubmitSpan value={book.name} label={"로어북 이름"} submit={async (value) => {
                await applyLoreBookValue(value, "name")
            }}/>
            <SubmitSpan value={book.description} useTextarea label={"로어북 설명"} submit={async (value) => {
                await applyLoreBookValue(value, "description")
            }}/>
            <LoreTestButton book={book}/>
            {isStandalone && <DeleteConfirmButton confirmCount={4} onConfirmedAsync={async () => {
                await deleteLoreBook(book.id)
                router.push('/lores')
            }}/>}
        </div>
    )

    return <>
        {isStandalone ? <YumeMenu>
            {controller}
        </YumeMenu> : controller}
        <section className={"flex flex-col gap-4"}>
            <CreateWithNameButton className={"w-full"} dataName={"챕터"} createSelf={async (name) => {
                insertChapter(await createChapter(book, name));
            }}/>
            <Accordion className={"p-0"} selectionMode={"multiple"} variant={"bordered"}>
                {book.chapters.map((chapter) => <AccordionItem classNames={{
                    title: "px-4",
                    indicator: "px-4",
                }} key={chapter.id} title={chapter.name}>
                    <LoreChapterBox insertChapter={insertChapter} insertLore={insertLore} book={book} chapter={chapter}
                                    updateChapter={updateChapter} updateLore={updateLore}
                                    deleteChapter={deleteChapter} deleteLore={deleteLore}/>
                </AccordionItem>)}
            </Accordion>
        </section>
    </>
}