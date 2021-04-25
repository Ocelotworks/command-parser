export default interface Pattern {
    id: string;
    pattern: PatternData[],
}

export interface PatternData {
    name: string,
    type?: "options" | "single";
    options?: string[],
    infinite?: boolean,
    optional?: boolean,
}