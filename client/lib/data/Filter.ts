export default interface Filter {
    timestamp: number
    name: string
    type: string  //input, output, display, display_final, translate
    regex: string
    replace: string
}

function dynamicRegexReplace(input: string, regex: string, replace: string): string {
    // 1. 문자열 형태의 regex를 실제 JavaScript의 RegExp로 변환
    const re = new RegExp(regex, "g");

    // 2. 입력 문자열(`input`)을 정규 표현식에 매칭 및 변환 실행
    return input.replace(re, (...matches: string[]) => {
        // `matches` 구조:
        // [ fullMatch, group1, group2, ..., offset, inputString ]

        // - groups: 첫 번째 요소가 전체 매칭 문자열(fullMatch)이므로 이를 제외하고 그룹 매칭만 추출
        const groups = matches.slice(1, -2);

        // 3. `replace` 문자열에서 `$1`, `$2`, ...을 그룹 매칭 결과로 치환
        return replace.replace(/\$\d+/g, (match) => {
            const index = parseInt(match.slice(1), 10) - 1; // `$1`에서 숫자 부분 추출 후 0-based index로 변환
            return groups[index] !== undefined ? groups[index] : match; // 해당 그룹 매칭이 있으면 치환, 없으면 그대로 유지
        });
    });
}


export function ApplyFilter(filters: Filter[], types: string[], text: string) {
    let building = text
    filters.forEach((filter) => {
        if (!types.includes(filter.type)) return

        building = dynamicRegexReplace(building, filter.regex, filter.replace)
    })
    console.log(`Filtered: ${text} -> ${building}`)
    return building.trim()
}