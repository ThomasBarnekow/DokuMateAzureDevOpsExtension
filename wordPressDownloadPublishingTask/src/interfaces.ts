/**
 * Represents an authentication response.
 */
export interface IJwtAuthUserCredentials {
  token: string;
  user_email: string;
  user_nicename: string;
  user_display_name: string;
}

/**
 * Represents a date as used in WordPress.
 */
export interface IWordPressDate {
  date: string;
  timezone_type: number;
  timezone: string;
}

/**
 * Represents a download.
 */
export interface IDownload {
  id: number;
  status: string;
  title: string;
  slug: string;
  author: number;
  downloadLink: string;
}

/**
 * Represents a download version.
 */
export interface IDownloadVersion {
  id: number;
  downloadId: number;
  version: string;
  menuOrder: number;
  date: IWordPressDate;
  url: string;
  downloadCount: number;
}
