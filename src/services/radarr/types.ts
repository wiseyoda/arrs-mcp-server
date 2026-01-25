/**
 * Radarr v3 API Types
 */

export interface Movie {
  id: number;
  title: string;
  sortTitle: string;
  status: "released" | "inCinemas" | "announced" | "deleted";
  overview?: string;
  studio?: string;
  images: Image[];
  year: number;
  path: string;
  qualityProfileId: number;
  monitored: boolean;
  minimumAvailability: "announced" | "inCinemas" | "released" | "tba";
  isAvailable: boolean;
  folderName?: string;
  runtime: number;
  cleanTitle: string;
  imdbId?: string;
  tmdbId: number;
  titleSlug: string;
  rootFolderPath?: string;
  certification?: string;
  genres: string[];
  tags: number[];
  added: string;
  ratings: Ratings;
  hasFile: boolean;
  sizeOnDisk: number;
  movieFile?: MovieFile;
}

export interface MovieLookup {
  title: string;
  sortTitle: string;
  status: "released" | "inCinemas" | "announced" | "tba";
  overview?: string;
  studio?: string;
  images: Image[];
  remotePoster?: string;
  year: number;
  runtime: number;
  cleanTitle: string;
  imdbId?: string;
  tmdbId: number;
  titleSlug: string;
  certification?: string;
  genres: string[];
  tags: number[];
  ratings: Ratings;
}

export interface MovieFile {
  id: number;
  movieId: number;
  relativePath: string;
  path: string;
  size: number;
  dateAdded: string;
  quality: QualityRevision;
  mediaInfo?: MediaInfo;
}

export interface MediaInfo {
  audioBitrate?: number;
  audioChannels?: number;
  audioCodec?: string;
  audioLanguages?: string;
  audioStreamCount?: number;
  videoBitDepth?: number;
  videoBitrate?: number;
  videoCodec?: string;
  videoDynamicRangeType?: string;
  videoFps?: number;
  resolution?: string;
  runTime?: string;
  scanType?: string;
  subtitles?: string;
}

export interface QueueItem {
  id: number;
  movieId?: number;
  movie?: Movie;
  quality: QualityRevision;
  size: number;
  title: string;
  sizeleft: number;
  timeleft?: string;
  estimatedCompletionTime?: string;
  status: string;
  trackedDownloadStatus?: "ok" | "warning" | "error";
  trackedDownloadState?:
    | "downloading"
    | "importPending"
    | "importBlocked"
    | "importing"
    | "imported"
    | "failedPending";
  statusMessages: StatusMessage[];
  downloadId?: string;
  protocol: "usenet" | "torrent";
  downloadClient?: string;
  indexer?: string;
  outputPath?: string;
  errorMessage?: string;
}

export interface StatusMessage {
  title: string;
  messages: string[];
}

export interface QualityRevision {
  quality: Quality;
  revision: Revision;
}

export interface Quality {
  id: number;
  name: string;
  source: string;
  resolution: number;
}

export interface Revision {
  version: number;
  real: number;
  isRepack: boolean;
}

export interface QualityProfile {
  id: number;
  name: string;
  upgradeAllowed: boolean;
  cutoff: number;
  items: QualityProfileItem[];
}

export interface QualityProfileItem {
  id?: number;
  name?: string;
  quality?: Quality;
  items?: QualityProfileItem[];
  allowed: boolean;
}

export interface RootFolder {
  id: number;
  path: string;
  freeSpace: number;
  totalSpace?: number;
  unmappedFolders?: UnmappedFolder[];
}

export interface UnmappedFolder {
  name: string;
  path: string;
}

export interface Image {
  coverType: "poster" | "fanart" | "banner" | "screenshot" | "headshot";
  url: string;
  remoteUrl?: string;
}

export interface Ratings {
  imdb?: RatingValue;
  tmdb?: RatingValue;
  metacritic?: RatingValue;
  rottenTomatoes?: RatingValue;
}

export interface RatingValue {
  votes: number;
  value: number;
  type: string;
}

export interface HealthCheck {
  source: string;
  type: "error" | "warning" | "notice";
  message: string;
  wikiUrl?: string;
}

export interface Command {
  id: number;
  name: string;
  commandName: string;
  message?: string;
  body?: Record<string, unknown>;
  priority: string;
  status: "queued" | "started" | "completed" | "failed";
  queued: string;
  started?: string;
  ended?: string;
  duration?: string;
  trigger: string;
  stateChangeTime: string;
  sendUpdatesToClient: boolean;
  updateScheduledTask: boolean;
}

export interface AddMovieRequest {
  tmdbId: number;
  title: string;
  qualityProfileId: number;
  titleSlug: string;
  images: Image[];
  rootFolderPath: string;
  monitored?: boolean;
  minimumAvailability?: "announced" | "inCinemas" | "released" | "tba";
  tags?: number[];
  addOptions?: AddMovieOptions;
}

export interface AddMovieOptions {
  searchForMovie?: boolean;
  ignoreEpisodesWithFiles?: boolean;
  ignoreEpisodesWithoutFiles?: boolean;
  monitor?: "movieOnly" | "movieAndCollection" | "none";
}

export interface QueuePage {
  page: number;
  pageSize: number;
  sortKey: string;
  sortDirection: string;
  totalRecords: number;
  records: QueueItem[];
}
