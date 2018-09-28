import path = require("path");
import glob = require("glob");
import SFTPClient = require("ssh2-sftp-client");
import { performance } from "perf_hooks";

class Main {
  public async run(): Promise<void> {
    try {
      const sftpHost: string = "dokumateprod.sftp.wpengine.com";
      const sftpPort: number = 2222;

      const sftpUsername: string = "dokumateprod-ftp";
      const sftpPassword: string = "6WU3R7rw2QX2wr9N";

      const localFolder: string =
        "C:\\Users\\thoma\\Source\\Repos\\Azure DevOps\\DokuMateExtension\\sftpFileUploadTask\\build";
      const filePattern: string = "*.js";
      const localFilePaths: string[] = glob
        .sync(filePattern, { cwd: localFolder, absolute: true })
        .map(localFileName => path.normalize(localFileName));

      console.log("Local File Paths:");
      localFilePaths.forEach(p => console.log(`  - ${p}`));

      const remoteFolder: string = "SoftwareUpdate/Test";

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

        console.log("Uploaded file in " + ((t1 - t0) / 1000).toFixed(2) + " seconds.\n");
      }

      // disconnect from SFTP server
      console.log("Disconnecting ...");
      await client.end();

      // yay, we are done
      console.log("Successfully uploaded " + localFilePaths.length + " files.");
    } catch (error) {
      console.log(error);
    }
  }
}

const main: Main = new Main();
main.run();
