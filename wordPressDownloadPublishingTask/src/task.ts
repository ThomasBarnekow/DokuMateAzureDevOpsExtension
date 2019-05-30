import path = require("path");
import glob = require("glob");
import tl = require("azure-pipelines-task-lib/task");
import { DownloadMonitorRestClient } from "./downloadMonitorRestClient";
import { IDownloadVersion } from "./interfaces";

/**
 * WordPress Download Publishing Task
 */
class Task {
  public async run(): Promise<void> {
    try {
      // gather all input parameters, throwing exceptions if required parameters
      // are not provided
      console.log("Getting input parameters ...");

      const localFolder: string = tl.getPathInput("localFolder", true);
      const filePattern: string = tl.getInput("filePattern", true);

      const wordPressURL: string = this.normalizeURL(tl.getInput("wordPressURL", true));
      const remoteFolder: string = this.normalizePath(tl.getInput("remoteFolder", true));

      const title: string = tl.getInput("title", true);
      const version: string = tl.getInput("version", true);

      const username: string = tl.getInput("wordPressUsername", true);
      const password: string = tl.getInput("wordPressPassword", true);

      console.log(`Local folder:     ${localFolder}`);
      console.log(`File pattern:     ${filePattern}`);

      console.log(`WordPress URL:    ${wordPressURL}`);
      console.log(`Remote folder:    ${remoteFolder}`);

      console.log(`Download Title:   ${title}`);
      console.log(`Download Version: ${version}`);

      // determine URL parameter
      const filenames: string[] = glob.sync(filePattern, { cwd: localFolder });
      const filename: string = filenames.shift();
      if (!filename) {
        throw new Error(
          `Searching for '${filePattern}' within local folder did not yield any matching file.`
        );
      }

      const url: string = `${wordPressURL}/${remoteFolder}/${filename}`;

      console.log(`Download File:    ${filename}`);
      console.log(`Download URL:     ${url}`);

      // authenticate
      console.log("Authenticating ...");
      const timeout: number = 10000;
      const client: DownloadMonitorRestClient = new DownloadMonitorRestClient(
        wordPressURL,
        timeout
      );
      await client.authenticateAsync(username, password);

      // create download version
      console.log(`Publishing download version (timing out after ${timeout} ms) ...`);
      const downloadVersion: IDownloadVersion = await client.publishDownloadVersionAsync(
        title,
        version,
        url
      );

      // done
      console.log(`Created download version: ${JSON.stringify(downloadVersion)}.`);
      tl.setResult(
        tl.TaskResult.Succeeded,
        `Created download version: ${JSON.stringify(downloadVersion)}.`
      );
    } catch (err) {
      console.log(`Error creating download version: '${err.message}'.`);
      tl.setResult(tl.TaskResult.Failed, err.message);
    }
  }

  private normalizeURL(url: string): string {
    // normalize to lowercase and remove all leading and trailing blanks.
    url = url.trim().toLowerCase();

    // ensure we are using the https scheme.
    if (!url.startsWith("https://")) {
      throw new Error(`Invalid URL: '${url}'. Please use https scheme.`);
    }

    return this.trimForwardSlashes(url);
  }

  private normalizePath(p: string): string {
    p = path.normalize(p).replace(/\\/g, "/");
    return this.trimForwardSlashes(p);
  }

  private trimForwardSlashes(text: string): string {
    return text.replace(/(^\/)|(\/$)/g, "");
  }
}

const task: Task = new Task();
task.run();
