"use server";

import GlobalSettings, {getGlobalSettings} from "@/lib/data/GlobalSettings";
import SettingsViewer from "@/app/settings/SettingsViewer";

export default async function SettingsPage() {
    const settings: GlobalSettings = await getGlobalSettings()

    return <SettingsViewer settings={settings}/>
}