/**
 * Sabnzbd API Types
 *
 * Based on Sabnzbd API documentation.
 * Note: Many numeric values are returned as strings by the Sabnzbd API.
 */

/**
 * Overall server status returned by queue mode
 */
export interface QueueResponse {
  queue: QueueInfo;
}

export interface QueueInfo {
  status: "Downloading" | "Paused" | "Idle";
  speedlimit: string;
  speedlimit_abs: string;
  paused: boolean;
  noofslots: number;
  noofslots_total: number;
  diskspace1: string;
  diskspace2: string;
  diskspacetotal1: string;
  diskspacetotal2: string;
  diskspace1_norm: string;
  diskspace2_norm: string;
  speed: string;
  kbpersec: string;
  size: string;
  sizeleft: string;
  mbleft: string;
  mb: string;
  timeleft: string;
  eta: string;
  slots: QueueSlot[];
  // Quota fields (optional, present when quota is enabled)
  have_quota?: boolean;
  quota?: string;
  left_quota?: string;
}

/**
 * A single item in the download queue
 */
export interface QueueSlot {
  nzo_id: string;
  filename: string;
  labels: string[];
  priority: string;
  cat: string;
  mbleft: string;
  mb: string;
  size: string;
  sizeleft: string;
  percentage: string;
  mbmissing: string;
  status:
    | "Downloading"
    | "Queued"
    | "Paused"
    | "Verifying"
    | "Extracting"
    | "Repairing"
    | "Fetching";
  timeleft: string;
  eta: string;
  avg_age: string;
  script: string;
  msgid: string;
  unpackopts: string;
}

/**
 * History response from Sabnzbd
 */
export interface HistoryResponse {
  history: HistoryInfo;
}

export interface HistoryInfo {
  noofslots: number;
  day_size: string;
  week_size: string;
  month_size: string;
  total_size: string;
  slots: HistorySlot[];
}

/**
 * A single item in download history
 */
export interface HistorySlot {
  nzo_id: string;
  name: string;
  category: string;
  pp: string;
  script: string;
  status:
    | "Completed"
    | "Failed"
    | "Queued"
    | "Extracting"
    | "Repairing"
    | "Verifying";
  fail_message: string;
  bytes: number;
  size: string;
  download_time: number;
  postproc_time: number;
  completed: number;
  storage: string;
  path: string;
  stage_log: StageLogEntry[];
}

export interface StageLogEntry {
  name: string;
  actions: string[];
}

/**
 * Server status response (simplified queue response)
 */
export interface ServerStatus {
  status: "Downloading" | "Paused" | "Idle";
  speed: string;
  speedlimit: string;
  paused: boolean;
  noofslots: number;
  timeleft: string;
  mb: string;
  mbleft: string;
}

/**
 * Categories response
 */
export interface CategoriesResponse {
  categories: string[];
}

/**
 * Simple status response for operations like pause/resume
 */
export interface SimpleResponse {
  status: boolean;
}

/**
 * Speed limit response
 */
export interface SpeedLimitResponse {
  status: boolean;
}

/**
 * Delete response
 */
export interface DeleteResponse {
  status: boolean;
  nzo_ids?: string[];
}

/**
 * Retry response
 */
export interface RetryResponse {
  status: boolean;
  nzo_id?: string;
}

/**
 * Priority response
 */
export interface PriorityResponse {
  status: boolean;
  position?: number;
}

/**
 * Warnings response from Sabnzbd
 */
export interface WarningsResponse {
  warnings: string[];
}

/**
 * Quota information (extracted from queue response)
 */
export interface QuotaInfo {
  have_quota: boolean;
  quota: string;
  left_quota: string;
}

/**
 * Category-to-source mapping for cross-service tracking
 */
export const CATEGORY_SOURCE_MAP: Record<string, string> = {
  tv: "Sonarr",
  sonarr: "Sonarr",
  movies: "Radarr",
  radarr: "Radarr",
  "movies-4k": "Radarr4K",
  radarr4k: "Radarr4K",
  "movies-hd": "Radarr",
  "tv-hd": "Sonarr",
};

/**
 * Get the *arr source from a Sabnzbd category
 */
export function getSourceFromCategory(category: string): string {
  return CATEGORY_SOURCE_MAP[category.toLowerCase()] || "unknown";
}

/**
 * Format Sabnzbd speed string to human-readable format
 * Input: "25.5 M" or "512 K" → Output: "25.5 MB/s" or "512 KB/s"
 */
export function formatSpeed(speed: string): string {
  if (!speed) return "0 KB/s";
  return speed.replace(" M", " MB/s").replace(" K", " KB/s").trim() || "0 KB/s";
}

/**
 * Format Sabnzbd timeleft to human-readable format
 * Input: "2:30:45" → Output: "2h 30m"
 */
export function formatEta(timeleft: string): string {
  if (!timeleft || timeleft === "0:00:00") return "unknown";
  const parts = timeleft.split(":");
  if (parts.length < 2) return timeleft;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m`;
}

/**
 * Format bytes to human-readable size
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Format MB string to human-readable size
 */
export function formatMb(mb: string): string {
  const mbNum = parseFloat(mb);
  if (isNaN(mbNum)) return mb;
  if (mbNum < 1024) return `${mbNum.toFixed(1)} MB`;
  return `${(mbNum / 1024).toFixed(2)} GB`;
}
