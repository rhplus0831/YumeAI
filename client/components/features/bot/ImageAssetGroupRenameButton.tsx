"use client";

import {Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure} from "@nextui-org/react";
import ImageAsset from "@/lib/data/bot/ImageAsset";
import Bot, {putBot} from "@/lib/data/bot/Bot";
import {Input} from "@nextui-org/input";
import {useState} from "react";
import AsyncProgressButton from "@/components/ui/AsyncProgressButton";
import {inspect} from "util-ex";
import {dynamicRegexReplace} from "@/lib/data/Filter";
import undefined = inspect.styles.undefined;

export default function ImageAssetGroupRenameButton({imageAssets, bot, setBot}: {
    imageAssets: ImageAsset[],
    bot: Bot,
    setBot: (bot: Bot) => void
}) {
    const {isOpen, onOpen, onOpenChange} = useDisclosure()

    const [findRegex, setFindRegex] = useState("")
    const [replaceRegex, setReplaceRegex] = useState("")

    const [backup, setBackup] = useState<string | undefined>(undefined)

    return <>
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader>에셋 이름 일괄변경</ModalHeader>
                        <ModalBody>
                            <Input label={"찾는 정규식"} onValueChange={setFindRegex}/>
                            <Input label={"바꾸는 정규식"} onValueChange={setReplaceRegex}/>
                        </ModalBody>
                        <ModalFooter>
                            <AsyncProgressButton onPressAsync={async () => {
                                if (!findRegex) {
                                    throw new Error("찾는 정규식이 비어 있습니다")
                                }
                                const newAssets = imageAssets.map((asset) => {
                                    asset.name = dynamicRegexReplace(asset.name, findRegex, replaceRegex)
                                    return asset
                                })
                                const newAssetsJson = JSON.stringify(newAssets)
                                setBackup(bot.image_assets)
                                setBot(await putBot(bot.id, {
                                    image_assets: newAssetsJson
                                }))
                                onClose()
                            }}>실행하기</AsyncProgressButton>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
        <Button className={"w-full"} onPress={onOpen}>
            에셋 이름 일괄변경
        </Button>
        {backup !== undefined && <AsyncProgressButton color={"warning"} onPressAsync={async () => {
            setBot(await putBot(bot.id, {
                image_assets: backup
            }))
            setBackup(undefined)
        }} className={"w-full mt-2"}>변경 되돌리기</AsyncProgressButton>}
    </>
}