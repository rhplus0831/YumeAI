import Bot from "../Bot/Bot";
import Persona from "../Persona/Persona";
import BaseData from "../Base/BaseData.ts";

export default interface Room extends BaseData {
    name: string
    bot: Bot | undefined,
    persona: Persona | undefined,
}