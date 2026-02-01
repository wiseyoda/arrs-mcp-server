# Conversation Examples

These examples show how to interact with Claude when arrs-mcp-server is configured as an MCP tool provider. You write natural language requests, and Claude automatically picks the right tools to fulfill them. You never need to call tools directly or know their exact names.

Each example shows a realistic back-and-forth conversation. Tool calls and outputs are shown so you can see what happens behind the scenes, but in practice you just see Claude's formatted responses.

---

## Example 1: Adding a TV Show

A common starting point -- you want to add a show to your library.

**You**: I want to watch Breaking Bad. Can you add it to Sonarr?

**Claude**: Let me search for Breaking Bad first to find the right series.

> Tool: `tv_search` | Parameters: `{ "query": "Breaking Bad" }`

```
Found 3 results:

Breaking Bad (2008) - AMC [TVDB: 81189]
   A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing...

Breaking Bad: Original Minisodes (2009) - AMC [TVDB: 281646]
   Original minisodes set in the Breaking Bad universe...

El Camino: A Breaking Bad Movie (2019) - Netflix [TVDB: 367026]
   The movie follow-up to the Breaking Bad series...
```

The first result is the main series. I will add it now using the TVDB ID 81189.

> Tool: `tv_add` | Parameters: `{ "tvdb_id": 81189, "monitor": "all" }`

```
Added "Breaking Bad" to Sonarr:
- Series ID: 42
- Folder: /data/tv/Breaking Bad
- Monitoring: all
- Episodes: 62
Search started for missing episodes.
```

Breaking Bad has been added to Sonarr. All 62 episodes are being monitored and Sonarr is searching for them now. You can check download progress later by asking what is downloading.

---

## Example 2: Checking Downloads and Managing the Queue

You want to see what is actively downloading across all your services, then pause everything.

**You**: What's downloading right now?

**Claude**: Let me check the unified download status across all services.

> Tool: `downloads_status`

```
Active Downloads (3):

The.Last.of.Us.S02E04.720p.WEB.H264-EDITH
  Progress: 72% | ETA: 00:14:32 | Source: Sonarr

Dune.Part.Two.2024.1080p.BluRay.x264-GROUP
  Progress: 45% | ETA: 00:38:11 | Source: Radarr

Severance.S02E08.1080p.ATVP.WEB-DL.DDP5.1.H264-NTb
  Progress: 91% | ETA: 00:03:44 | Source: Sonarr
```

You have 3 active downloads. Severance is almost done (91%), The Last of Us is at 72%, and Dune Part Two is at 45% with about 38 minutes remaining.

**You**: Pause everything for now, I'm about to jump on a video call.

**Claude**: I will pause all downloads.

> Tool: `downloads_pause`

```
Downloads paused. 3 items in queue.
```

All downloads are paused. Just let me know when you are done with your call and I will resume them.

**You**: OK, call's done. Resume downloads.

**Claude**: Resuming now.

> Tool: `downloads_resume`

```
Downloads resumed. Speed: 24.6 MB/s
```

Downloads are back on at 24.6 MB/s. They will pick up right where they left off.

---

## Example 3: Finding Missing Movies from a Collection

You want to complete your MCU collection and need to figure out which films you are missing.

**You**: What MCU movies am I missing?

**Claude**: Let me look up the Marvel Cinematic Universe collection on TMDB to see the full list.

> Tool: `tmdb_collection` | Parameters: `{ "query": "Marvel Cinematic Universe" }`

```
Collection: Marvel Cinematic Universe
ID: 529892
Total Movies: 33

Movies:
Iron Man (2008) [TMDB: 1726] - Rating: 7.6/10
The Incredible Hulk (2008) [TMDB: 1724] - Rating: 6.2/10
Iron Man 2 (2010) [TMDB: 10138] - Rating: 6.8/10
...
```

Found it. Now let me check which of those 33 movies you already have in your Plex library.

> Tool: `collection_status` | Parameters: `{ "collection_id": 529892 }`

```
Collection: Marvel Cinematic Universe
Status: You have 28 of 33 movies (5 missing)

Iron Man (2008) - Owned
The Incredible Hulk (2008) - Owned
...
```

You own 28 out of 33 MCU movies. Let me get the specific list of what is missing.

> Tool: `collection_missing` | Parameters: `{ "collection_id": 529892 }`

```
Missing from "Marvel Cinematic Universe" (5 of 33):

The Incredible Hulk (2008) - TMDB ID: 1724 | Rating: 6.2/10
Ant-Man and the Wasp (2018) - TMDB ID: 363088 | Rating: 7.1/10
Black Widow (2021) - TMDB ID: 497698 | Rating: 6.7/10
Eternals (2021) - TMDB ID: 524434 | Rating: 6.4/10
The Marvels (2023) - TMDB ID: 609681 | Rating: 6.3/10

Use collection_add_missing to add these to Radarr.
```

You are missing 5 MCU movies. Want me to add all of them to Radarr, or just specific ones?

**You**: Add them all.

**Claude**: I will add all 5 missing movies to Radarr now.

> Tool: `collection_add_missing` | Parameters: `{ "collection_id": 529892, "confirm": true }`

```
Added 5 movies from "Marvel Cinematic Universe" to Radarr:

Added:
  The Incredible Hulk
  Ant-Man and the Wasp
  Black Widow
  Eternals
  The Marvels
```

All 5 missing MCU movies have been added to Radarr and searches are running. You will have the complete collection once they download.

---

## Example 4: Library Cleanup Workflow

You are running low on disk space and want to find content to remove.

**You**: Help me free up some disk space. What can I safely delete?

**Claude**: Let me run a cleanup analysis across all your services to find opportunities.

> Tool: `cleanup_analysis`

```
# Cleanup Analysis

## Service Status
- Plex: OK
- Sonarr: OK
- Radarr: OK
- Sabnzbd: OK

## Summary
Total potential savings: 284.57 GB
Categories found: 4

## Unwatched Movies (365+ days)
Count: 23 | Size: 142.30 GB

- Transformers: Age of Extinction (2014) (8.42 GB) - Added 2023-02-14
- The Mummy: Tomb of the Dragon Emperor (2008) (6.81 GB) - Added 2023-04-09
- Geostorm (2017) (5.93 GB) - Added 2023-01-22
- Jupiter Ascending (2015) (5.44 GB) - Added 2022-11-30
- Cats (2019) (4.72 GB) - Added 2023-06-18
...

... and 18 more

## Old Watched Movies (180+ days ago)
Count: 31 | Size: 98.67 GB

- Inception (2010) (7.21 GB) - Last watched 2024-03-15
- The Dark Knight (2008) (6.88 GB) - Last watched 2024-02-09
...

... and 21 more

## Duplicate Movies
Count: 4 | Size: 31.20 GB

- Interstellar (2014) (15.60 GB) - 2 copies
- Blade Runner 2049 (2017) (9.40 GB) - 2 copies
...

## Failed Downloads
Count: 7 | Size: 12.40 GB
```

You have about 284 GB of potential cleanup across four categories. The easiest wins are:

- **23 unwatched movies** added over a year ago (142 GB) -- these were never watched
- **4 duplicate movies** (31 GB) -- extra copies you do not need
- **7 failed downloads** (12 GB) -- junk files taking space

Want me to dig into the unwatched movies so you can pick what to delete?

**You**: Yeah, show me the biggest unwatched movies with their sizes.

**Claude**: Let me get the unwatched content sorted by size.

> Tool: `plex_unwatched` | Parameters: `{ "days": 365, "show_size": true, "sort": "size", "limit": 10 }`

```
23 items unwatched for 365+ days:

[18234] Transformers: Age of Extinction (2014) - 8.42 GB - (total: 8.42 GB) - Added 2023-02-14
[18312] The Mummy: Tomb of the Dragon Emperor (2008) - 6.81 GB - (total: 15.23 GB) - Added 2023-04-09
[18107] Geostorm (2017) - 5.93 GB - (total: 21.16 GB) - Added 2023-01-22
[17998] Jupiter Ascending (2015) - 5.44 GB - (total: 26.60 GB) - Added 2022-11-30
[18456] Cats (2019) - 4.72 GB - (total: 31.32 GB) - Added 2023-06-18
[18201] Robin Hood (2018) - 4.51 GB - (total: 35.83 GB) - Added 2023-03-07
[18089] Fantastic Four (2015) - 4.23 GB - (total: 40.06 GB) - Added 2023-01-11
[17945] Assassin's Creed (2016) - 3.98 GB - (total: 44.04 GB) - Added 2022-10-28
[18367] The Emoji Movie (2017) - 3.67 GB - (total: 47.71 GB) - Added 2023-05-15
[18423] Playmobil: The Movie (2019) - 3.12 GB - (total: 50.83 GB) - Added 2023-06-02

... and 13 more

Total: 142.30 GB potential savings
```

The top 10 alone account for about 51 GB. The running total shows you how much you would reclaim as you go. Want me to delete any of these?

**You**: Delete Cats and The Emoji Movie. I definitely don't need those.

**Claude**: Deleting both now.

> Tool: `plex_delete` | Parameters: `{ "rating_key": "18456", "confirm": true }`

```
Deleted "Cats" (4.72 GB freed).
```

> Tool: `plex_delete` | Parameters: `{ "rating_key": "18367", "confirm": true }`

```
Deleted "The Emoji Movie" (3.67 GB freed).
```

Done. You freed up 8.39 GB by removing Cats and The Emoji Movie. Let me know if you want to continue cleaning up more items.

---

## Example 5: Cross-Service Health Check and Troubleshooting

You want to make sure all your services are running properly.

**You**: Is everything working?

**Claude**: Let me run a health check across all your configured services with detailed information.

> Tool: `system_health` | Parameters: `{ "verbose": true }`

```
System Health: WARNING

Sonarr: OK
  Counts: series: 87, episodes: 4231, queue: 2
  Queue: 2 items downloading
  Recent:
    - Severance S02E08 - 2026-01-31
    - The White Lotus S03E05 - 2026-02-02
    - The Last of Us S02E05 - 2026-02-03
  No issues

Radarr: OK
  Counts: movies: 342, downloaded: 318, monitored: 340, queue: 1
  Queue: 1 items downloading
  Recent:
    - Dune: Part Two (2024) - Added 1/28/2026
    - The Brutalist (2024) - Added 1/25/2026
    - Nosferatu (2024) - Added 1/22/2026
  No issues

Plex: OK
  Version: 1.41.3.9314
  Counts: libraries: 4, movies: 342, shows: 87
  Recent:
    - Nosferatu (2024) in Movies
    - Severance (2022) in TV Shows
    - The Brutalist (2024) in Movies
  - 4 libraries, server: MediaServer

Sabnzbd: WARNING
  Counts: queue: 3, history: 150, failed: 2
  Queue: 3 items, 12.4 GB left, ETA: 00:52:33
  Recent:
    - The.Last.of.Us.S02E04 (1/31/2026)
    - Dune.Part.Two.2024 (1/30/2026)
  - 3 items in queue, speed: 24.6 MB/s
  - Downloads paused

Overseerr: OK
  Version: 2.1.0
  Counts: pendingRequests: 3, totalRequests: 156
  Queue: 3 pending requests
```

Most services are healthy. There is one warning:

- **SABnzbd** shows downloads are paused. This might be left over from an earlier pause. There are also 2 failed downloads in history that could be cleaned up.

Everything else looks good -- Sonarr is tracking 87 series, Radarr has 342 movies (318 downloaded), Plex is running version 1.41.3 with all 4 libraries, and Overseerr has 3 pending requests waiting for your approval.

Would you like me to resume SABnzbd downloads, or check on those pending Overseerr requests?

---

## Example 6: Managing Overseerr Requests

You want to review and handle requests from your users.

**You**: Any pending requests?

**Claude**: Let me check Overseerr for pending requests.

> Tool: `request_list` | Parameters: `{ "status": "pending", "limit": 20 }`

```
Found 3 requests:

[41] Oppenheimer (Movie) - Pending
   Requested by: Sarah on 1/28/2026
   TMDB ID: 872585

[42] Shogun (TV) - Pending
   Requested by: Mike on 1/29/2026
   TMDB ID: 126308

[43] Kung Fu Panda 4 (Movie) - Pending
   Requested by: Alex on 1/30/2026
   TMDB ID: 1011985
```

You have 3 pending requests:

1. **Oppenheimer** (Movie) -- requested by Sarah
2. **Shogun** (TV) -- requested by Mike
3. **Kung Fu Panda 4** (Movie) -- requested by Alex

**You**: Approve Oppenheimer and Shogun. Decline Kung Fu Panda.

**Claude**: I will handle all three.

> Tool: `request_approve` | Parameters: `{ "request_id": 41 }`

```
Approved request #41 for "Oppenheimer".
The movie will be added to Radarr and search will begin.
```

> Tool: `request_approve` | Parameters: `{ "request_id": 42 }`

```
Approved request #42 for "Shogun".
The tv will be added to Sonarr and search will begin.
```

> Tool: `request_decline` | Parameters: `{ "request_id": 43 }`

```
Declined request #43 for "Kung Fu Panda 4".
```

Done. Oppenheimer will be added to Radarr and Shogun will be added to Sonarr -- both will start searching for downloads right away. Kung Fu Panda 4 has been declined.

---

## Example 7: Smart Space Planning

You need to free up a specific amount of space and want data-driven recommendations.

**You**: I need to free up 50GB. What should I delete?

**Claude**: Let me run the space planner to find the best cleanup candidates. It scores items based on file size, how long ago they were watched, and their rating -- so large, old, low-rated content shows up first.

> Tool: `space_planner` | Parameters: `{ "target_gb": 50 }`

```
# Space Planner Recommendations

**Target**: 50.0 GB | **Type**: all
**Analyzed**: 429 items (342 movies, 87 shows) totaling 4218.3 GB

## Top 8 Recommendations

| # | Title | Year | Size | Last Watched | Rating | Score | Reason |
|---|-------|------|------|--------------|--------|-------|--------|
| 1 | Transformers: Age of Extinction | 2014 | 8.4 GB | never | 5.8 | 2646 | large file, never watched |
| 2 | The Hobbit: Battle of Five Armies | 2014 | 12.1 GB | 2023-06-14 | 7.3 | 1548 | large file, watched 1+ year ago |
| 3 | Geostorm | 2017 | 5.9 GB | never | 5.3 | 2035 | never watched, below average rating |
| 4 | Jupiter Ascending | 2015 | 5.4 GB | never | 5.3 | 1862 | never watched, below average rating |
| 5 | Cats | 2019 | 4.7 GB | never | 4.1 | 2095 | never watched, low rating |
| 6 | Robin Hood | 2018 | 4.5 GB | never | 5.3 | 1553 | never watched, below average rating |
| 7 | The Mummy: Dragon Emperor | 2008 | 6.8 GB | 2023-01-10 | 5.2 | 1300 | watched 2+ years ago, below average rating |
| 8 | Fantastic Four | 2015 | 4.2 GB | never | 4.3 | 1786 | never watched, low rating |

**Running Total**: 52.0 GB (target reached)

---

**Scoring Formula**: (size_gb x days_since_watched) / (rating x rewatch_factor)
Higher scores indicate better cleanup candidates.
```

The planner found 8 items that would free up 52 GB -- just over your 50 GB target. The top candidates are all either never watched, watched a long time ago, or have low ratings. Highlights:

- **The Hobbit: Battle of Five Armies** is the largest single item at 12.1 GB, and you watched it over 2 years ago
- **Transformers: Age of Extinction** has never been watched and scores highest overall
- **Cats** and **Fantastic Four** both have low ratings and were never watched

The scoring formula ensures you are not losing anything valuable -- high-rated or recently-watched content scores low and stays off this list.

**You**: Those all look fine to delete. But keep The Hobbit, I might rewatch the trilogy.

**Claude**: Understood. I will delete everything except The Hobbit. That will be 7 items totaling about 39.9 GB. Let me get those removed.

> Tool: `plex_delete` | Parameters: `{ "rating_key": "18234", "confirm": true }`

```
Deleted "Transformers: Age of Extinction" (8.42 GB freed).
```

> Tool: `plex_delete` | Parameters: `{ "rating_key": "18107", "confirm": true }`

```
Deleted "Geostorm" (5.93 GB freed).
```

> Tool: `plex_delete` | Parameters: `{ "rating_key": "17998", "confirm": true }`

```
Deleted "Jupiter Ascending" (5.44 GB freed).
```

> Tool: `plex_delete` | Parameters: `{ "rating_key": "18456", "confirm": true }`

```
Deleted "Cats" (4.72 GB freed).
```

> Tool: `plex_delete` | Parameters: `{ "rating_key": "18201", "confirm": true }`

```
Deleted "Robin Hood" (4.51 GB freed).
```

> Tool: `plex_delete` | Parameters: `{ "rating_key": "18312", "confirm": true }`

```
Deleted "The Mummy: Tomb of the Dragon Emperor" (6.81 GB freed).
```

> Tool: `plex_delete` | Parameters: `{ "rating_key": "18089", "confirm": true }`

```
Deleted "Fantastic Four" (4.23 GB freed).
```

All done. Removed 7 items and freed up 40.06 GB. You are about 10 GB short of the original 50 GB target since we kept The Hobbit. If you need more space, I can pull up the next batch of recommendations or check for duplicate files.
