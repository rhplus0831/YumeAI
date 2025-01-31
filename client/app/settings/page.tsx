"use server";

import GlobalSettings, {getGlobalSettings} from "@/lib/data/GlobalSettings";
import SettingsViewer from "@/app/settings/SettingsViewer";
import {getVersionInfo} from "@/lib/version";

export default async function SettingsPage() {
    const settings: GlobalSettings = await getGlobalSettings()
    const version = getVersionInfo()

    return <SettingsViewer settings={settings} version={version}/>
}