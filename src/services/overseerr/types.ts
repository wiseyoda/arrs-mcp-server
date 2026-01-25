// Request status values from Overseerr API
export const RequestStatus = {
  PENDING: 1,
  APPROVED: 2,
  DECLINED: 3,
  AVAILABLE: 4,
} as const;

export type RequestStatusValue =
  (typeof RequestStatus)[keyof typeof RequestStatus];

// Request types
export interface MediaInfo {
  id: number;
  tmdbId: number;
  tvdbId?: number;
  title?: string;
  name?: string;
  status: number;
  mediaType: "movie" | "tv";
}

export interface RequestedBy {
  id: number;
  displayName: string;
  email?: string;
  avatar?: string;
}

export interface Request {
  id: number;
  status: RequestStatusValue;
  type: "movie" | "tv";
  media: MediaInfo;
  requestedBy: RequestedBy;
  createdAt: string;
  updatedAt: string;
  seasons?: { seasonNumber: number }[];
}

export interface RequestPage {
  pageInfo: {
    pages: number;
    pageSize: number;
    results: number;
    page: number;
  };
  results: Request[];
}

// User types
export interface User {
  id: number;
  email: string;
  displayName: string;
  avatar?: string;
  requestCount: number;
  permissions: number;
  createdAt: string;
}

export interface UserPage {
  pageInfo: {
    pages: number;
    pageSize: number;
    results: number;
    page: number;
  };
  results: User[];
}

export interface Quota {
  movie: {
    limit: number;
    used: number;
    remaining: number;
    restricted: boolean;
  };
  tv: {
    limit: number;
    used: number;
    remaining: number;
    restricted: boolean;
  };
}

// Issue types
export interface IssueComment {
  id: number;
  message: string;
  createdAt: string;
  user: {
    id: number;
    displayName: string;
  };
}

export interface Issue {
  id: number;
  issueType: number;
  status: number;
  problemSeason?: number;
  problemEpisode?: number;
  media: {
    id: number;
    tmdbId: number;
    title?: string;
    name?: string;
    mediaType: "movie" | "tv";
  };
  createdBy: {
    id: number;
    displayName: string;
  };
  comments: IssueComment[];
  createdAt: string;
  updatedAt: string;
}

export interface IssuePage {
  pageInfo: {
    pages: number;
    pageSize: number;
    results: number;
    page: number;
  };
  results: Issue[];
}

// Discovery types
export interface DiscoverResult {
  id: number;
  mediaType: "movie" | "tv";
  title?: string;
  name?: string;
  overview?: string;
  releaseDate?: string;
  firstAirDate?: string;
  popularity: number;
  voteAverage: number;
  posterPath?: string;
}

export interface DiscoverPage {
  page: number;
  totalPages: number;
  totalResults: number;
  results: DiscoverResult[];
}
