const { defaults } = require('jest-config');

/** @type{import('jest').Config} */
const config = {
    preset: 'ts-jest',
    testEnvironment: "node",
    modulePathIgnorePatterns: ["<rootDir>/public/"],
    moduleNameMapper: {
        '^~/(.*)$': '<rootDir>/src/$1',
        '\\.(css|less|scss|sss|styl)$': '<rootDir>/node_modules/jest-css-modules',
        '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/fileMock.ts',
    },
    transform: {
        ...defaults.transform,
        '^.+\\.tsx?$': 'ts-jest',
        '^.+\\.ts?$': 'ts-jest',
        '^.+\\.mjs?$': 'ts-jest',
    },
    prettierPath: null,
};

module.exports = config;
