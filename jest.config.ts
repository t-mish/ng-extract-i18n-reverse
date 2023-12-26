import type {Config} from 'jest';

// Sync object
const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    verbose: false,
    testMatch: undefined,
    testRegex: '.*\.spec\.ts$',
    collectCoverageFrom: ['src/builder.ts', 'src/fileUtils.ts'] // exclude coverage from schematic as it only collects from js (instead of ts)..
};
export default config;
