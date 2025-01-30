import AsyncProgressButton from "@/components/ui/AsyncProgressButton";
import {RefObject} from "react";
import OperationLog from "@/lib/data/OperationLog";
import {Button, Modal, ModalContent, ModalFooter, ModalHeader, useDisclosure} from "@nextui-org/react";
import OperationLogBox from "@/components/features/log/OperationLogBox";
import Room from "@/lib/data/Room";
import {Card, CardBody} from "@nextui-org/card";
import {useInfiniteScroll} from "@nextui-org/use-infinite-scroll";
import {useListAPI} from "@/lib/data/useListAPI";

export default function RoomOperationLogQueryButton({room}: { room: Room }) {
    const {isOpen, onOpen, onOpenChange} = useDisclosure();

    const {items, loadSelf, hasMore, onLoadMore} = useListAPI<OperationLog>({
        endpoint: `room/${room.id}/log?`,
        limit: 2
    })

    const [, scrollerRef] = useInfiniteScroll({
        hasMore,
        isEnabled: isOpen,
        shouldUseLoader: false,
        onLoadMore,
    });

    return <>
        <Modal size={"full"} isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent className={"flex flex-col"}>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex-0 flex flex-col gap-1">방과 관련된 작업 로그</ModalHeader>
                        <div ref={scrollerRef as RefObject<HTMLDivElement>} className={"px-6 flex-1 overflow-y-scroll"}>
                            <div className={"py-2 flex flex-col gap-2"}>
                                {items.map((log) => {
                                    return <Card key={log.id}>
                                        <CardBody>
                                            <OperationLogBox log={log}/>
                                        </CardBody>
                                    </Card>
                                })}
                            </div>
                        </div>
                        <ModalFooter className={"flex-0"}>
                            <Button color="danger" variant="light" onPress={onClose}>
                                닫기
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
        <AsyncProgressButton onPressAsync={async () => {
            await loadSelf()
            onOpen()
        }}>방과 관련된 작업 기록 보기</AsyncProgressButton>
    </>
}