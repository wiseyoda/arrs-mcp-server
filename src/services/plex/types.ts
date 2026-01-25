/**
 * Plex Media Server API Types
 */

// Library/Section types

export interface PlexLibrary {
  key: string;
  title: string;
  type: "movie" | "show" | "artist" | "photo";
  agent: string;
  scanner: string;
  language: string;
  uuid: string;
  updatedAt: number;
  createdAt: number;
  scannedAt: number;
  content: boolean;
  directory: boolean;
  refreshing: boolean;
  thumb?: string;
  art?: string;
}

// Media item types

export interface PlexMediaItem {
  ratingKey: string;
  key: string;
  guid: string;
  type: "movie" | "show" | "season" | "episode";
  title: string;
  titleSort?: string;
  summary?: string;
  year?: number;
  thumb?: string;
  art?: string;
  duration?: number;
  addedAt: number;
  updatedAt?: number;
  viewCount?: number;
  lastViewedAt?: number;
  contentRating?: string;
  rating?: number;
  audienceRating?: number;
  ratingImage?: string;
  audienceRatingImage?: string;
  studio?: string;
  tagline?: string;
  originallyAvailableAt?: string;
  Media?: PlexMedia[];
  Genre?: PlexTag[];
  Country?: PlexTag[];
  Director?: PlexTag[];
  Writer?: PlexTag[];
  Role?: PlexTag[];
  // For shows
  leafCount?: number;
  viewedLeafCount?: number;
  childCount?: number;
  // For episodes
  parentRatingKey?: string;
  grandparentRatingKey?: string;
  parentTitle?: string;
  grandparentTitle?: string;
  index?: number;
  parentIndex?: number;
}

export interface PlexMedia {
  id: number;
  duration: number;
  bitrate: number;
  width: number;
  height: number;
  aspectRatio: number;
  audioChannels: number;
  audioCodec: string;
  videoCodec: string;
  videoResolution: string;
  container: string;
  videoFrameRate: string;
  videoProfile: string;
  Part: PlexPart[];
}

export interface PlexPart {
  id: number;
  key: string;
  duration: number;
  file: string;
  size: number;
  container: string;
  videoProfile: string;
}

export interface PlexTag {
  tag: string;
  id?: number;
}

// API response wrappers

export interface PlexMediaContainer<T> {
  MediaContainer: {
    size: number;
    totalSize?: number;
    offset?: number;
    allowSync?: boolean;
    art?: string;
    identifier?: string;
    librarySectionID?: number;
    librarySectionTitle?: string;
    librarySectionUUID?: string;
    mediaTagPrefix?: string;
    mediaTagVersion?: number;
    thumb?: string;
    title1?: string;
    title2?: string;
    viewGroup?: string;
    viewMode?: number;
    Directory?: T[];
    Metadata?: T[];
    Hub?: PlexHub[];
  };
}

export interface PlexHub {
  hubKey: string;
  key: string;
  title: string;
  type: string;
  hubIdentifier: string;
  context: string;
  size: number;
  more: boolean;
  style: string;
  Metadata?: PlexMediaItem[];
}

// Server identity response

export interface PlexServerIdentity {
  MediaContainer: {
    size: number;
    allowCameraUpload: boolean;
    allowChannelAccess: boolean;
    allowMediaDeletion: boolean;
    allowSharing: boolean;
    allowSync: boolean;
    allowTuners: boolean;
    backgroundProcessing: boolean;
    certificate: boolean;
    companionProxy: boolean;
    countryCode: string;
    diagnostics: string;
    eventStream: boolean;
    friendlyName: string;
    hubSearch: boolean;
    itemClusters: boolean;
    livetv: number;
    machineIdentifier: string;
    mediaProviders: boolean;
    multiuser: boolean;
    musicAnalysis: number;
    myPlex: boolean;
    myPlexMappingState: string;
    myPlexSigninState: string;
    myPlexSubscription: boolean;
    myPlexUsername: string;
    offlineTranscode: number;
    ownerFeatures: string;
    photoAutoTag: boolean;
    platform: string;
    platformVersion: string;
    pluginHost: boolean;
    pushNotifications: boolean;
    readOnlyLibraries: boolean;
    requestParametersInCookie: boolean;
    streamingBrainABRVersion: number;
    streamingBrainVersion: number;
    sync: boolean;
    transcoderActiveVideoSessions: number;
    transcoderAudio: boolean;
    transcoderLyrics: boolean;
    transcoderPhoto: boolean;
    transcoderSubtitles: boolean;
    transcoderVideo: boolean;
    transcoderVideoBitrates: string;
    transcoderVideoQualities: string;
    transcoderVideoResolutions: string;
    updatedAt: number;
    updater: boolean;
    version: string;
    voiceSearch: boolean;
  };
}

// Simplified types for tool responses

export interface LibraryInfo {
  key: string;
  title: string;
  type: string;
}

export interface MediaItemInfo {
  ratingKey: string;
  title: string;
  year?: number;
  library: string;
  type: string;
  watched: boolean;
  viewCount: number;
  lastViewedAt?: Date;
  addedAt: Date;
  sizeBytes?: number;
  // Enhanced fields
  rating?: number;
  audienceRating?: number;
  contentRating?: string;
  duration?: number;
  studio?: string;
  summary?: string;
  tagline?: string;
  originallyAvailableAt?: string;
  genres?: string[];
  countries?: string[];
  directors?: string[];
  actors?: string[];
  videoResolution?: string;
  videoCodec?: string;
  audioCodec?: string;
  audioChannels?: number;
}
