export enum MessageRole {
    User = 'user',
    Assistant = 'assistant'
}

export default interface Message {
    text: string
    key: string
    role: MessageRole
}