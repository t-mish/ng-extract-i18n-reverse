import {Architect, createBuilder} from '@angular-devkit/architect';
import {TestingArchitectHost} from '@angular-devkit/architect/testing';
import {schema} from '@angular-devkit/core';
import {promises as fs} from 'fs';
import builder, {Options} from './builder';
import {rmSafe} from './rmSafe';
import Mock = jest.Mock;

const MESSAGES_ARB_SOURCE_PATH = 'builder-test/messages.arb';
const MESSAGES_ARB_TARGET_PATH = 'builder-test/messages.en-US.arb';

describe('Builder', () => {
    let architect: Architect;
    let architectHost: TestingArchitectHost;
    let extractI18nBuilderMock: Mock;

    beforeEach(async () => {
        const registry = new schema.CoreSchemaRegistry();
        registry.addPostTransform(schema.transforms.addUndefinedDefaults);

        // TestingArchitectHost() takes workspace and current directories.
        // Since we don't use those, both are the same in this case.
        architectHost = new TestingArchitectHost(__dirname, __dirname);
        architect = new Architect(architectHost, registry);

        // This will either take a Node package name, or a path to the directory
        // for the package.json file.
        // await architectHost.addBuilderFromPackage('..');
        await architectHost.addBuilder('ng-extract-i18n-reverse:ng-extract-i18n-reverse', builder);
        await architectHost.addTarget({
            project: 'builder-test',
            target: 'extract-i18n-reverse'
        }, 'ng-extract-i18n-reverse:ng-extract-i18n-reverse');
        extractI18nBuilderMock = jest.fn(() => ({success: true}));
        await architectHost.addBuilder('@angular-devkit/build-angular:extract-i18n', createBuilder(extractI18nBuilderMock)); // dummy builder
    });

    test('should succeed when there are no difference in ARB files', async () => {
        const sourceDummyContent = `
        {
          "@@locale": "en",
          "paginationShow25Items": "Show 25 items per page",
          "@paginationShow25Items": {
            "description": "Pagination show 25 items",
            "x-locations": [
              {
                "file": "libs/shared/table/src/lib/pagination/pagination.component.ts",
                "start": { "line": "47", "column": "26" },
                "end": { "line": "47", "column": "99" }
              }
            ]
          },
          "paginationShow50Items": "Show 50 items per page",
          "@paginationShow50Items": {
            "description": "Pagination show 50 items",
            "x-locations": [
              {
                "file": "libs/shared/table/src/lib/pagination/pagination.component.ts",
                "start": { "line": "51", "column": "26" },
                "end": { "line": "51", "column": "99" }
              }
            ]
          }
        }`

        const targetDummyContent = `
        {
          "@@locale": "en",
          "paginationShow25Items": "Show 25 items per page",
          "@paginationShow25Items": {
            "description": "Pagination show 25 items",
            "x-locations": [
              {
                "file": "libs/shared/table/src/lib/pagination/pagination.component.ts",
                "start": { "line": "47", "column": "26" },
                "end": { "line": "47", "column": "99" }
              }
            ]
          },
          "paginationShow50Items": "Show 50 items per page",
          "@paginationShow50Items": {
            "description": "Pagination show 50 items",
            "x-locations": [
              {
                "file": "libs/shared/table/src/lib/pagination/pagination.component.ts",
                "start": { "line": "51", "column": "26" },
                "end": { "line": "51", "column": "99" }
              }
            ]
          }
        }`

        await fs.writeFile(MESSAGES_ARB_SOURCE_PATH, sourceDummyContent, 'utf8');
        await fs.writeFile(MESSAGES_ARB_TARGET_PATH, targetDummyContent, 'utf8');

        try {
            // A "run" can have multiple outputs, and contains progress information.
            const run = await architect.scheduleTarget({project: 'builder-test', target: 'extract-i18n-reverse'}, {
                format: 'arb',
                outputPath: 'builder-test',
                sourceFile: 'messages.arb',
                targetPath: 'builder-test',
                targetFile: 'messages.en-US.arb',
                check: true
            });

            // The "result" member (of type BuilderOutput) is the next output.
            const result = await run.result;
            expect(result.success).toBeTruthy();

            // Stop the builder from running. This stops Architect from keeping
            // the builder-associated states in memory, since builders keep waiting
            // to be scheduled.
            await run.stop();
        } finally {
            await rmSafe(MESSAGES_ARB_SOURCE_PATH);
            await rmSafe(MESSAGES_ARB_TARGET_PATH);
        }
    });

    test('should fail when there are difference in ARB files', async () => {
        const sourceDummyContent = `
        {
          "@@locale": "en",
          "paginationShow25Items": "Show 25 items per page",
          "@paginationShow25Items": {
            "description": "Pagination show 25 items",
            "x-locations": [
              {
                "file": "libs/shared/table/src/lib/pagination/pagination.component.ts",
                "start": { "line": "47", "column": "26" },
                "end": { "line": "47", "column": "99" }
              }
            ]
          },
          "paginationShow50Items": "Show 50 items per page",
          "@paginationShow50Items": {
            "description": "Pagination show 50 items",
            "x-locations": [
              {
                "file": "libs/shared/table/src/lib/pagination/pagination.component.ts",
                "start": { "line": "51", "column": "26" },
                "end": { "line": "51", "column": "99" }
              }
            ]
          },
          "paginationShow150Items": "Show 150 items per page",
          "@paginationShow150Items": {
            "description": "Pagination show 150 items",
            "x-locations": [
              {
                "file": "libs/shared/table/src/lib/pagination/pagination.component.ts",
                "start": { "line": "55", "column": "26" },
                "end": { "line": "55", "column": "102" }
              }
            ]
          },
          "paginationShow250Items": "Show 250 items per page",
          "@paginationShow250Items": {
            "description": "Pagination show 250 items",
            "x-locations": [
              {
                "file": "libs/shared/table/src/lib/pagination/pagination.component.ts",
                "start": { "line": "59", "column": "26" },
                "end": { "line": "59", "column": "102" }
              }
            ]
          }
        }`

        const targetDummyContent = `
        {
          "@@locale": "en",
          "paginationShow25Items": "Show 25 items per page 123",
          "@paginationShow25Items": {
            "description": "Pagination show 25 items",
            "x-locations": [
              {
                "file": "libs/shared/table/src/lib/pagination/pagination.component.ts",
                "start": { "line": "47", "column": "26" },
                "end": { "line": "47", "column": "99" }
              }
            ]
          },
          "paginationShow50Items": "Show 5 items per page",
          "@paginationShow50Items": {
            "description": "Pagination show 50 items",
            "x-locations": [
              {
                "file": "libs/shared/table/src/lib/pagination/pagination.component.ts",
                "start": { "line": "51", "column": "26" },
                "end": { "line": "51", "column": "99" }
              }
            ]
          },
          "paginationShow150Items": "Show 150 items pere page",
          "@paginationShow150Items": {
            "description": "Pagination show 150 items",
            "x-locations": [
              {
                "file": "libs/shared/table/src/lib/pagination/pagination.component.ts",
                "start": { "line": "55", "column": "26" },
                "end": { "line": "55", "column": "102" }
              },
              {
                "file": "libs/shared/table/src/lib/pagination/pag.component.ts",
                "start": { "line": "30", "column": "26" },
                "end": { "line": "55", "column": "102" }
              }
            ]
          },
          "paginationShow250Items": "Show 250 item per page",
          "@paginationShow250Items": {
            "description": "Pagination show 250 items",
            "x-locations": [
              {
                "file": "libs/shared/table/src/lib/pagination/pagination.component.ts",
                "start": { "line": "59", "column": "26" },
                "end": { "line": "59", "column": "102" }
              }
            ]
          }
        }`

        await fs.writeFile(MESSAGES_ARB_SOURCE_PATH, sourceDummyContent, 'utf8');
        await fs.writeFile(MESSAGES_ARB_TARGET_PATH, targetDummyContent, 'utf8');

        try {
            // A "run" can have multiple outputs, and contains progress information.
            const run = await architect.scheduleTarget({project: 'builder-test', target: 'extract-i18n-reverse'}, {
                format: 'arb',
                outputPath: 'builder-test',
                sourceFile: 'messages.arb',
                targetPath: 'builder-test',
                targetFile: 'messages.en-US.arb',
                check: true
            });

            // The "result" member (of type BuilderOutput) is the next output.
            const result = await run.result;
            expect(result.success).toBeFalsy();

            console.log(result.error);

            // Stop the builder from running. This stops Architect from keeping
            // the builder-associated states in memory, since builders keep waiting
            // to be scheduled.
            await run.stop();
        } finally {
            await rmSafe(MESSAGES_ARB_SOURCE_PATH);
            await rmSafe(MESSAGES_ARB_TARGET_PATH);
        }
    });
});
