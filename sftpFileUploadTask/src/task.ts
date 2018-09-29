import tl = require("vsts-task-lib/task");
import { SFTPUploader } from "./sftpUploader";

/**
 * SFTP File Upload Task
 */
class Task {
  public async run(): Promise<void> {
    try {
      // retrieve task inputs
      const host: string = tl.getInput("host", true);
      const port: number = parseInt(tl.getInput("port", true), 10);
      const username: string = tl.getInput("username", true);
      const password: string = tl.getInput("password", true);

      const localFolder: string = tl.getPathInput("localFolder", true);
      const filePatterns: string[] = tl.getDelimitedInput("filePatterns", "\n", true);
      const remoteFolder: string = tl.getInput("remoteFolder", true);

      // perform upload
      const uploader: SFTPUploader = new SFTPUploader();
      await uploader.startSession(host, port, username, password);
      await uploader.uploadFiles(localFolder, filePatterns, remoteFolder);
      await uploader.endSession();

      // succeed
      tl.setResult(tl.TaskResult.Succeeded, "Successfully uploaded files.");
    } catch (err) {
      // fail
      console.log(`Error creating download version: '${err.message}'.`);
      tl.setResult(tl.TaskResult.Failed, err.message);
    }
  }
}

const task: Task = new Task();
task.run();
