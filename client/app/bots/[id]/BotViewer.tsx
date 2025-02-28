"use client";

import YumeMenu from "@/components/MenuPortal";
import {useEffect, useRef, useState} from "react";
import SubmitSpan from "@/components/ui/SubmitSpan";
import PromptTextarea from "@/components/ui/PromptTextarea";
import UploadableAvatar from "@/components/features/profileImage/UploadableAvatar";
import DeleteConfirmButton from "@/components/ui/DeleteConfirmButton";
import {useRouter} from "next/navigation";
import Bot, {createLoreBookForBot, deleteBot, putBot} from "@/lib/data/bot/Bot";
import {Accordion, AccordionItem, Button, CircularProgress, Select, SelectItem, Tab, Tabs} from "@nextui-org/react";
import FirstMessage from "@/lib/data/bot/FirstMessage";
import AsyncProgressButton from "@/components/ui/AsyncProgressButton";
import ImageAsset from "@/lib/data/bot/ImageAsset";
import ErrorPopover from "@/components/ui/ErrorPopover";
import Image, {buildImageLink, deleteImage, uploadImage} from "@/lib/data/Image";
import {OpenedLoreBook, readLoreBook} from "@/lib/data/lore/ReadLoreBook";
import LoreBookReaderBox from "@/components/features/lore/LoreBookReaderBox";
import LoreSelectButtonWithModal from "@/components/features/lore/LoreSelectButtonWithModal";
import EditableFilterList from "@/components/features/filter/EditableFilterList";
import ImageAssetGroupRenameButton from "@/components/features/bot/ImageAssetGroupRenameButton";

function simpleStringHash(str: string) {
    var hash = 0,
        i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

export default function BotViewer({startBot}: { startBot: Bot }) {
    const router = useRouter()

    const [bot, setBot] = useState<Bot>(startBot)
    const [status, setStatus] = useState<string>("normal")

    const [firstMessages, setFirstMessages] = useState<FirstMessage[]>([])
    const [selectedFirstMessage, setSelectedFirstMessage] = useState<string>("")
    const [queuedFirstMessage, setQueuedFirstMessage] = useState<string>("")

    const [imageAssets, setImageAssets] = useState<ImageAsset[]>([])

    const hiddenFileInput = useRef<HTMLInputElement>(null);

    const [book, setBook] = useState<OpenedLoreBook | undefined>(undefined)
    const [bookLoadingError, setBookLoadingError] = useState<string | undefined>(undefined)

    useEffect(() => {
        let firstMessageData: FirstMessage[] = [{
            "name": "기본",
            "message": "",
            id: simpleStringHash("기본").toString()
        }]
        if (bot.first_message) {
            try {
                firstMessageData = JSON.parse(bot.first_message)
            } catch {

            }
        }
        if (queuedFirstMessage) {
            setSelectedFirstMessage(queuedFirstMessage)
        } else {
            setSelectedFirstMessage(firstMessageData[0].name)
        }

        setFirstMessages(firstMessageData)

        let imageAssetData: ImageAsset[] = []
        if (bot.image_assets) {
            try {
                imageAssetData = JSON.parse(bot.image_assets)
            } catch {

            }
        }

        setImageAssets(imageAssetData)

        if (bot.lore_book_id) {
            setBookLoadingError(undefined)
            setBook(undefined)
            readLoreBook(bot.lore_book_id).then(book => {
                setBook(book)
            }).catch(err => {
                console.log(err)
                if (err instanceof Error) {
                    setBookLoadingError(err.message)
                } else {
                    setBookLoadingError("알 수 없는 오류")
                }
            })
        }
    }, [bot])

    const [imageAssetUploadErrorMessage, setImageAssetUploadErrorMessage] = useState<string>('')
    const [isInImageAssetUploading, setIsInImageAssetUploading] = useState<boolean>(false)

    async function uploadImageAsset(fileList: FileList) {
        try {
            setImageAssetUploadErrorMessage('')
            const data: Image = await uploadImage('image', fileList[0], 'in_file')

            const filename = fileList[0].name
            const assetName = filename.substring(0, filename.lastIndexOf('.'));

            const newImageAssetData = [...imageAssets, {
                name: assetName,
                alias: '',
                imageId: data.file_id
            }]

            setBot(await putBot(bot.id, {
                image_assets: JSON.stringify(newImageAssetData)
            }))
        } catch (err: any) {
            console.log(err)
            if (err instanceof Error) {
                setImageAssetUploadErrorMessage(err.message)
            }
        } finally {
            setIsInImageAssetUploading(false)
        }
    }

    function getLoreBookDisplay() {
        if (!bot.lore_book_id) {
            return <div className={"h-full flex flex-col gap-4 justify-center items-center"}>
                <span>이 봇에게 아직 할당된 로어북이 없는것 같습니다!</span>
                <AsyncProgressButton onPressAsync={async () => {
                    setBot(await createLoreBookForBot(bot.id))
                }}>
                    로어북 만들기
                </AsyncProgressButton>
                <LoreSelectButtonWithModal bot={bot} setBot={setBot}/>
            </div>
        }

        if (bookLoadingError) {
            return <div className={"h-full flex flex-col gap-4 justify-center items-center"}>
                <span>오류가 발생했습니다: {bookLoadingError}</span>
                <AsyncProgressButton onPressAsync={async () => {
                    window.location.reload()
                }}>
                    새로고침 시도하기
                </AsyncProgressButton>
                <AsyncProgressButton onPressAsync={async () => {
                    setBot(await putBot(bot.id, {
                        "lore_book_id": ""
                    }))
                }}>
                    기존 로어북 연결 해제하기
                </AsyncProgressButton>
            </div>
        }

        if (!book) {
            return <div className={"h-full flex flex-col gap-4 justify-center items-center"}>
                <CircularProgress label={""}/>
            </div>
        }

        return <LoreBookReaderBox startBook={book} extraController={<>
            <AsyncProgressButton onPressAsync={async () => {
                setBot(await putBot(bot.id, {
                    "lore_book_id": ""
                }))
            }}>
                로어북 연결 해제하기
            </AsyncProgressButton>
        </>}/>
    }

    return <>
        <input type={'file'} multiple={false} ref={hiddenFileInput} accept={'image/*'} hidden={true}
               onChange={(event) => {
                   const fileList = event.target.files
                   if (!fileList || !fileList.length) {
                       setIsInImageAssetUploading(false)
                       return
                   }
                   uploadImageAsset(fileList).then()
               }}></input>
        <YumeMenu>
            <div className={"flex flex-col p-2 gap-1"}>
                <SubmitSpan value={bot.name} label={"봇 이름"} submit={async (value) => {
                    setBot(await putBot(bot.id, {
                        name: value
                    }))
                }}/>
                <SubmitSpan value={bot.displayName} label={"봇 닉네임"} submit={async (value) => {
                    setBot(await putBot(bot.id, {
                        displayName: value
                    }))
                }}/>
                <UploadableAvatar profileImageId={bot.profileImageId}
                                  endpoint={`bot/${bot.id}/profile_image`} onEdited={(data: Bot) => {
                    setBot(data)
                }}/>
                {status !== "normal" && <span className={"text-xs"}>프롬프트를 저장하기 전까지 변경할 수 없습니다.</span>}
                <EditableFilterList rawFilters={bot.filters} onEdited={async (filters) => {
                    setBot(await putBot(bot.id, {
                        filters: filters,
                    }))
                }}/>
                <DeleteConfirmButton className={"mt-10"} confirmCount={3} onConfirmed={async () => {
                    await deleteBot(bot.id)
                    router.replace("/bots")
                }}/>
            </div>
        </YumeMenu>
        <div className={"flex flex-col h-full"}>
            <Tabs classNames={{
                base: "flex-0",
                tabContent: "flex-1",
            }}>
                <Tab key="prompt" title="정보 프롬프트" className={"h-full"}>
                    <PromptTextarea setStatus={setStatus} title={"정보 프롬프트"} prompt={bot.prompt}
                                    onSave={async (text) => {
                                        setBot(await putBot(bot.id, {
                                            prompt: text
                                        }))
                                    }}/>
                </Tab>
                <Tab key="post_prompt" title="지시 프롬프트" className={"h-full"}>
                    <PromptTextarea setStatus={setStatus} title={"지시 프롬프트"}
                                    description={"주로 이미지 에셋 표시 지시 등 봇의 구현에는 필요하지만, 봇의 정보가 아닌 내용을 적습니다."}
                                    prompt={bot.post_prompt ?? ''} onSave={async (text) => {
                        setBot(await putBot(bot.id, {
                            post_prompt: text
                        }))
                    }}/>
                </Tab>
                <Tab key={"first-message"} title={"첫 메시지"} className={"h-full"}>
                    <div className={"flex flex-col gap-1 h-full"}>
                        <div className={"flex flex-row"}>
                            <Select disallowEmptySelection selectedKeys={[selectedFirstMessage]} onChange={(event) => {
                                setSelectedFirstMessage(event.target.value)
                            }}>
                                {firstMessages.map((item) => (<SelectItem key={item.name}>{item.name}</SelectItem>))}
                            </Select>
                            <AsyncProgressButton onPressAsync={async () => {
                                firstMessages.forEach((item) => {
                                    if (item.name === '새 첫 메시지') {
                                        throw new Error("최근에 생성한 첫 메시지의 이름을 바꿔주세요.")
                                    }
                                })

                                const newData = [...firstMessages, {
                                    "name": "새 첫 메시지",
                                    "message": "",
                                    "id": simpleStringHash("새 첫 메시지")
                                }]

                                setBot(await putBot(bot.id, {
                                    first_message: JSON.stringify(newData)
                                }))
                                setQueuedFirstMessage("새 첫 메시지")
                            }}>
                                추가하기
                            </AsyncProgressButton>
                            <DeleteConfirmButton confirmCount={3} onConfirmed={async () => {
                                const newData = firstMessages.filter((item) => item.name !== selectedFirstMessage)
                                setBot(await putBot(bot.id, {
                                    first_message: JSON.stringify(newData)
                                }))
                            }}/>
                        </div>
                        <SubmitSpan value={selectedFirstMessage ?? ''} label={"첫 메시지 이름"} submit={async (value) => {
                            firstMessages.forEach((item) => {
                                if (item.name === value) {
                                    throw new Error("이미 동일한 이름의 첫 메시지가 존재합니다.")
                                }
                            })

                            const newData = firstMessages.map((item) => {
                                if (item.name === selectedFirstMessage) {
                                    return {
                                        "name": value,
                                        "id": simpleStringHash(value),
                                        "message": item.message
                                    }
                                }
                                return item
                            })
                            setBot(await putBot(bot.id, {
                                first_message: JSON.stringify(newData)
                            }))
                            setQueuedFirstMessage(value)
                        }}/>
                        <PromptTextarea setStatus={setStatus} title={"첫 메시지"}
                                        prompt={firstMessages.find((item) => item.name === selectedFirstMessage)?.message ?? ""}
                                        onSave={async (text) => {
                                            const newData = firstMessages.map((item) => {
                                                if (item.name === selectedFirstMessage) {
                                                    return {
                                                        "name": item.name,
                                                        "id": item.id,
                                                        "message": text
                                                    }
                                                }
                                                return item
                                            })
                                            setBot(await putBot(bot.id, {
                                                first_message: JSON.stringify(newData)
                                            }))
                                            setQueuedFirstMessage(selectedFirstMessage)
                                        }}/>
                    </div>
                </Tab>
                <Tab key={"lorebook"} title={"로어북"} className={"w-full h-full flex flex-col gap-1"}>
                    {getLoreBookDisplay()}
                </Tab>
                <Tab key={"image-asset"} title={"이미지 에셋"} className={"h-full"}>
                    <div className={"flex flex-col gap-2"}>
                        <ErrorPopover errorMessage={imageAssetUploadErrorMessage}>
                            <Button isLoading={isInImageAssetUploading} className={"w-full"} onPress={async () => {
                                setIsInImageAssetUploading(true)
                                hiddenFileInput.current?.click()
                            }}>
                                업로드
                            </Button>
                        </ErrorPopover>
                        <ImageAssetGroupRenameButton imageAssets={imageAssets} bot={bot} setBot={setBot}/>
                        <Button onPress={() => {
                            const copyText = imageAssets.map((asset) => asset.name).join(',')
                            navigator.clipboard.writeText(copyText).then(() => {
                                alert('복사 완료')
                            }).catch((e) => {
                                prompt('복사에 실패한 것 같습니다, 수동으로 복사해주세요', copyText)
                            })
                        }}>에셋 목록 복사하기</Button>
                    </div>
                    <Accordion>
                        {imageAssets.map((imageAsset) => (
                            <AccordionItem key={imageAsset.imageId} title={imageAsset.name}>
                                <div className={"flex flex-col gap-4"}>
                                    <SubmitSpan value={imageAsset.name} label={'이름'} submit={async (value) => {
                                        const newImageAssets = imageAssets.map((innerImageAsset) => {
                                            if (imageAsset.imageId === innerImageAsset.imageId) {
                                                return {
                                                    name: value,
                                                    alias: innerImageAsset.alias,
                                                    imageId: innerImageAsset.imageId
                                                }
                                            }
                                            return innerImageAsset;
                                        })
                                        setBot(await putBot(bot.id, {
                                            image_assets: JSON.stringify(newImageAssets)
                                        }))
                                    }}/>
                                    <SubmitSpan value={imageAsset.alias} label={'별명'} submit={async (value) => {
                                        const newImageAssets = imageAssets.map((innerImageAsset) => {
                                            if (imageAsset.imageId === innerImageAsset.imageId) {
                                                return {
                                                    name: innerImageAsset.name,
                                                    alias: value,
                                                    imageId: innerImageAsset.imageId
                                                }
                                            }
                                            return innerImageAsset;
                                        })
                                        setBot(await putBot(bot.id, {
                                            image_assets: JSON.stringify(newImageAssets)
                                        }))
                                    }}/>
                                    <DeleteConfirmButton confirmCount={3} onConfirmed={async () => {
                                        const newImageAssets = imageAssets.filter((innerImageAsset) => {
                                            return imageAsset.imageId !== innerImageAsset.imageId;
                                        })

                                        await deleteImage(imageAsset.imageId)

                                        setBot(await putBot(bot.id, {
                                            image_assets: JSON.stringify(newImageAssets)
                                        }))
                                    }}/>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img className={"w-fit h-fit"} alt={imageAsset.name}
                                         src={buildImageLink(imageAsset.imageId, 'display')}/>
                                </div>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </Tab>
            </Tabs>
        </div>
    </>
}