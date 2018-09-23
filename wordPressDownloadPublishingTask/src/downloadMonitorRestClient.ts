import axios, { AxiosInstance, AxiosResponse } from "axios";
import { IJwtAuthUserCredentials, IDownload, IDownloadVersion } from "./interfaces";

/**
 * Download Monitor REST Client.
 */
export class DownloadMonitorRestClient {
  authEndpoint: string;
  downloadMonitorBaseURL: string;
  axiosInstance: AxiosInstance;

  /**
   * Instantiates a new DokuMateReleaseClient, using the given wordPressURL.
   *
   * @param wordPressURL The Wordpress site's URL
   */
  public constructor(wordPressURL: string) {
    this.authEndpoint = `${wordPressURL}/wp-json/jwt-auth/v1/token/`;
    this.downloadMonitorBaseURL = `${wordPressURL}/wp-json/download-monitor/v1/`;

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

    // authenticate with WordPress server.
    let authResponse: AxiosResponse<IJwtAuthUserCredentials> = await axios.post(this.authEndpoint, {
      username: username,
      password: password
    });

    if (authResponse.status !== 200) {
      throw new Error(`Authentication was not successful: "${authResponse.statusText}".`);
    }

    // create the axios instance to be used in authenticated requests.
    this.axiosInstance = axios.create({
      baseURL: this.downloadMonitorBaseURL,
      timeout: 2000,
      headers: {
        Authorization: `Bearer ${authResponse.data.token}`
      }
    });
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
