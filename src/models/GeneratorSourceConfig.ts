export interface GeneratorSourceCollection {
    [generatorName: string]: GeneratorSourceConfig;
}

export interface GeneratorSourceConfig {
    generatorType?: string;
    sourceFile?: string;
    values?: string[];
    conditionalValues?: ConditionalValue[];
    sources?: GeneratorSourceCollection;
}

export enum GeneratorSourceType {
    Basic = "basic",
    Import = "import",
    Markov = "markov",
    Multiline = "multiline"
}

export interface ConditionalValue {
    condition: string;
    values: string[];
}