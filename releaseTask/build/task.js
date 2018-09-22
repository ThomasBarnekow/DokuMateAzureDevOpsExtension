"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const glob = require("glob");
const tl = require("vsts-task-lib/task");
const dokuMateReleaseClient_1 = require("./dokuMateReleaseClient");
/**
 * Represents the DokuMate Release Task.
 */
class DokuMateReleaseTask {
    /**
     * Create new download version.
     */
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // gather all input parameters
                console.log("Getting input parameters ...");
                const localFolder = tl.getInput("localFolder", true);
                const filePattern = tl.getInput("filePattern", true);
                const wordPressURL = this.normalizeURL(tl.getInput("wordPressURL", true));
                const remoteFolder = this.normalizePath(tl.getInput("remoteFolder", true));
                const title = tl.getInput("title", true);
                const version = tl.getInput("version", true);
                const username = tl.getInput("wordPressUsername", true);
                const password = tl.getInput("wordPressPassword", true);
                console.log(`Local folder:     ${localFolder}`);
                console.log(`File pattern:     ${filePattern}`);
                console.log(`WordPress URL:    ${wordPressURL}`);
                console.log(`Remote folder:    ${remoteFolder}`);
                console.log(`Download Title:   ${title}`);
                console.log(`Download Version: ${version}`);
                // compute further parameters
                const filenames = glob.sync(filePattern, { cwd: localFolder });
                const filename = filenames.shift();
                const url = `${wordPressURL}/${remoteFolder}/${filename}`;
                console.log(`Download File:    ${filename}`);
                console.log(`Download URL:     ${url}`);
                // authenticate
                console.log("Authenticating ...");
                const client = new dokuMateReleaseClient_1.DokuMateReleaseClient(wordPressURL);
                yield client.authenticateAsync(username, password);
                // create download version
                console.log("Publishing download version ...");
                const downloadVersion = yield client.publishDownloadVersionAsync(title, version, url);
                // done
                console.log(`Created download version: ${JSON.stringify(downloadVersion)}.`);
                tl.setResult(tl.TaskResult.Succeeded, `Created download version: ${JSON.stringify(downloadVersion)}.`);
            }
            catch (err) {
                console.log(`Error creating download version: '${err.message}'.`);
                tl.setResult(tl.TaskResult.Failed, err.message);
            }
        });
    }
    normalizeURL(url) {
        // normalize to lowercase and remove all leading and trailing blanks.
        url = url.trim().toLowerCase();
        // ensure we are using the https scheme.
        if (!url.startsWith("https://")) {
            throw new Error(`Invalid URL: '${url}'. Please use https scheme.`);
        }
        return this.trimForwardSlashes(url);
    }
    normalizePath(p) {
        p = path.normalize(p).replace(/\\/g, "/");
        return this.trimForwardSlashes(p);
    }
    trimForwardSlashes(text) {
        return text.replace(/(^\/)|(\/$)/g, "");
    }
}
// create and run the DokuMate Release Task.
const task = new DokuMateReleaseTask();
task.run();
//# sourceMappingURL=task.js.map