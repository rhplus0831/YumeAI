import Bot from "../Bot/Bot";
import Persona from "../Persona/Persona";
import BaseData from "../Base/BaseData.ts";
import Prompt from "../Prompt/Prompt.ts";

export default interface Room extends BaseData {
    name: string
    bot: Bot | undefined,
    persona: Persona | undefined,
    prompt: Prompt | undefined,
    summary_prompt: Prompt | undefined
    translate_prompt: Prompt | undefined
}