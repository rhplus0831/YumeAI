"use client";

import GlobalSettings from "@/lib/data/GlobalSettings";
import {Accordion, AccordionItem} from "@nextui-org/react";
import SubmitSingleSettingSpan from "@/components/features/settings/SubmitSingleSettingSpan";
import {siteConfig} from "@/config/site";
import ExportButton from "@/components/features/ExportButton";
import YumeImportButton from "@/components/features/room/YumeImportButton";
import ClearAllButton from "@/components/features/settings/ClearAllButton";

export default function SettingsViewer({settings}: { settings: GlobalSettings }) {
    return <><Accordion variant={"splitted"} selectionMode={"multiple"}>
        <AccordionItem key={"key"} title={"기본 API 키"}>
            <div className={"flex flex-col gap-4"}>
                <SubmitSingleSettingSpan startValue={settings.openai_api_key} hideOnIdle valueKey={'openai_api_key'}
                                         label={'기본 OpenAI API 키'}/>
                <SubmitSingleSettingSpan startValue={settings.gemini_api_key} hideOnIdle valueKey={'gemini_api_key'}
                                         label={'기본 Gemini API 키'}/>
            </div>
        </AccordionItem>
        <AccordionItem key={"summary"} title={"요약 시스템"}>
            <div className={"flex flex-col gap-4"}>
                <SubmitSingleSettingSpan startValue={settings.max_conversation_count}
                                         enforceNumberRange={[1, 1000000]}
                                         valueKey={'max_conversation_count'} placeholder={"3"} enforceInteger
                                         description={"요약하지 않고 보낼 최대 대화 갯수입니다. 이 갯수를 초과한 대화는 요약된 정보가 전달됩니다."}
                                         label={'최대 대화 갯수'}/>
                <SubmitSingleSettingSpan startValue={settings.max_summary_count} placeholder={"3"}
                                         enforceNumberRange={[1, 1000000]}
                                         valueKey={'max_summary_count'}
                                         description={"요약된 대화의 최대 전송 갯수입니다. 이 갯수를 초과하는 경우 요약된 대화를 모아서 재 요약으로 만듭니다."}
                                         enforceInteger label={'최대 요약 갯수'}/>
                <SubmitSingleSettingSpan startValue={settings.max_re_summary_count} placeholder={"3"}
                                         valueKey={'max_re_summary_count'}
                                         enforceNumberRange={[1, 1000000]}
                                         description={"재요약의 최대 전송 갯수입니다. 이 갯수를 초과하는 경우 재요약을 모아서 하나의 재요약으로 합칩니다."}
                                         enforceInteger label={'최대 재 요약 갯수'}/>
            </div>
        </AccordionItem>
        <AccordionItem key={"data-manage"} title={"데이터 관리"}>
            <div className={"flex flex-col gap-4"}>
                <YumeImportButton/>
                <ExportButton export_type={'all'} label={'모든 데이터 내보내기'}/>
                <span className={"text-xs"}>모든 데이터를 내보냅니다, API키 정보는 기록되지 않으며, 비암호화 상태로 저장됩니다.</span>
                <ClearAllButton/>
            </div>
        </AccordionItem>
    </Accordion>
        <div className={"mt-5 w-full text-center"}>YumeAI {siteConfig.version} - Yume like Ai with your AI</div>
    </>
}