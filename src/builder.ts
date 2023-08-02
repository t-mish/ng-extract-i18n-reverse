import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { basename, dirname, join, JsonObject, normalize } from '@angular-devkit/core';
import { ArbDifference, getDifferenceBetweenArbObjects } from './arbUtils';
import { readFileIfExists } from './fileUtils';

export interface Options extends JsonObject {
    browserTarget: string,
    format: 'arb' | null
    outputPath: string | null,
    sourceFile: string | null,
    targetFiles: string[],
    check: boolean,
    targetPath: string
    targetFile: string;
}

const builder: ReturnType<typeof createBuilder> = createBuilder(extractI18nMergeBuilder);
export default builder;

async function extractI18nMergeBuilder(options: Options, context: BuilderContext): Promise<BuilderOutput> {
    context.logger.info(`Running ng-extract-i18n-reverse for project ${context.target?.project}`);

    context.logger.debug(`options: ${JSON.stringify(options)}`);

    const outputPath = options.outputPath as string || '.';
    const format = options.format as string || 'arb';

    context.logger.info('running "extract-i18n" ...');

    const sourcePath = join(normalize(outputPath), options.sourceFile ?? 'messages.arb');
    const translationSourceFileOriginal = await readFileIfExists(sourcePath);

    if (options.check) {
        if (options.format !== 'arb'){
            return {success: false, error: `Current ${options.format} file format is not supported for check operation`};
        }

        if (!options.targetPath) {
            return {success: false, error: `No target path specified for check operation`};
        }

        if (!options.targetFile) {
            return {success: false, error: `No target file specified for check operation`};
        }

        const targetPath = join(normalize(options.targetPath), options.targetFile);
        const translationTargetFileOriginal = await readFileIfExists(targetPath);

        if (!translationSourceFileOriginal) {
            return {success: false, error: `Couldn't read the specified source file`};
        }

        if (!translationTargetFileOriginal) {
            return {success: false, error: `Couldn't read the specified target file`};
        }

        const obj1 = JSON.parse(translationSourceFileOriginal);
        const obj2 = JSON.parse(translationTargetFileOriginal);

        const diff: ArbDifference[] = getDifferenceBetweenArbObjects(obj1, obj2);

        if (diff.length !== 0) {
            return {success: false, error: `There are difference in the following files:\n\n${diff.map((diffItem) => `${diffItem.original} !== ${diffItem.result}\n${diffItem.files.map((file) => ` - ${file.file}\n   Line: ${file.start.line}`).join(`\n`)}`).join(`\n\n`)}\n`}
        } else {
            return {success: true};
        }
    }

    const extractI18nRun = await context.scheduleBuilder('@angular-devkit/build-angular:extract-i18n', {
        browserTarget: options.browserTarget,
        outputPath: dirname(sourcePath),
        outFile: basename(sourcePath),
        format,
        progress: false
    }, {target: context.target, logger: context.logger.createChild('extract-i18n')});

    const extractI18nResult = await extractI18nRun.result;

    if (!extractI18nResult.success) {
        return {success: false, error: `"extract-i18n" failed: ${extractI18nResult.error}`};
    }

    context.logger.info(`extracted translations successfully`);

    return {success: true};
}
