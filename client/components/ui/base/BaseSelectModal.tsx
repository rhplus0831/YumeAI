"use client";

import {Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from "@nextui-org/react";
import NextUIDisclosure from "@/components/nextUIDisclosure";
import {ReactNode} from "react";
import BaseSelectableCard from "@/components/ui/base/BaseSelectableCard";
import BaseData from "@/lib/data/BaseData";

export default function BaseSelectModal<Data extends BaseData>({disclosure, displayName, datas, generateBox, onSelect, extraFooter}: {
    disclosure: NextUIDisclosure,
    displayName: string,
    generateBox: (data: Data) => ReactNode,
    datas: Data[],
    onSelect: (data: Data) => Promise<void>,
    extraFooter?: ReactNode,
}) {
    return <Modal isOpen={disclosure.isOpen} onOpenChange={disclosure.onOpenChange}>
        <ModalContent>
            {(onClose) => (
                <>
                    <ModalHeader className="flex flex-col gap-1">{displayName} 선택하기</ModalHeader>
                    <ModalBody className={"flex flex-col gap-4"}>
                        {datas.map((data) => {
                            return <BaseSelectableCard key={data.id} onSelect={async () => {
                                await onSelect(data)
                            }} generateBox={generateBox} data={data} />
                        })}
                    </ModalBody>
                    <ModalFooter>
                        {extraFooter && extraFooter}
                        <Button color="danger" variant="light" onPress={onClose}>
                            닫기
                        </Button>
                    </ModalFooter>
                </>
            )}
        </ModalContent>
    </Modal>
}