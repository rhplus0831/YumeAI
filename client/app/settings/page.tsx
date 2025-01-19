import GlobalSettings from "@/lib/data/GlobalSettings";
import {api} from "@/lib/api-client";
import SettingsViewer from "@/app/settings/SettingsViewer";

export default async function SettingsPage() {
    const settings: GlobalSettings = await api('settings', {
        method: 'GET'
    })

    return <SettingsViewer settings={settings}/>
}