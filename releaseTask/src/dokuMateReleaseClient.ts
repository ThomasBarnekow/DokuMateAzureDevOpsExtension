import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from "axios";
import { IJwtAuthResponseData, IDownload, IDownloadVersion } from "./interfaces";

/**
 * DokuMate Release REST Client.
 */
export class DokuMateReleaseClient {
  authEndpoint: string;
  dokuMateBaseURL: string;
  axiosInstance: AxiosInstance;

  /**
   * Instantiates a new DokuMateReleaseClient, using the given wordPressURL.
   *
   * @param wordPressURL The fully qualified domain name of the Wordpress site
   */
  public constructor(wordPressURL: string) {
    this.authEndpoint = `${wordPressURL}/wp-json/jwt-auth/v1/token/`;
    this.dokuMateBaseURL = `${wordPressURL}/wp-json/dokumate/v1/`;

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
    let authResponse: AxiosResponse<IJwtAuthResponseData> = await axios.post(this.authEndpoint, {
      username: username,
      password: password
    });

    if (authResponse.status !== 200) {
      throw new Error(`Authentication was not successful: "${authResponse.statusText}".`);
    }

    // create the axios instance to be used in authenticated requests.
    this.axiosInstance = axios.create({
      baseURL: this.dokuMateBaseURL,
      timeout: 2000,
      headers: {
        Authorization: `Bearer ${authResponse.data.token}`
      }
    });
  }

  /**
   * Publishes a new download version.
   *
   * @param title   The parent download's title
   * @param version The version string, e.g., "2.8.2"
   * @param url     The published file's URL, e.g., "https://dokumate.com/SoftwareUpdate/Setup.exe"
   */
  public async publishDownloadVersionAsync(
    title: string,
    version: string,
    url: string
  ): Promise<IDownloadVersion> {
    if (!this.axiosInstance) {
      throw new Error("The client is not authenticated.");
    }

    const download: IDownload = await this.getOrCreateDownloadAsync(title);
    return await this.postDownloadVersionAsync(download.id, version, url);
  }

  private async getOrCreateDownloadAsync(title: string): Promise<IDownload> {
    const downloads: IDownload[] = await this.getDownloadsAsync();
    const download: IDownload = downloads.find(d => d.title === title);
    return download ? download : await this.postDownloadAsync(title);
  }

  private async getDownloadsAsync(): Promise<IDownload[]> {
    const response: AxiosResponse<IDownload[]> = await this.axiosInstance.get("downloads");
    if (response.status !== 200) {
      throw new Error(`Could not retrieve downloads: "${response.statusText}".`);
    }

    return response.data;
  }

  private async postDownloadAsync(title: string): Promise<IDownload> {
    const response: AxiosResponse<IDownload> = await this.axiosInstance.post("downloads", {
      title: title
    });
    if (response.status !== 201) {
      throw new Error(`Could not create download: "${response.statusText}".`);
    }

    return response.data;
  }

  private async getDownloadVersionsAsync(downloadId: number): Promise<IDownloadVersion[]> {
    const response: AxiosResponse<Array<IDownloadVersion>> = await this.axiosInstance.get(
      `downloads/${downloadId}/versions`
    );
    if (response.status !== 200) {
      throw new Error(`Could not retrieve download versions: "${response.statusText}".`);
    }

    return response.data;
  }

  private async postDownloadVersionAsync(
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
