"use client";

import GlobalSettings from "@/lib/data/GlobalSettings";
import {
    Accordion,
    AccordionItem,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow
} from "@nextui-org/react";
import SubmitSingleSettingSpan from "@/components/features/settings/SubmitSingleSettingSpan";
import {siteConfig} from "@/config/site";

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
                <Table aria-label="요약 시스템 설명 테이블">
                    <TableHeader>
                        <TableColumn>단계</TableColumn>
                        <TableColumn>설명</TableColumn>
                        <TableColumn>관련 설정</TableColumn>
                        <TableColumn>설정 영향</TableColumn>
                    </TableHeader>
                    <TableBody>
                        <TableRow key={1}>
                            <TableCell>메시지 확정시 요약</TableCell>
                            <TableCell>사용자가 메시지를 보내면, 이전 메시지는 추가로 변경할 점이 없다고 확정하고 메시지 요약을 만들어 보관합니다.</TableCell>
                            <TableCell>없음</TableCell>
                            <TableCell>없음</TableCell>
                        </TableRow>
                        <TableRow key={2}>
                            <TableCell>요약 사용</TableCell>
                            <TableCell>최대 대화 갯수를 초과하는 오래된 메시지들은 원본 대신 메시지 요약을 보냅니다.</TableCell>
                            <TableCell>최대 대화 갯수</TableCell>
                            <TableCell>낮을 수록 토큰 사용량이 줄어들 수 있지만, AI에게 제공되는 원본 메시지의 갯수가 줄어들어 상황 파악을 힘들어 할 수 있습니다. 너무 높으면
                                토큰을 과하게 사용하거나 컨텍스트 길이 제한에 걸릴 수 있습니다.</TableCell>
                        </TableRow>
                        <TableRow key={3}>
                            <TableCell>메시지 요약의 요약</TableCell>
                            <TableCell>보내야 하는 메시지 요약의 갯수가 최대 요약 갯수에 도달하거나 초과하면, 이 요약들을
                                묶어서 재요약이 생성됩니다.</TableCell>
                            <TableCell>최대 요약 갯수</TableCell>
                            <TableCell>낮을 수록 메시지 요약이 빠르게 요약되어 상세한 정보를 빠르게 잊어버릴 수
                                있습니다.</TableCell>
                        </TableRow>
                        <TableRow key={4}>
                            <TableCell>재요약의 요약</TableCell>
                            <TableCell>보내야 하는 재요약의 갯수가 최대 재 요약 갯수에 도달하거나 초과하면, 이 재요약들을 묶어서 하나로
                                요약합니다.</TableCell>
                            <TableCell>최대 재 요약 갯수</TableCell>
                            <TableCell>낮을 수록 재요약이 빠르게 하나로 요약되어 상세한 정보를 빠르게 잊어버릴 수
                                있습니다.</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
                <SubmitSingleSettingSpan startValue={settings.max_conversation_count}
                                         enforceNumberRange={[1, 1000000]}
                                         valueKey={'max_conversation_count'} placeholder={"3"} enforceInteger
                                         label={'최대 대화 갯수'}/>
                <SubmitSingleSettingSpan startValue={settings.max_summary_count} placeholder={"3"}
                                         enforceNumberRange={[1, 1000000]}
                                         valueKey={'max_summary_count'}
                                         enforceInteger label={'최대 요약 갯수'}/>
                <SubmitSingleSettingSpan startValue={settings.max_re_summary_count} placeholder={"3"}
                                         valueKey={'max_re_summary_count'}
                                         enforceNumberRange={[1, 1000000]}
                                         enforceInteger label={'최대 재 요약 갯수'}/>
            </div>
        </AccordionItem>
    </Accordion>
        <div className={"mt-5 w-full text-center"}>YumeAI {siteConfig.version} - Yume like Ai with your AI</div>
    </>
}