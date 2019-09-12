import * as fse from 'fs-extra';
import * as path from 'path';
import { BaseContentGenerator, GeneratorVars } from './BaseContentGenerator';
import { BasicContentGenerator } from './BasicContentGenerator';
import { MarkovContentGenerator } from './MarkovContentGenerator';
import { window } from 'vscode';
import { GeneratorSourceConfig, GeneratorSourceCollection, GeneratorSourceType } from './GeneratorSourceConfig';
import { MultilineContentGenerator } from './MultilineContentGenerator';
import { SwitchContentGenerator } from './SwitchContentGenerator';
import { RollTableContentGenerator } from './RollTableContentGenerator';
import { WindowHelper } from '../../helpers/WindowHelper';
import { GeneratorExpression } from './GeneratorExpression';
import { DiceHelper } from '../../helpers/DiceHelper';

function getGeneratorSourceConfig(result: GeneratorSourceConfig): GeneratorSourceConfig {
    if (result.sources) {
        for (let configName in result.sources) {
            result.sources[configName] = getGeneratorSourceConfig(result.sources[configName]);
        }
    }
    return result;
}

export class GeneratorSource {
    private _sourceConfig: GeneratorSourceConfig;

    constructor(generatorConfig: GeneratorSourceConfig) {
        this._sourceConfig = generatorConfig;
    }

    public static async loadGeneratorSource(generatorPath: string): Promise<GeneratorSource> {
        return new GeneratorSource(await this.loadGeneratorSourceConfig(generatorPath));
    }

    private async loadGenerator(generatorName: string): Promise<GeneratorSourceConfig | undefined> {
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

    private static async loadGeneratorSourceConfig(generatorPath: string): Promise<GeneratorSourceConfig> {
        const loadedConfig: GeneratorSourceConfig = await fse.readJson(generatorPath);
        let config = getGeneratorSourceConfig(loadedConfig);
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

    public async generateContent(vars: GeneratorVars = {}, paramCallback?: (source: string) => Promise<string | undefined>): Promise<string> {
        let generator = getContentGenerator(this._sourceConfig);
        if (generator) {
            try {
                return await this.generateFromTemplate(generator.generate(vars), vars, paramCallback);
            } catch (err) {
                WindowHelper.showErrorMessage(err);
            }
        }
        return "";
    }

    private async generateFromTemplate(template: string, vars: GeneratorVars = {}, paramCallback?: (source: string) => Promise<string | undefined>): Promise<string> {
        const expression = GeneratorExpression.matchNextExpression(template);
        if (!expression) {
            return template;
        }
        let value: string;
        if (expression.variableName !== undefined && vars[expression.variableName]) {
            value = vars[expression.variableName];
        } else if (expression.diceRoll !== undefined) {
            let roll = DiceHelper.calculateDiceRollExpression(expression.diceRoll);
            if (expression.formatSpec) {
                value = expression.formatSpec.format(roll);
            } else {
                value = String(roll);
            }
        } else if (expression.generatorName !== undefined) {
            let values: string[] = [];
            let stopAt = expression.generatorRepeat || 1;
            while (values.length !== stopAt) {
                let valueOverride: string | undefined = undefined;
                if (paramCallback) {
                    let valueTemplate = await paramCallback(expression.generatorName);
                    if (valueTemplate) {
                        valueOverride = await this.generateFromTemplate(valueTemplate, vars, paramCallback);
                    }
                }
                if (valueOverride === undefined) {
                    values.push(await this.generateBySourceName(expression.generatorName, vars));
                } else {
                    values.push(valueOverride);
                }
            }
            value = values.join(expression.repeatSeparator);
        } else if (expression.variableName !== undefined) {
            window.showWarningMessage(`Tried to access undefined generator variable: ${expression.variableName}`);
            value = "";
        } else {
            throw new Error(`Error encountered while generating content on match: ${expression.wholeMatch}`);
        }
        if (expression.variableName !== undefined) {
            vars[expression.variableName] = value;
        }
        return await this.generateFromTemplate(expression.replace(template, value), vars, paramCallback);
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
        case GeneratorSourceType.RollTable:
            return new RollTableContentGenerator(generatorConfig);
        case GeneratorSourceType.Switch:
            return new SwitchContentGenerator(generatorConfig);
        default:
            window.showErrorMessage(`Unexpected value for generatorType encountered: ${generatorConfig.generatorType}`);
            return;
    }
}