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
const dokuMateReleaseClient_1 = require("./dokuMateReleaseClient");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // define server and user parameters.
            const hostname = "barnekow.me";
            const username = "ApiUser";
            const password = "Y)vO1NL3hB()j6p#2rCT1(t*";
            // define download and version parameters.
            const title = "DokuMate for Office New";
            const version = "2.8.3";
            const url = "https://barnekow.me/SoftwareUpdate/Bundle/DokuMateForOfficeSetup-2.8.3.txt";
            // authenticate.
            console.log("Authenticating ...");
            const client = new dokuMateReleaseClient_1.DokuMateReleaseClient(hostname);
            yield client.authenticateAsync(username, password);
            // create download version.
            console.log("Publishing download version ...");
            const downloadVersion = yield client.publishDownloadVersionAsync(title, version, url);
            console.log(`Created download version: ${JSON.stringify(downloadVersion)}.`);
        }
        catch (err) {
            console.log(err.message);
        }
    });
}
main();
//# sourceMappingURL=main.js.map