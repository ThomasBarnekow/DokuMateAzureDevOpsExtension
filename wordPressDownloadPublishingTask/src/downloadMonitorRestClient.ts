import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";
import { IJwtAuthUserCredentials, IDownload, IDownloadVersion } from "./interfaces";

/**
 * Download Monitor REST Client.
 */
export class DownloadMonitorRestClient {
  authEndpoint: string;
  downloadMonitorBaseURL: string;
  axiosTimeout: number;
  axiosInstance: AxiosInstance;

  /**
   * Instantiates a new DokuMateReleaseClient, using the given wordPressURL.
   *
   * @param wordPressURL The Wordpress site's URL
   */
  public constructor(wordPressURL: string, axiosTimeout: number = 10000) {
    this.authEndpoint = `${wordPressURL}/wp-json/jwt-auth/v1/token/`;
    this.downloadMonitorBaseURL = `${wordPressURL}/wp-json/download-monitor/v1/`;
    this.axiosTimeout = axiosTimeout;

    this.axiosInstance = null;
  }

  /**
   * Authenticates the given Wordpress user and retrieves a JWT token for
   * later use.
   *
   * @param username The WordPress user's username
   * @param password The Wordpress user's password
   */
  public async authenticateAsync(username: string, password: string): Promise<void> {
    // reset client state.
    this.axiosInstance = null;

    // authenticate with WordPress server, retrying the request twice and
    // initially waiting for 3000 ms before trying again
    let token: string = await this.retrieveAuthTokenAsync(username, password, 2, 3000);

    // create the axios instance to be used in authenticated requests.
    this.axiosInstance = axios.create({
      baseURL: this.downloadMonitorBaseURL,
      timeout: 10000,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private async retrieveAuthTokenAsync(
    username: string,
    password: string,
    retryCount: number,
    retryTimeout: number
  ): Promise<string> {
    try {
      console.log(`Sending POST request to '${this.authEndpoint}' ...`);
      const response: AxiosResponse<IJwtAuthUserCredentials> = await axios.post(this.authEndpoint, {
        username: username,
        password: password
      });
      return response.data.token;
    } catch (error) {
      console.log("POST request was not successful:");
      this.logAxiosError(error);

      // to deal with intermittent server errors, we'll retry the request after
      // a timeout, which we double each time we retry
      if (error.response && error.response.status >= 500 && retryCount > 0) {
        console.log(`Waiting ${retryTimeout} ms before trying again ...`);
        await this.timeoutAsync(retryTimeout);
        return await this.retrieveAuthTokenAsync(
          username,
          password,
          retryCount - 1,
          retryTimeout * 2
        );
      }

      // if we've tried enough, we'll just throw the error
      console.log("Giving up :-(");
      throw error;
    }
  }

  private logAxiosError(error: AxiosError): void {
    if (error.response) {
      // the request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log("response:");
      console.log(`status: ${error.response.status}`);
      console.log(`statusText: '${error.response.statusText}'`);
      console.log("headers:");
      console.log(error.response.headers);
      console.log(`data: '${error.response.data}'`);
    } else if (error.request) {
      // the request was made but no response was received; 'error.request'
      // is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.log("request:");
      console.log(error.request);
    } else {
      // something happened in setting up the request that triggered an Error
      console.log("Error", error.message);
    }

    console.log("config:");
    console.log(error.config);
  }

  /**
   * Waits asynchronously for the specified time in milliseconds.
   *
   * @param ms The timeout in milliseconds
   */
  private async timeoutAsync(ms: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
  }

  /**
   * Publishes a new download version, creating the parent download if there is
   * no download with the given title.
   *
   * @param title   The parent download's title
   * @param version The version string, e.g., "2.8.2"
   * @param url     The published file's URL, e.g., "https://domain.com/SoftwareUpdate/Setup.exe"
   */
  public async publishDownloadVersionAsync(
    title: string,
    version: string,
    url: string
  ): Promise<IDownloadVersion> {
    if (!this.axiosInstance) {
      throw new Error("The client is not authenticated.");
    }

    if (title === null || title.trim().length === 0) {
      throw new Error("Title must be a non-empty string.");
    }

    if (version === null || version.trim().length === 0) {
      throw new Error("Version must be a non-empty string.");
    }

    if (url === null || url.trim().length === 0) {
      throw new Error("URL must be a non-empty string.");
    }

    const download: IDownload = await this.readOrCreateDownloadAsync(title);
    return await this.createDownloadVersionAsync(download.id, version, url);
  }

  private async readOrCreateDownloadAsync(title: string): Promise<IDownload> {
    // we'll make sure titles don't contain leading or trailing spaces
    const trimmedTitle: string = title.trim();
    const upperCaseTitle: string = trimmedTitle.toUpperCase();

    // find download with matching title, ignoring case
    const downloads: IDownload[] = await this.readDownloadsAsync();
    const download: IDownload = downloads.find(
      d => d.title !== null && d.title.trim().toUpperCase() === upperCaseTitle
    );

    // return the matching download, if any, or create a new one with the desired title.
    return download ? download : await this.createDownloadAsync(trimmedTitle);
  }

  private async readDownloadsAsync(): Promise<IDownload[]> {
    const response: AxiosResponse<IDownload[]> = await this.axiosInstance.get("downloads");
    if (response.status !== 200) {
      throw new Error(`Could not retrieve downloads: "${response.statusText}".`);
    }

    return response.data;
  }

  private async createDownloadAsync(title: string): Promise<IDownload> {
    const response: AxiosResponse<IDownload> = await this.axiosInstance.post("downloads", {
      title: title
    });
    if (response.status !== 201) {
      throw new Error(`Could not create download: "${response.statusText}".`);
    }

    return response.data;
  }

  private async readDownloadVersionsAsync(downloadId: number): Promise<IDownloadVersion[]> {
    const response: AxiosResponse<Array<IDownloadVersion>> = await this.axiosInstance.get(
      `downloads/${downloadId}/versions`
    );
    if (response.status !== 200) {
      throw new Error(`Could not retrieve download versions: "${response.statusText}".`);
    }

    return response.data;
  }

  private async createDownloadVersionAsync(
    downloadId: number,
    version: string,
    url: string
  ): Promise<IDownloadVersion> {
    const response: AxiosResponse<IDownloadVersion> = await this.axiosInstance.post(
      `downloads/${downloadId}/versions`,
      {
        version: version,
        url: url
      }
    );
    if (response.status !== 201) {
      throw new Error(`Could not create download version: "${response.statusText}".`);
    }

    return response.data;
  }
}
