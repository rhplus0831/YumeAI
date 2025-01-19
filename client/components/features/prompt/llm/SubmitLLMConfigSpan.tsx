import SubmitSpan, {SubmitSpanProps} from "@/components/ui/SubmitSpan";

export interface SubmitLLMConfigSpanProps extends Omit<SubmitSpanProps, "value" | "submit"> {
    config: Record<string, any>,
    configKey: string,
    defaultValue?: string,
    submitConfig: (json_config: string) => Promise<void>
}

export default function SubmitLLMConfigSpan(props: SubmitLLMConfigSpanProps) {
    const {config, configKey, defaultValue, submitConfig, ...restProps} = props

    return <SubmitSpan {...restProps}
                       value={config[configKey] ? config[configKey].toString() : (defaultValue ?? '')}
                       submit={async (submitValue) => {
                           config[configKey] = submitValue
                           await submitConfig(JSON.stringify(config))
                       }}/>
}