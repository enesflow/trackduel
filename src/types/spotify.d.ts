/**
 * Represents an object containing external URLs.
 */
export interface ExternalUrls {
  spotify: string;
}

/**
 * Represents an artist on Spotify.
 */
export interface Artist {
  external_urls: ExternalUrls;
  href: string;
  id: string;
  name: string;
  type: "artist";
  uri: string;
}

/**
 * Represents an image, such as album art.
 */
export interface Image {
  height: number;
  width: number;
  url: string;
}

/**
 * Represents an album on Spotify.
 */
export interface Album {
  album_type: "album" | "single" | "compilation";
  artists: Artist[];
  available_markets: string[];
  external_urls: ExternalUrls;
  href: string;
  id: string;
  images: Image[];
  is_playable: boolean;
  name: string;
  release_date: string;
  release_date_precision: "day" | "month" | "year";
  total_tracks: number;
  type: "album";
  uri: string;
}

/**
 * Represents external identifiers for a track.
 */
export interface ExternalIds {
  isrc: string;
}

/**
 * Represents a full track object from the Spotify API.
 */
export interface Track {
  album: Album;
  artists: Artist[];
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_ids: ExternalIds;
  external_urls: ExternalUrls;
  href: string;
  id: string;
  is_local: boolean;
  is_playable: boolean;
  name: string;
  popularity: number;
  preview_url: string | null;
  track_number: number;
  type: "track";
  uri: string;
}

/**
 * Represents an item in a playlist or a list of saved tracks,
 * including when it was added.
 */
export interface SpotifyTrackItem {
  added_at: string;
  track: Track;
}

/**
 * Defines the overall structure as an array of SpotifyTrackItem objects.
 */
export type SpotifyPlaylist = SpotifyTrackItem[];