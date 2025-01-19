import {putSingleSetting} from "@/lib/data/GlobalSettings";
import SubmitSpan, {SubmitSpanProps} from "@/components/ui/SubmitSpan";
import {useState} from "react";

export interface SubmitSingleSettingSpanProps extends Omit<SubmitSpanProps, "value" | "submit"> {
    startValue?: string,
    valueKey: string,
}

export default function SubmitSingleSettingSpan(props: SubmitSingleSettingSpanProps) {
    const {startValue, valueKey, ...restProps} = props

    const [value, setValue] = useState(startValue ?? '');

    return <SubmitSpan {...restProps} value={value} submit={async (value) => {
        await putSingleSetting(valueKey, value)
        setValue(value)
    }}/>
}