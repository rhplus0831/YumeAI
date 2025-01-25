import Persona from "@/lib/data/Persona";
import YumeAvatar from "@/components/ui/YumeAvatar";

import {buildImageLink} from "@/lib/data/Image";

export function PersonaBox({persona}: { persona: Persona }) {
    return <div className={"flex-1 flex flex-row items-center gap-4"}>
        <YumeAvatar src={buildImageLink(persona?.profileImageId, "avatar")}/>
        {persona.displayName ?
            <span>{persona.displayName} ({persona.name})</span>
            :
            <span>{persona.name}</span>
        }
    </div>
}