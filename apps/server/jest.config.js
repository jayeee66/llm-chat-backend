/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
    // tell Jest to use the ts-jest preset for TypeScript files
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    extensionsToTreatAsEsm: ['.ts'],
    // import without .js extension
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    transform: {
        '^.+\\.ts$': ['ts-jest', { useESM: true }],
    },
};