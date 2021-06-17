export default interface Pattern {
    id: string;
    pattern: PatternData[],
}

export interface PatternData {
    name: string,
    type?: "options" | "single" | "user" | "channel" | "boolean" | "role" | "integer";
    options?: string[],
    infinite?: boolean,
    optional?: boolean,
}