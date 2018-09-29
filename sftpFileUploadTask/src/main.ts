import * as path from "path";
import { SFTPUploader } from "./sftpUploader";
import { performance } from "perf_hooks";
import * as minimist from "minimist";
import { flatten } from "./util";

/**
 * Command Line Interface.
 */
class Main {
  public async run(): Promise<void> {
    try {
      // retrieve command line parameters
      var argv: minimist.ParsedArgs = minimist(process.argv.slice(2), {
        alias: { h: "help" },
        default: {
          port: 22,
          "local-folder": ".",
          "file-patterns": "*.*"
        }
      });

      const host: string = argv.host;
      const port: number = parseInt(argv.port, 10);
      const username: string = argv.username;
      const password: string = argv.password;

      const localFolder: string = path.normalize(argv["local-folder"]);
      const filePatterns: string[] = this.splitFilePatterns(argv["file-patterns"]);
      const remoteFolder: string = argv["remote-folder"];

      if (!remoteFolder) {
        console.log("The --remote-folder argument must be specified.");
      }

      // perform upload
      const t0: number = performance.now();
      const uploader: SFTPUploader = new SFTPUploader();
      await uploader.startSession(host, port, username, password);
      await uploader.uploadFiles(localFolder, filePatterns, remoteFolder);
      await uploader.endSession();
      const t1: number = performance.now();

      // succeed
      console.log("Uploaded files in " + ((t1 - t0) / 1000).toFixed(2) + " seconds");
    } catch (error) {
      console.log("Error:", error);
    }
  }

  private splitFilePatterns(filePatterns: string): string[] {
    return filePatterns ? flatten(filePatterns.split(";").map(pattern => pattern.split(":"))) : [];
  }
}

const main: Main = new Main();
main.run();
