module.exports = {
    env: {
        browser: true,
        es2021: true,
        webextensions: true,
    },
    extends: ['airbnb-base', 'prettier'],
    parserOptions: {
        ecmaVersion: 12,
    },
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
