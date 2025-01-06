import BaseData from "./BaseData"
import Bot from "@/lib/data/Bot";
import Persona from "@/lib/data/Persona";
import Prompt from "@/lib/data/Prompt";

export default interface Room extends BaseData {
    name: string
    bot: Bot | undefined,
    persona: Persona | undefined,
    prompt: Prompt | undefined,
    summary_prompt: Prompt | undefined
    re_summary_prompt: Prompt | undefined
    translate_method: string | undefined
    translate_prompt: Prompt | undefined
    translate_only_assistant: boolean
}