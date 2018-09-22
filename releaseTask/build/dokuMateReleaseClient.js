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
 * DokuMate Release REST Client.
 */
class DokuMateReleaseClient {
    /**
     * Instantiates a new DokuMateReleaseClient, using the given wordPressURL.
     *
     * @param wordPressURL The fully qualified domain name of the Wordpress site
     */
    constructor(wordPressURL) {
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
                baseURL: this.dokuMateBaseURL,
                timeout: 2000,
                headers: {
                    Authorization: `Bearer ${authResponse.data.token}`
                }
            });
        });
    }
    /**
     * Publishes a new download version if it does not yet exist.
     *
     * @param title   The parent download's title
     * @param version The version string, e.g., "2.8.2"
     * @param url     The published file's URL, e.g., "https://dokumate.com/SoftwareUpdate/Setup.exe"
     */
    publishDownloadVersionAsync(title, version, url) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.axiosInstance) {
                throw new Error("The client is not authenticated.");
            }
            const download = yield this.getOrCreateDownloadAsync(title);
            const downloadVersions = yield this.getDownloadVersionsAsync(download.id);
            let downloadVersion = downloadVersions.find(v => v.version === version);
            if (downloadVersion) {
                return downloadVersion;
            }
            return yield this.postDownloadVersionAsync(download.id, version, url);
        });
    }
    getOrCreateDownloadAsync(title) {
        return __awaiter(this, void 0, void 0, function* () {
            const downloads = yield this.getDownloadsAsync();
            const download = downloads.find(d => d.title === title);
            return download ? download : yield this.postDownloadAsync(title);
        });
    }
    getDownloadsAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.axiosInstance.get("downloads");
            if (response.status !== 200) {
                throw new Error(`Could not retrieve downloads: "${response.statusText}".`);
            }
            return response.data;
        });
    }
    postDownloadAsync(title) {
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
    getDownloadVersionsAsync(downloadId) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.axiosInstance.get(`downloads/${downloadId}/versions`);
            if (response.status !== 200) {
                throw new Error(`Could not retrieve download versions: "${response.statusText}".`);
            }
            return response.data;
        });
    }
    postDownloadVersionAsync(downloadId, version, url) {
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
exports.DokuMateReleaseClient = DokuMateReleaseClient;
//# sourceMappingURL=dokuMateReleaseClient.js.map