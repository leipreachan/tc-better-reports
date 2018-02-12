module.exports = {
    // Command options:
    artifactsDir: "../web-ext-artifacts/",
    ignoreFiles: [
        "test",
        "test/*",
        "package*.json",
        "*.md",
        "web-ext-config.js"
    ],
    build: {
        overwriteDest: true,
    },
    lint: {
        selfHosted: true
    }
};
