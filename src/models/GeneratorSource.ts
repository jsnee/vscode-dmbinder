import * as fse from 'fs-extra';
import * as path from 'path';
import { BaseContentGenerator } from '../generators/BaseContentGenerator';
import { BasicContentGenerator } from '../generators/BasicContentGenerator';
import { MarkovContentGenerator } from '../generators/MarkovContentGenerator';
import { window } from 'vscode';

export enum GeneratorSourceType {
    Basic = "basic",
    Markov = "markov"
}

enum TemplateMatch {
    Whole = 0,
    SourceName = 1,
    VariableName = 2
}

export interface GeneratorSourceConfig {
    generatorType?: string;
    sourceFile?: string;
    values?: string[];
    sources?: GeneratorSourceCollection;
}

export interface GeneratorVars {
    [varName: string]: string;
}

interface GeneratorSourceCollection {
    [generatorName: string]: GeneratorSourceConfig;
}

export class GeneratorSource {
    private _sourceConfig: GeneratorSourceConfig;

    constructor(generatorConfig: GeneratorSourceConfig) {
        this._sourceConfig = generatorConfig;
    }

    private static async loadGeneratorSourceConfig(generatorPath: string): Promise<GeneratorSourceConfig> {
        let config: GeneratorSourceConfig = await fse.readJson(generatorPath);
        if (config.sources) {
            for (let sourceName in config.sources) {
                let sourcePath = config.sources[sourceName].sourceFile;
                if (sourcePath) {
                    config.sources[sourceName].sourceFile = path.join(path.dirname(generatorPath), sourcePath);
                }
            }
        }
        return config;
    }

    public static async loadGeneratorSource(generatorPath: string): Promise<GeneratorSource> {
        return new GeneratorSource(await this.loadGeneratorSourceConfig(generatorPath));
    }

    public async generateContent(): Promise<string> {
        let generator = getContentGenerator(this._sourceConfig);
        if (generator) {
            return await this.generateFromTemplate(generator.generate());
        }
        return "";
    }

    private async generateFromTemplate(template: string, vars: GeneratorVars = {}): Promise<string> {
        let regEx = /\{(\w+)(?::(\w+))?\}/;
        let matches = template.match(regEx);
        if (!matches) {
            return template;
        }
        let value: string;
        let varName = matches[TemplateMatch.VariableName];
        if (varName !== undefined && vars[varName]) {
            value = vars[varName];
        } else {
            value = await this.generateBySourceName(matches[TemplateMatch.SourceName]);
            if (varName !== undefined) {
                vars[varName] = value;
            }
        }
        return await this.generateFromTemplate(template.replace(regEx, value), vars);
    }

    private async generateBySourceName(sourceName: string): Promise<string> {
        let config = await this.loadGenerator(sourceName);
        if (config) {
            let generator = getContentGenerator(config);
            if (generator) {
                return generator.generate();
            }
        }
        return "";
    }

    public async loadGenerator(generatorName: string): Promise<GeneratorSourceConfig | undefined> {
        let source = this.sources[generatorName];
        if (source) {
            if (source.sourceFile) {
                source = await GeneratorSource.loadGeneratorSourceConfig(source.sourceFile);
                this.sources[generatorName] = source;
            }
            if (source.sources) {
                for (let childSourceName in source.sources) {
                    if (!this.sources[childSourceName]) {
                        this.sources[childSourceName] = source.sources[childSourceName];
                    }
                }
            }
            return source;
        }
        return;
    }

    public get sources(): GeneratorSourceCollection {
        return !this._sourceConfig.sources ? {} : this._sourceConfig.sources;
    }

    public get values(): string[] {
        return !this._sourceConfig.values ? [] : this._sourceConfig.values;
    }
}

export function getContentGenerator(generatorConfig: GeneratorSourceConfig): BaseContentGenerator | undefined {
    switch (generatorConfig.generatorType) {
        case GeneratorSourceType.Basic:
            return new BasicContentGenerator(generatorConfig);
        case GeneratorSourceType.Markov:
            return new MarkovContentGenerator(generatorConfig);
        default:
            window.showErrorMessage(`Unexpected value for generatorType encountered: ${generatorConfig.generatorType}`);
            return;
    }
}