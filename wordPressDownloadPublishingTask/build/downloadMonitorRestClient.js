"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
/**
 * Download Monitor REST Client.
 */
class DownloadMonitorRestClient {
    /**
     * Instantiates a new DokuMateReleaseClient, using the given wordPressURL.
     *
     * @param wordPressURL The Wordpress site's URL
     */
    constructor(wordPressURL) {
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
    authenticateAsync(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            // reset client state.
            this.axiosInstance = null;
            // authenticate with WordPress server.
            let authResponse = yield axios_1.default.post(this.authEndpoint, {
                username: username,
                password: password
            });
            if (authResponse.status !== 200) {
                throw new Error(`Authentication was not successful: "${authResponse.statusText}".`);
            }
            // create the axios instance to be used in authenticated requests.
            this.axiosInstance = axios_1.default.create({
                baseURL: this.downloadMonitorBaseURL,
                timeout: 2000,
                headers: {
                    Authorization: `Bearer ${authResponse.data.token}`
                }
            });
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
    publishDownloadVersionAsync(title, version, url) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const download = yield this.readOrCreateDownloadAsync(title);
            return yield this.createDownloadVersionAsync(download.id, version, url);
        });
    }
    readOrCreateDownloadAsync(title) {
        return __awaiter(this, void 0, void 0, function* () {
            // we'll make sure titles don't contain leading or trailing spaces
            const trimmedTitle = title.trim();
            const upperCaseTitle = trimmedTitle.toUpperCase();
            // find download with matching title, ignoring case
            const downloads = yield this.readDownloadsAsync();
            const download = downloads.find(d => d.title !== null && d.title.trim().toUpperCase() === upperCaseTitle);
            // return the matching download, if any, or create a new one with the desired title.
            return download ? download : yield this.createDownloadAsync(trimmedTitle);
        });
    }
    readDownloadsAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.axiosInstance.get("downloads");
            if (response.status !== 200) {
                throw new Error(`Could not retrieve downloads: "${response.statusText}".`);
            }
            return response.data;
        });
    }
    createDownloadAsync(title) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.axiosInstance.post("downloads", {
                title: title
            });
            if (response.status !== 201) {
                throw new Error(`Could not create download: "${response.statusText}".`);
            }
            return response.data;
        });
    }
    readDownloadVersionsAsync(downloadId) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.axiosInstance.get(`downloads/${downloadId}/versions`);
            if (response.status !== 200) {
                throw new Error(`Could not retrieve download versions: "${response.statusText}".`);
            }
            return response.data;
        });
    }
    createDownloadVersionAsync(downloadId, version, url) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.axiosInstance.post(`downloads/${downloadId}/versions`, {
                version: version,
                url: url
            });
            if (response.status !== 201) {
                throw new Error(`Could not create download version: "${response.statusText}".`);
            }
            return response.data;
        });
    }
}
exports.DownloadMonitorRestClient = DownloadMonitorRestClient;
//# sourceMappingURL=downloadMonitorRestClient.js.map