module.exports = {
    env: {
        browser: true,
        es2021: true,
        webextensions: true,
    },
    parser: '@babel/eslint-parser',
    parserOptions: {
        sourceType: 'module',
        allowImportExportEverywhere: false,
        ecmaFeatures: {
            globalReturn: false,
        },
    },
    extends: ['eslint:recommended', 'prettier'],
    rules: {
        'no-unused-vars': [
            'error',
            {
                vars: 'all',
                args: 'after-used',
                ignoreRestSiblings: false,
                argsIgnorePattern: '^_',
            },
        ],
        'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
        'prefer-destructuring': ['error', { object: true, array: false }],
    },
};
