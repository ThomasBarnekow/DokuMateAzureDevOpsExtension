import path = require("path");
import glob = require("glob");
import tl = require("vsts-task-lib/task");
import SFTPClient = require("ssh2-sftp-client");
import { performance } from "perf_hooks";

/**
 * SFTP File Upload Task
 */
class Task {
  public async run(): Promise<void> {
    try {
      console.log("Getting input parameters ...");

      // determine connection parameters
      const sftpHost: string = tl.getInput("sftpHost", true);
      const sftpPort: number = parseInt(tl.getInput("sftpPort", true), 10);

      const sftpUsername: string = tl.getInput("sftpUsername", true);
      const sftpPassword: string = tl.getInput("sftpPassword", true);

      // determine local file paths
      const localFolder: string = tl.getPathInput("localFolder", true);
      const filePattern: string = tl.getInput("filePattern", true);
      const localFilePaths: string[] = glob
        .sync(filePattern, { cwd: localFolder, absolute: true })
        .map(localFileName => path.normalize(localFileName));

      // determine remote path
      const remoteFolder: string = this.normalizePath(tl.getInput("remoteFolder", true));

      // log parameters
      console.log("SFTP Connection:");
      console.log(`  Host: ${sftpHost}`);
      console.log(`  Port: ${sftpPort}`);
      console.log(`  Username: ${sftpUsername}`);
      console.log("Remote Folder:");
      console.log(`  Path: ${remoteFolder}`);
      console.log("Local Folder:");
      console.log(`  Path: ${localFolder}`);
      console.log("Local File Paths:");
      localFilePaths.forEach(p => console.log(`  - ${p}`));

      // connect to SFTP server
      console.log("\nConnecting ...");
      const client: SFTPClient = new SFTPClient();
      await client.connect({
        host: sftpHost,
        port: sftpPort,
        username: sftpUsername,
        password: sftpPassword
      });

      // perform upload
      console.log("Uploading " + localFilePaths.length + " files ...\n");
      for (const localFilePath of localFilePaths) {
        // determine the local file name relative to the local folder to retain
        // the local subfolder structure
        const localFileName: string = path.relative(localFolder, localFilePath);
        const remoteFilePath: string = `${remoteFolder}/${localFileName}`;

        // ensure the remote file's parent directory exists
        const remoteDirName: string = path.dirname(remoteFilePath);
        await client.mkdir(remoteDirName, true);

        // now, with that out of the way, let's finally upload our file
        console.log("Uploading file ...");
        console.log("  localFilePath: " + localFilePath);
        console.log("  remoteFilePath: " + remoteFilePath);

        const t0: number = performance.now();
        await client.put(localFilePath, remoteFilePath);
        const t1: number = performance.now();

        console.log("Successfully uploaded file in " + (t1 - t0) / 1000 + " seconds.\n");
      }

      // disconnect from SFTP server
      console.log("Disconnecting ...");
      await client.end();

      // yay, we are done
      console.log("Successfully uploaded " + localFilePaths.length + " files.");
      tl.setResult(tl.TaskResult.Succeeded, "Successfully uploaded file.");
    } catch (err) {
      console.log(`Error creating download version: '${err.message}'.`);
      tl.setResult(tl.TaskResult.Failed, err.message);
    }
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
