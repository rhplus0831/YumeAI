"use client";

import Persona, {deletePersona, putPersona} from "@/lib/data/Persona";
import YumeMenu from "@/components/MenuPortal";
import {useState} from "react";
import SubmitSpan from "@/components/ui/SubmitSpan";
import PromptTextarea from "@/components/ui/PromptTextarea";
import UploadableAvatar from "@/components/features/profileImage/UploadableAvatar";
import DeleteConfirmButton from "@/components/ui/DeleteConfirmButton";
import {useRouter} from "next/navigation";

export default function PersonaViewer({startPersona}: { startPersona: Persona }) {
    const [persona, setPersona] = useState<Persona>(startPersona)
    const router = useRouter()

    return <>
        <YumeMenu>
            <div className={"flex flex-col p-2 gap-1"}>
                <SubmitSpan value={persona.name} label={"페르소나 이름"} submit={async (value) => {
                    setPersona(await putPersona(persona.id, {
                        name: value
                    }))
                }}/>
                <SubmitSpan value={persona.displayName} label={"페르소나 닉네임"} submit={async (value) => {
                    setPersona(await putPersona(persona.id, {
                        displayName: value
                    }))
                }}/>
                <UploadableAvatar profileImageId={persona.profileImageId} endpoint={`persona/${persona.id}/profile_image`} onEdited={(data: Persona) => {
                    setPersona(data)
                }}/>
                <DeleteConfirmButton confirmCount={3} onConfirmed={async () => {
                    await deletePersona(persona.id)
                    router.replace("/personas")
                }} />
            </div>
        </YumeMenu>
        <PromptTextarea title={"프롬프트"} prompt={persona.prompt} onSave={async (text) => {
            setPersona(await putPersona(persona.id, {
                prompt: text
            }))
        }}/>
    </>
}