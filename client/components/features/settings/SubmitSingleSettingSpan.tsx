import {putSingleSetting} from "@/lib/data/GlobalSettings";
import SubmitSpan from "@/components/ui/SubmitSpan";
import {ReactNode, useState} from "react";

export default function SubmitSingleSettingSpan({startValue, valueKey, label, description, enforceNumber, hideOnIdle, placeholder}: {
    startValue?: string,
    valueKey: string,
    label: string,
    description?: ReactNode,
    hideOnIdle?: boolean,
    enforceNumber?: boolean,
    placeholder?: string,
}) {
    const [value, setValue] = useState(startValue ?? '');

    return <SubmitSpan value={value} placeholder={placeholder} label={label} hideOnIdle={hideOnIdle} description={description} enforceNumber={enforceNumber} submit={async (value) => {
        await putSingleSetting(valueKey, value)
        setValue(value)
    }}/>
}