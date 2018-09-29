import glob = require("glob");
import path = require("path");
import SFTPClient = require("ssh2-sftp-client");
import { flatten, isFirstValue } from "./util";

/**
 * The SFTP Uploader.
 */
export class SFTPUploader {
  client: SFTPClient;
  logToConsole: boolean;

  /**
   * Initializes a new SFTPUploader instance.
   *
   * @param logToConsole True to log to the console; false, otherwise. Defaults to true
   */
  public constructor(logToConsole: boolean = true) {
    this.logToConsole = logToConsole;
  }

  /**
   * Starts a new session, connecting to the SFTP server.
   *
   * @param host The SFTP host, e.g., "sftp.domain.com"
   * @param port The SFTP port, e.g., 22, 2222
   * @param username The SFTP username
   * @param password The SFTP password
   */
  public async startSession(
    host: string,
    port: number,
    username: string,
    password: string
  ): Promise<void> {
    // end current session, if any, before starting a new one
    await this.endSession();

    this.log("Starting session ...");
    this.log(`  host: ${host}`);
    this.log(`  port: ${port}`);
    this.log(`  username: ${username}`);
    this.log("  password: [secret]");

    // create a new, connected client
    this.client = new SFTPClient();
    await this.client.connect({ host, port, username, password });
  }

  /**
   * Uploads files via SFTP, preserving the local subfolder structure under the
   * local folder.
   *
   * @param localFolder The local folder path
   * @param filePatterns The file names or patterns, e.g., "*.*", "*.exe"
   * @param remoteFolder The remote folder, e.g., "path/to/folder"
   */
  public async uploadFiles(
    localFolder: string,
    filePatterns: string[],
    remoteFolder: string
  ): Promise<void> {
    // make sure we are connected
    if (this.client === null) {
      throw new Error("Session not started. Call startSession() before uploading files.");
    }

    // normalize params
    localFolder = path.normalize(localFolder);
    filePatterns = filePatterns.map(filePattern => path.normalize(filePattern));
    remoteFolder = this.normalizeLinuxPath(remoteFolder);

    // determine distinct local file paths, preserving the order of those paths
    // as defined by the list of file patterns
    const localFilePathArrays: string[][] = filePatterns.map(filePattern =>
      glob
        .sync(filePattern, { cwd: localFolder, absolute: true })
        .map(absolutePath => path.normalize(absolutePath))
    );
    const localFilePaths: string[] = flatten(localFilePathArrays).filter(isFirstValue);

    // perform upload
    this.log(`Uploading ${localFilePaths.length} files ...`);
    this.log(`  localFolder: ${localFolder}`);
    this.log(`  filePatterns: ${filePatterns}`);
    this.log(`  remoteFolder: ${remoteFolder}\n`);

    for (const localFilePath of localFilePaths) {
      // determine the local file name relative to the local folder to retain
      // the local subfolder structure
      const localFileName: string = path.relative(localFolder, localFilePath);
      const remoteFileName: string = this.normalizeLinuxPath(localFileName);
      const remoteFilePath: string = `${remoteFolder}/${remoteFileName}`;

      // ensure the remote file's parent directory exists
      const remoteDirName: string = path.dirname(remoteFilePath);
      await this.client.mkdir(remoteDirName, true);

      // now, with that out of the way, let's finally upload our file
      this.log("Uploading file ...");
      this.log("  localFilePath: " + localFilePath);
      this.log("  remoteFilePath: " + remoteFilePath);

      await this.client.put(localFilePath, remoteFilePath);
      this.log("Successfully uploaded file.\n");
    }

    // yay, we are done
    this.log("Successfully uploaded " + localFilePaths.length + " files.");
  }

  /**
   * Ends the current session, if any.
   */
  public async endSession(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.log("Ended session.");
    }

    this.client = null;
  }

  private log(message?: any, ...optionalParams: any[]): void {
    if (this.logToConsole) {
      console.log(message, ...optionalParams);
    }
  }

  private normalizeLinuxPath(p: string): string {
    return path
      .normalize(p)
      .replace(/\\/g, "/")
      .replace(/(^\/)|(\/$)/g, "");
  }
}
