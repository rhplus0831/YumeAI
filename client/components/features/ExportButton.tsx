import {
    Button,
    ButtonProps,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Progress
} from "@nextui-org/react";
import {useState} from "react";
import ErrorPopover from "@/components/ui/ErrorPopover";
import {dumpAllRooms, getRoom} from "@/lib/data/Room";
import {Exporter} from "@/lib/data/Exporter";
import {getBots} from "@/lib/data/bot/Bot";
import {getPersonas} from "@/lib/data/Persona";
import {getPrompts} from "@/lib/data/Prompt";

export interface ExportButtonProps extends ButtonProps {
    export_type: 'all' | 'room' | 'room_and_chat'
    export_id?: string
    label: string
}

export default function ExportButton(props: ExportButtonProps) {
    const {export_type, export_id, label, children, ...restProps} = props

    const [errorMessage, setErrorMessage] = useState<string>("");
    const [isExporting, setIsExporting] = useState(false)
    const [exportStatus, setExportStatus] = useState<string>("초기화...")
    const [exportExtraStatus, setExportExtraStatus] = useState<string>("초기화...")

    async function exportData() {
        setIsExporting(true)
        try {
            const exporter = new Exporter(setExportExtraStatus)
            if (export_type.startsWith('room')) {
                if (!export_id) {
                    throw new Error("export_id is required")
                }
                const room = await getRoom(export_id)
                setExportStatus(`방 내보내기: ${room.name}`)
                await exporter.exportRoom(export_id, export_type == "room_and_chat")
            } else if (export_type == 'all') {
                setExportStatus("모두 내보내기...")
                let offset = 0;
                const limit = 100;
                while (true) {
                    const data = await dumpAllRooms(offset, limit)
                    if (data.length == 0) {
                        break
                    }
                    for (const room of data) {
                        await exporter.exportRawRoom(room, true)
                    }
                    offset += data.length;
                }

                offset = 0;
                while (true) {
                    const data = await getBots(offset, limit)
                    if (data.length == 0) {
                        break
                    }
                    for (const bot of data) {
                        await exporter.exportRawBot(bot)
                    }
                    offset += data.length;
                }

                offset = 0;
                while (true) {
                    const data = await getPersonas(offset, limit)
                    if (data.length == 0) {
                        break
                    }
                    for (const persona of data) {
                        await exporter.exportRawPersona(persona)
                    }
                    offset += data.length;
                }

                offset = 0;
                while (true) {
                    const data = await getPrompts("all", offset, limit)
                    if (data.length == 0) {
                        break
                    }
                    for (const prompt of data) {
                        await exporter.exportRawPrompt(prompt)
                    }
                    offset += data.length;
                }

                // Conversation, Summary is included in room
                // Image is included in persona, bot
            }

            exporter.finishAndDownload()
        } catch (err) {
            console.log(err)
            if (err instanceof Error) {
                setErrorMessage(err.message)
            }
        } finally {
            setIsExporting(false)
        }
    }

    return <>
        <Modal isOpen={isExporting}>
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">{label}</ModalHeader>
                        <ModalBody>
                            <Progress isIndeterminate label={exportStatus + ' -> ' + exportExtraStatus}
                                      className="max-w-md" size="sm"/>
                        </ModalBody>
                        <ModalFooter/>
                    </>
                )}
            </ModalContent>
        </Modal>
        <ErrorPopover errorMessage={errorMessage}>
            <Button {...restProps} onPress={exportData} isLoading={isExporting}>{children ?? label}</Button>
        </ErrorPopover>
    </>
}