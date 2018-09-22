/**
 * Represents an authentication response.
 */
export interface IJwtAuthResponseData {
  token: string;
  user_email: string;
  user_nicename: string;
  user_display_name: string;
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
  download_link: string;
}

/**
 * Represents a download version.
 */
export interface IDownloadVersion {
  id: number;
  download_id: number;
  version: string;
  menu_order: number;
  date: IWordPressDate;
  url: string;
  download_count: number;
}

/**
 * Represents a date as used in WordPress.
 */
export interface IWordPressDate {
  date: string;
  timezone_type: number;
  timezone: string;
}
