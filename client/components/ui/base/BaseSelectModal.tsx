"use client";

import {Button, Modal, ModalContent, ModalFooter, ModalHeader} from "@nextui-org/react";
import NextUIDisclosure from "@/components/nextUIDisclosure";
import {ReactNode, RefObject, useEffect} from "react";
import BaseSelectableCard from "@/components/ui/base/BaseSelectableCard";
import BaseData from "@/lib/data/BaseData";
import {useListAPI} from "@/lib/data/useListAPI";
import {useInfiniteScroll} from "@nextui-org/use-infinite-scroll";
import {Simulate} from "react-dom/test-utils";

export default function BaseSelectModal<Data extends BaseData>({
                                                                   disclosure,
                                                                   displayName,
                                                                   datas,
                                                                   endpoint,
                                                                   generateBox,
                                                                   onSelect,
                                                                   extraFooter
                                                               }: {
    disclosure: NextUIDisclosure,
    displayName: string,
    generateBox: (data: Data) => ReactNode,
    datas?: Data[],
    endpoint?: string,
    onSelect: (data: Data) => Promise<void>,
    extraFooter?: ReactNode,
}) {
    const {items, loadSelf, hasMore, onLoadMore} = useListAPI<Data>({
        endpoint: endpoint,
        limit: 5
    })

    const [, scrollerRef] = useInfiniteScroll({
        hasMore,
        isEnabled: disclosure.isOpen,
        shouldUseLoader: false,
        onLoadMore,
    });

    useEffect(() => {
        if (endpoint && disclosure.isOpen) {
            loadSelf()
        }
    }, [endpoint, disclosure.isOpen]);

    return <Modal isOpen={disclosure.isOpen} size={"md"} onOpenChange={disclosure.onOpenChange}>
        <ModalContent>
            {(onClose) => (
                <>
                    <ModalHeader className="flex flex-col gap-1">{displayName} 선택하기</ModalHeader>
                    <div ref={scrollerRef as RefObject<HTMLDivElement>}
                         className={"px-6 flex-1 max-h-80 overflow-y-scroll"}>
                        <div className={"py-4 flex flex-col gap-4"}>
                            {(endpoint ? items : datas!!).map((data) => {
                                return <BaseSelectableCard key={data.id} onSelect={async () => {
                                    await onSelect(data)
                                }} generateBox={generateBox} data={data}/>
                            })}
                        </div>
                    </div>
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