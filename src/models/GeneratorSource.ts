import * as fse from 'fs-extra';
import * as path from 'path';
import { BaseContentGenerator, GeneratorVars } from '../generators/BaseContentGenerator';
import { BasicContentGenerator } from '../generators/BasicContentGenerator';
import { MarkovContentGenerator } from '../generators/MarkovContentGenerator';
import { window } from 'vscode';
import { GeneratorSourceConfig, GeneratorSourceCollection, GeneratorSourceType } from './GeneratorSourceConfig';
import { MultilineContentGenerator } from '../generators/MultilineContentGenerator';

enum TemplateMatch {
    Whole = 0,
    SourceName = 1,
    VariableName = 2
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
                if (config.sources[sourceName].generatorType && config.sources[sourceName].generatorType === GeneratorSourceType.Import)
                {
                    let sourcePath = config.sources[sourceName].sourceFile;
                    if (sourcePath) {
                        config.sources[sourceName].sourceFile = path.join(path.dirname(generatorPath), sourcePath);
                    } else {
                        window.showErrorMessage(`Invalid sourcePath specified for imported generator "${sourceName}" referenced in generator config at: ${generatorPath}`);
                    }
                }
            }
        }
        return config;
    }

    public static async loadGeneratorSource(generatorPath: string): Promise<GeneratorSource> {
        return new GeneratorSource(await this.loadGeneratorSourceConfig(generatorPath));
    }

    public async generateContent(vars: GeneratorVars = {}, paramCallback?: (source: string) => Promise<string | undefined>): Promise<string> {
        let generator = getContentGenerator(this._sourceConfig);
        if (generator) {
            return await this.generateFromTemplate(generator.generate(vars), {}, paramCallback);
        }
        return "";
    }

    private async generateFromTemplate(template: string, vars: GeneratorVars = {}, paramCallback?: (source: string) => Promise<string | undefined>): Promise<string> {
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
            let valueOverride: string | undefined = undefined;
            if (paramCallback) {
                let valueTemplate = await paramCallback(matches[TemplateMatch.SourceName]);
                if (valueTemplate) {
                    valueOverride = await this.generateFromTemplate(valueTemplate, vars, paramCallback);
                }
            }
            if (valueOverride === undefined) {
                value = await this.generateBySourceName(matches[TemplateMatch.SourceName]);
            } else {
                value = valueOverride;
            }
            if (varName !== undefined) {
                vars[varName] = value;
            }
        }
        return await this.generateFromTemplate(template.replace(regEx, value), vars, paramCallback);
    }

    private async generateBySourceName(sourceName: string, vars: GeneratorVars = {}): Promise<string> {
        let config = await this.loadGenerator(sourceName);
        if (config) {
            let generator = getContentGenerator(config);
            if (generator) {
                return generator.generate(vars);
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
        case GeneratorSourceType.Multiline:
            return new MultilineContentGenerator(generatorConfig);
        case GeneratorSourceType.Import:
            window.showErrorMessage("Encountered unexpected issue when attempting to process imported content generator");
            return;
        default:
            window.showErrorMessage(`Unexpected value for generatorType encountered: ${generatorConfig.generatorType}`);
            return;
    }
}