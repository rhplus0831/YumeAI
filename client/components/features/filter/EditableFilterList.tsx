"use client";

import Filter from "@/lib/data/Filter";
import {useEffect, useState} from "react";
import {
    Button,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
    useDisclosure
} from "@nextui-org/react";
import FilterButton from "@/components/features/filter/FilterButton";
import {Input} from "@nextui-org/input";
import DeleteConfirmButton from "@/components/ui/DeleteConfirmButton";
import AsyncProgressButton from "@/components/ui/AsyncProgressButton";

export default function EditableFilterList({rawFilters, onEdited}: {
    rawFilters?: string,
    onEdited: (filters: string) => Promise<void>
}) {
    const modalProps = useDisclosure()
    const [filters, setFilters] = useState<Filter[]>([])

    useEffect(() => {
        if (!rawFilters) {
            setFilters([])
            return
        }

        try {
            setFilters(JSON.parse(rawFilters))
        } catch {
            setFilters([])
        }
    }, [rawFilters])

    const [editingFilter, setEditingFilter] = useState<Filter | undefined>(undefined)
    const [editName, setEditName] = useState<string>("")
    const [editType, setEditType] = useState<string>("input")
    const [editRegex, setEditRegex] = useState<string>("")
    const [editReplace, setEditReplace] = useState<string>("")

    const getDescription = (type: string) => {
        if (type === "input") return "유저가 입력을 보내기 전에 문장을 수정합니다"
        if (type === "output") return "봇의 응답을 수정합니다"
        if (type === "display") return "응답이 표시되기 전 변경합니다. 번역에 영향을 줍니다."
        if (type === "display-final") return "응답이 표시되기 전 변경합니다. 번역에 영향을 주지 않습니다."
        if (type === "translate") return "번역의 결과물을 수정합니다."
        return "알 수 없는 오류?"
    }

    function openEditor(filter: Filter) {
        setEditName(filter.name)
        setEditType(filter.type)
        setEditRegex(filter.regex)
        setEditReplace(filter.replace)
        setEditingFilter(filter)
        modalProps.onOpen()
    }

    return <div>
        <span>필터 목록</span>
        <section className={"flex flex-col gap-1"}>
            {filters.map(filter => <FilterButton key={filter.timestamp} filter={filter} openEditor={openEditor}/>)}
            <AsyncProgressButton key={"add-button"} className={"w-full"} onPressAsync={async () => {
                setFilters(filters.concat([{
                    "timestamp": Date.now(),
                    "name": "",
                    "type": "input",
                    "regex": "",
                    "replace": ""
                }]))
                const value = JSON.stringify(filters)
                onEdited?.(value)
            }}>필터 추가하기</AsyncProgressButton>
        </section>
        <Modal isOpen={modalProps.isOpen} onOpenChange={modalProps.onOpenChange}>
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">필터 수정</ModalHeader>
                        <ModalBody>
                            <Input label={"필터 이름"} value={editName} onChange={(event) => {
                                setEditName(event.target.value)
                            }}/>
                            <Select selectedKeys={[editType]} onChange={(event) => {
                                setEditType(event.target.value)
                            }}>
                                <SelectItem key={"input"}>입력문</SelectItem>
                                <SelectItem key={"output"}>출력문</SelectItem>
                                <SelectItem key={"display"}>표시</SelectItem>
                                <SelectItem key={"display-final"}>최종 표시</SelectItem>
                                <SelectItem key={"translate"}>번역문</SelectItem>
                            </Select>
                            <span className={"text-xs"}>{getDescription(editType)}</span>
                            <Input label={"찾는 정규식"} value={editRegex} onChange={(event) => {
                                setEditRegex(event.target.value)
                            }}/>
                            <Input label={"바꾸는 정규식"} value={editReplace} onChange={(event) => {
                                setEditReplace(event.target.value)
                            }}/>
                        </ModalBody>
                        <ModalFooter>
                            <DeleteConfirmButton confirmCount={3} onConfirmed={async () => {
                                if (!editingFilter) return
                                const newFilters = filters.filter((item) => (
                                    item.timestamp != editingFilter.timestamp
                                ))
                                setFilters(newFilters)
                                const value = JSON.stringify(newFilters)
                                onEdited?.(value)
                                onClose()
                            }}/>
                            <AsyncProgressButton onPressAsync={async () => {
                                if (!editingFilter) return
                                const make = editingFilter
                                make.name = editName
                                make.type = editType
                                make.regex = editRegex
                                make.replace = editReplace

                                const newFilters = filters.map((item: Filter) => {
                                    if (make.timestamp == item.timestamp) {
                                        return make
                                    } else {
                                        return item
                                    }
                                })
                                setFilters(newFilters)
                                const value = JSON.stringify(newFilters)
                                onEdited?.(value)

                                onClose()
                            }}>저장</AsyncProgressButton>
                            <Button onPress={onClose}>취소</Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    </div>
}