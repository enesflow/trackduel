/**
 * Represents the overall response from the YouTube API for a playlist item list request.
 */
export interface YoutubePlaylistItemListResponse {
  kind: "youtube#playlistItemListResponse";
  etag: string;
  nextPageToken?: string; // Optional: Not present on the last page
  items: PlaylistItem[];
  pageInfo: PageInfo;
}

/**
 * Represents a single item within a YouTube playlist.
 */
export interface PlaylistItem {
  kind: "youtube#playlistItem";
  etag: string;
  id: string;
  snippet: Snippet;
  contentDetails: ContentDetails;
}

/**
 * Contains detailed information about the playlist item.
 */
export interface Snippet {
  publishedAt: string; // ISO 8601 format date-time
  channelId: string;
  title: string;
  description: string;
  thumbnails: Thumbnails;
  channelTitle: string;
  playlistId: string;
  position: number;
  resourceId: ResourceId;
  videoOwnerChannelTitle: string;
  videoOwnerChannelId: string;
}

/**
 * A map of available thumbnail images for the video.
 */
export interface Thumbnails {
  default: Thumbnail;
  medium: Thumbnail;
  high: Thumbnail;
  standard?: Thumbnail; // Optional: May not be available for all videos
  maxres?: Thumbnail;   // Optional: May not be available for all videos
}

/**
 * Represents a single thumbnail image with its properties.
 */
export interface Thumbnail {
  url: string;
  width: number;
  height: number;
}

/**
 * Identifies the YouTube video associated with the playlist item.
 */
export interface ResourceId {
  kind: "youtube#video";
  videoId: string;
}

/**
 * Contains content-specific details for the playlist item, such as the video ID and publish date.
 */
export interface ContentDetails {
  videoId: string;
  videoPublishedAt: string; // ISO 8601 format date-time
}

/**
 * Contains pagination information for the result set.
 */
export interface PageInfo {
  totalResults: number;
  resultsPerPage: number;
}
