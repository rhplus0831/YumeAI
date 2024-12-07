export default interface Filter {
    timestamp: number
    name: string
    type: string
    regex: string
    replace: string
}

export function ApplyFilter(filters: Filter[], type: string, text: string) {
    let result = text
    filters.forEach((filter) => {
        if(filter.type != type) return
        result = result.replaceAll(new RegExp(filter.regex, 'g'), filter.replace)
    })
    return result.trim()
}