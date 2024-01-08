import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { basename, dirname, join, JsonObject, normalize } from '@angular-devkit/core';
import * as fs from 'fs';
import terminalLink from 'terminal-link';
import { ArbDifference, getDifferenceBetweenArbObjects, XLocation } from './arbUtils.js';
import { readFileIfExists } from './fileUtils.js';

export interface Options extends JsonObject {
    browserTarget: string,
    format: 'arb' | null
    outputPath: string | null,
    sourceFile: string | null,
    targetFiles: string[],
    check: boolean | null,
    checkModifiedDate: boolean | null;
    targetPath: string
    targetFile: string;
}

export const builder: ReturnType<typeof createBuilder> = createBuilder(extractI18nMergeBuilder);
export default builder;

function compareFileModificationDates(file1Path: string, file2Path: string) {
    try {
        const stats1 = fs.statSync(file1Path);
        const stats2 = fs.statSync(file2Path);

        const mtime1 = stats1.mtime;
        const mtime2 = stats2.mtime;

        return mtime1 < mtime2;
    } catch (error) {
        return null;
    }
}

function compareFilesDifferences(workspaceRoot: string, sourceFilePath: string, targetFilePath: string) {
    const obj1 = JSON.parse(sourceFilePath);
    const obj2 = JSON.parse(targetFilePath);

    const diff: ArbDifference[] = getDifferenceBetweenArbObjects(obj1, obj2);

    if (diff.length !== 0) {
        return diff.map((diffItem: ArbDifference) => ({
            value: `Before:${diffItem.original}\nAfter: ${diffItem.result}\n`,
            files: (Object.values(diffItem?.files ?? [])).map((file: XLocation) => terminalLink(` - ${file.file}:${Number(file.start.line)+1}`, `file://${workspaceRoot}/${file.file}:${Number(file.start.line)+1}`))
        }));
    }

    return [];
}

async function extractI18nMergeBuilder(options: Options, context: BuilderContext): Promise<BuilderOutput> {
    context.logger.info(`Running ng-extract-i18n-reverse for project ${context.target?.project}`);

    context.logger.debug(`options: ${JSON.stringify(options)}`);

    const outputPath = options.outputPath as string || '.';
    const format = options.format as string || 'arb';
    const check = options.check as boolean || false;
    const checkModifiedDate = options.checkModifiedDate as boolean || false;

    context.logger.info('running "extract-i18n" ...');

    const sourcePath = join(normalize(outputPath), options.sourceFile ?? 'messages.arb');
    const translationSourceFileOriginal = await readFileIfExists(sourcePath);

    if (check) {
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

        if (checkModifiedDate) {
            if (compareFileModificationDates(sourcePath, targetPath)) {
                const diffs = compareFilesDifferences(context.workspaceRoot, translationSourceFileOriginal, translationTargetFileOriginal)

                if (diffs.length > 0) {
                    return {success: false, error: `There are difference in the following files:\n\n${diffs.map((diffItem) => `${diffItem.value}\n${diffItem.files.map((file) => file).join(`\n`)}\n`).join(`\n`)}`}
                }
            }
        } else {
            const diffs = compareFilesDifferences(context.workspaceRoot, translationSourceFileOriginal, translationTargetFileOriginal)

            if (diffs.length > 0) {
                return {success: false, error: `There are difference in the following files:\n\n${diffs.map((diffItem) => `${diffItem.value}\n${diffItem.files.map((file) => file).join(`\n`)}\n`).join(`\n`)}`}
            }
        }

        return {success: true}
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
