import { DownloadMonitorRestClient } from "./downloadMonitorRestClient";
import { IDownloadVersion } from "./interfaces";

async function main(): Promise<void> {
  try {
    // define server and user parameters.
    const hostname: string = "barnekow.me";
    const username: string = "ApiUser";
    const password: string = "Y)vO1NL3hB()j6p#2rCT1(t*";

    // define download and version parameters.
    const title: string = "DokuMate for Office New";
    const version: string = "2.8.3";
    const url: string =
      "https://barnekow.me/SoftwareUpdate/Bundle/DokuMateForOfficeSetup-2.8.3.txt";

    // authenticate.
    console.log("Authenticating ...");
    const client: DownloadMonitorRestClient = new DownloadMonitorRestClient(hostname);
    await client.authenticateAsync(username, password);

    // create download version.
    console.log("Publishing download version ...");
    const downloadVersion: IDownloadVersion = await client.publishDownloadVersionAsync(
      title,
      version,
      url
    );

    console.log(`Created download version: ${JSON.stringify(downloadVersion)}.`);
  } catch (err) {
    console.log(err.message);
  }
}

main();
