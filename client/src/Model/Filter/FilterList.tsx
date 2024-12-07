import React, {useEffect, useState} from "react";
import Filter from "./Filter.ts";
import FilterBox from "./FilterBox.tsx";
import {
    Button, HStack, Input, Modal, ModalBody,
    ModalCloseButton,
    ModalContent, ModalFooter,
    ModalHeader,
    ModalOverlay,
    Stack,
    Text,
    StackDivider,
    useDisclosure, VStack, Select
} from "@chakra-ui/react";
import SendingAlert from "../../Base/SendingAlert/SendingAlert.tsx";
import DeleteConfirmButton from "../../Base/DeleteConfirmButton.tsx";

export default function FilterList({filters_raw, onEdited = undefined}: {
    filters_raw: string,
    onEdited?: (data: string) => void
}) {
    const modalProps = useDisclosure()
    const initialRef = React.useRef(null)

    const [filters, setFilters] = useState<Filter[]>([])

    useEffect(() => {
        try {
            setFilters(JSON.parse(filters_raw))
        } catch {
            setFilters([])
        }
    }, [filters_raw])

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

    const openEditor = (data: Filter) => {
        setEditName(data.name)
        setEditType(data.type)
        setEditRegex(data.regex)
        setEditReplace(data.replace)
        setEditingFilter(data)
        modalProps.onOpen()
    }

    return (<>
        <Stack padding={'8px'} divider={<StackDivider/>} spacing='4'>
            {filters.map((filter) => (
                <FilterBox filter={filter} openEditor={openEditor}/>
            ))}
        </Stack>
        <Button onClick={() => {
            setFilters(filters.concat([{
                "timestamp": Date.now(),
                "name": "",
                "type": "input",
                "regex": "",
                "replace": ""
            }]))
        }}>필터 추가하기</Button>
        <Modal
            initialFocusRef={initialRef}
            {...modalProps}
        >
            <ModalOverlay/>
            <ModalContent>
                <ModalHeader>필터 수정</ModalHeader>
                <ModalCloseButton/>
                <ModalBody pb={6}>
                    <Text>필터 이름</Text>
                    <Input value={editName} onChange={(event) => {
                        setEditName(event.target.value)
                    }}/>
                    <Text>필터 적용타입</Text>
                    <Select value={editType} onChange={(event) => {
                        setEditType(event.target.value)
                    }}>
                        <option value='input'>입력문</option>
                        <option value='output'>출력문</option>
                        <option value='display'>표시</option>
                        <option value='display-final'>최종 표시</option>
                        <option value='translate'>번역문</option>
                    </Select>
                    <Text fontSize={"sm"}>{getDescription(editType)}</Text>
                    <Text>찾는(IN) 정규식</Text>
                    <Input value={editRegex} onChange={(event) => {
                        setEditRegex(event.target.value)
                    }}/>
                    <Text>바꾸는(OUT) 정규식</Text>
                    <Input value={editReplace} onChange={(event) => {
                        setEditReplace(event.target.value)
                    }}/>
                </ModalBody>
                <ModalFooter>
                    <VStack width={"auto"}>
                        <HStack>
                            <DeleteConfirmButton onConfirmed={async () => {
                                if (!editingFilter) return
                                const newFilters = filters.filter((item) => (
                                    item.timestamp != editingFilter.timestamp
                                ))
                                setFilters(newFilters)
                                const value = JSON.stringify(newFilters)
                                onEdited?.(value)
                                modalProps.onClose()
                            }}/>
                            <Button colorScheme='blue' onClick={() => {
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
                                modalProps.onClose()
                            }}>
                                수정하기
                            </Button>
                            <Button onClick={modalProps.onClose}>취소</Button>
                        </HStack>
                    </VStack>
                </ModalFooter>
            </ModalContent>
        </Modal>
    </>)
}