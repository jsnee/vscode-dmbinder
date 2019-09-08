export interface GeneratorSourceCollection {
    [generatorName: string]: GeneratorSourceConfig;
}

export interface RollTableValues {
    [name: string]: string;
}

export interface SwitchValues {
    [name: string]: string | string[];
}

export interface GeneratorSourceConfig {
    generatorType?: string;
    sourceFile?: string;
    values?: string[];
    condition?: string;
    rollValues?: RollTableValues;
    switchValues?: SwitchValues;
    sources?: GeneratorSourceCollection;
}

export enum GeneratorSourceType {
    Basic = "basic",
    Import = "import",
    Markov = "markov",
    Multiline = "multiline",
    RollTable = "rollTable",
    Switch = "switch"
}