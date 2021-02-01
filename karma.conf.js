process.env.CHROME_BIN = require("puppeteer").executablePath();

module.exports = function (config) {
  config.set({
    basePath: "",
    frameworks: ["jasmine", "webpack"],
    plugins: [
      "karma-webpack",
      "karma-jasmine",
      "karma-chrome-launcher",
      "karma-spec-reporter",
    ],
    files: ["test/**/*.ts"],
    exclude: [],
    preprocessors: { "test/**/*.ts": ["webpack"] },
    webpack: {
      module: {
        rules: [
          {
            test: /\.tsx?$/i,
            use: "ts-loader",
            exclude: /node_modules/,
          },
        ],
      },
      resolve: {
        extensions: [".tsx", ".ts", ".js"],
      },
    },
    reporters: ["spec"],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ["ChromeHeadless"],
    singleRun: false,
    concurrency: Infinity,
  });
};
