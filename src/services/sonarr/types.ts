/**
 * Sonarr v3 API Types
 */

export interface Series {
  id: number;
  title: string;
  sortTitle: string;
  status: "continuing" | "ended" | "upcoming" | "deleted";
  overview?: string;
  network?: string;
  airTime?: string;
  images: Image[];
  seasons: Season[];
  year: number;
  path: string;
  qualityProfileId: number;
  seasonFolder: boolean;
  monitored: boolean;
  useSceneNumbering: boolean;
  runtime: number;
  tvdbId: number;
  tvRageId?: number;
  tvMazeId?: number;
  firstAired?: string;
  seriesType: "standard" | "daily" | "anime";
  cleanTitle: string;
  imdbId?: string;
  titleSlug: string;
  rootFolderPath?: string;
  certification?: string;
  genres: string[];
  tags: number[];
  added: string;
  ratings: Ratings;
  statistics: SeriesStatistics;
  ended?: boolean;
}

export interface SeriesStatistics {
  seasonCount: number;
  episodeFileCount: number;
  episodeCount: number;
  totalEpisodeCount: number;
  sizeOnDisk: number;
  percentOfEpisodes: number;
}

export interface Season {
  seasonNumber: number;
  monitored: boolean;
  statistics?: SeasonStatistics;
}

export interface SeasonStatistics {
  episodeFileCount: number;
  episodeCount: number;
  totalEpisodeCount: number;
  sizeOnDisk: number;
  percentOfEpisodes: number;
}

export interface Episode {
  id: number;
  seriesId: number;
  tvdbId?: number;
  episodeFileId: number;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  airDate?: string;
  airDateUtc?: string;
  overview?: string;
  hasFile: boolean;
  monitored: boolean;
  absoluteEpisodeNumber?: number;
  sceneAbsoluteEpisodeNumber?: number;
  sceneEpisodeNumber?: number;
  sceneSeasonNumber?: number;
  unverifiedSceneNumbering: boolean;
  grabbed?: boolean;
}

export interface QueueItem {
  id: number;
  seriesId?: number;
  episodeId?: number;
  series?: Series;
  episode?: Episode;
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
  coverType: "banner" | "poster" | "fanart";
  url: string;
  remoteUrl?: string;
}

export interface Ratings {
  votes: number;
  value: number;
}

export interface HealthCheck {
  source: string;
  type: "error" | "warning" | "notice";
  message: string;
  wikiUrl?: string;
}

export interface Calendar {
  seriesId: number;
  episodeId: number;
  series: Series;
  episode: Episode;
  releaseDate?: string;
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

export interface SeriesLookup {
  title: string;
  sortTitle: string;
  status: string;
  overview?: string;
  network?: string;
  airTime?: string;
  images: Image[];
  remotePoster?: string;
  seasons: Season[];
  year: number;
  qualityProfileId?: number;
  seasonFolder?: boolean;
  monitored?: boolean;
  useSceneNumbering?: boolean;
  runtime: number;
  tvdbId: number;
  tvRageId?: number;
  tvMazeId?: number;
  firstAired?: string;
  seriesType?: string;
  cleanTitle: string;
  imdbId?: string;
  titleSlug: string;
  rootFolderPath?: string;
  certification?: string;
  genres: string[];
  tags: number[];
  added?: string;
  ratings: Ratings;
  statistics?: SeriesStatistics;
}

export interface AddSeriesRequest {
  tvdbId: number;
  title: string;
  qualityProfileId: number;
  titleSlug: string;
  images: Image[];
  seasons: Season[];
  rootFolderPath: string;
  monitored?: boolean;
  seasonFolder?: boolean;
  seriesType?: string;
  tags?: number[];
  addOptions?: AddSeriesOptions;
}

export interface AddSeriesOptions {
  ignoreEpisodesWithFiles?: boolean;
  ignoreEpisodesWithoutFiles?: boolean;
  monitor?:
    | "all"
    | "future"
    | "missing"
    | "existing"
    | "pilot"
    | "firstSeason"
    | "none";
  searchForMissingEpisodes?: boolean;
  searchForCutoffUnmetEpisodes?: boolean;
}

export interface QueuePage {
  page: number;
  pageSize: number;
  sortKey: string;
  sortDirection: string;
  totalRecords: number;
  records: QueueItem[];
}
