/**
 * initialize
 */

const fs = require("fs");
const minimist = require("minimist");
const shell = require("shelljs");

// remove well-known parameters from argv before loading make,
// otherwise each arg will be interpreted as a make target
const options = minimist(process.argv, {
  string: ["share-with", "token"],
  boolean: ["rev-version"],
  default: { "rev-version": false }
});
process.argv = options._;

// require("shelljs/make") schedules a make operation that will be executed
// after the synchronous code in this script finished executing
require("shelljs/make");

/**
 * define helper functions
 */

function fail(message) {
  console.error("ERROR: " + message);
  process.exit(1);
}

/**
 * define shelljs/make targets
 */

target.build = () => {
  if (!shell.which("tsc")) {
    fail("Typescript not installed! Please run 'npm install -g typescript' to install.");
  }

  const json = fs.readFileSync("vss-extension.json", { encoding: "utf-8" });
  const manifest = JSON.parse(json);
  const folders = manifest.files.map(file => file.path);

  console.info("Building typescript projects:");

  folders.forEach(folder => {
    console.info(`  - ${folder}`);
    shell.exec(`tsc -p ${folder}`);
  });

  console.info("Finished building typescript projects.");
};

target.test = () => {
  console.info("INFO: There are currently no tests to run.");
};

target.publish = () => {
  // retrieve arguments, which might be provided as command line arguments
  // (see examples below) or environment variables:
  // $ npm run publish
  // $ npm run publish -- --rev-version
  // $ npm run publish -- --token <token> --share-with <account> --rev-version
  const token = options.token || process.env["TFX_TOKEN"];
  const shareWith = options["share-with"] || process.env["TFX_SHARE_WITH"];
  const revVersion = options["rev-version"];

  // ensure required arguments (token only in this case) are defined
  if (!token) {
    fail(
      "Token undefined! Provide argument '--token <token>' or define 'TFX_TOKEN' environment variable."
    );
  }

  // define and execute command
  let command = `tfx extension publish --token ${token}`;
  command += shareWith ? ` --share-with ${shareWith}` : "";
  command += revVersion ? ` --rev-version` : "";

  shell.exec(command);
};
