// TMDB API Response Types

// Collection types
export interface CollectionSearchResult {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
}

export interface CollectionSearchResponse {
  page: number;
  results: CollectionSearchResult[];
  total_pages: number;
  total_results: number;
}

export interface CollectionPart {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  video: boolean;
  genre_ids: number[];
}

export interface Collection {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  parts: CollectionPart[];
}

// Movie types
export interface Movie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  video: boolean;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  runtime?: number;
  status?: string;
  tagline?: string;
  belongs_to_collection?: {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
  } | null;
}

export interface MovieSearchResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

// Library matching types
export interface MovieWithLibraryStatus extends CollectionPart {
  inLibrary: boolean;
  plexRatingKey?: string;
}

export interface CollectionStatus {
  collection: {
    id: number;
    name: string;
    overview: string;
  };
  totalMovies: number;
  ownedMovies: number;
  missingMovies: number;
  movies: MovieWithLibraryStatus[];
}
