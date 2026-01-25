import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Config } from "../config.js";

interface ServiceInfo {
  name: string;
  status: string;
  description: string;
}

function getConnectedServices(config: Config): ServiceInfo[] {
  const services: ServiceInfo[] = [];

  if (config.sonarr) {
    services.push({
      name: "Sonarr",
      status: "Connected",
      description: "TV Show Management",
    });
  }
  if (config.radarr) {
    services.push({
      name: "Radarr",
      status: "Connected",
      description: "Movie Management (HD)",
    });
  }
  if (config.radarr4k) {
    services.push({
      name: "Radarr4K",
      status: "Connected",
      description: "Movie Management (4K)",
    });
  }
  if (config.plex) {
    services.push({
      name: "Plex",
      status: "Connected",
      description: "Media Library",
    });
  }
  if (config.sabnzbd) {
    services.push({
      name: "Sabnzbd",
      status: "Connected",
      description: "Download Manager",
    });
  }

  return services;
}

export function registerMediaHelpTool(server: McpServer, config: Config): void {
  server.tool(
    "media_help",
    "Get an overview of available tools and connected services. Use topic parameter for detailed help on specific areas.",
    {
      topic: z
        .enum([
          "sonarr",
          "radarr",
          "plex",
          "sabnzbd",
          "downloads",
          "tools",
          "cleanup",
          "workflows",
        ])
        .optional()
        .describe("Get help on a specific topic"),
    },
    async ({ topic }) => {
      const services = getConnectedServices(config);

      // Topic-specific help
      if (topic) {
        switch (topic) {
          case "sonarr":
            return {
              content: [
                {
                  type: "text",
                  text: `# Sonarr - TV Show Management

## Semantic Tools (User-Facing)
| Tool | Description |
|------|-------------|
| tv_search | Search for TV series by name |
| tv_add | Add a TV series to your library |
| tv_list | List all TV series in library |
| tv_episodes | View episode status for a series |
| tv_search_missing | Search for missing episodes |

## Admin Tools (Troubleshooting)
| Tool | Description |
|------|-------------|
| sonarr_queue | View current download queue |
| sonarr_details | Get detailed series information |
| sonarr_delete | Remove a series from library |
| sonarr_profiles | List quality profiles |
| sonarr_folders | List root folders |
| sonarr_stuck | Find stuck imports |
| sonarr_import | Trigger manual import |
| sonarr_blacklist | Blacklist bad releases |
| sonarr_calendar | View upcoming episodes |

## Extended Tools (Phase 0050)
| Tool | Description |
|------|-------------|
| sonarr_rename | Rename episode files using naming rules |
| sonarr_refresh | Refresh series metadata from TVDB |
| sonarr_upcoming | Show upcoming episodes with details |

## Example Workflows
1. **Add a new series**: tv_search "Breaking Bad" → tv_add with quality:hd
2. **Check what's downloading**: sonarr_queue
3. **Fix stuck downloads**: sonarr_stuck → sonarr_blacklist the bad release
4. **Find missing episodes**: tv_episodes → tv_search_missing`,
                },
              ],
            };

          case "radarr":
            return {
              content: [
                {
                  type: "text",
                  text: `# Radarr - Movie Management

## Semantic Tools (User-Facing)
| Tool | Description |
|------|-------------|
| movie_search | Search for movies by name |
| movie_add | Add a movie to your library |
| movie_list | List all movies in library |
| movie_upgrade | Search for quality upgrades |
| movie_delete | Remove a movie from library |

## Admin Tools (Troubleshooting)
| Tool | Description |
|------|-------------|
| radarr_queue | View current download queue |
| radarr_details | Get detailed movie information |
| radarr_profiles | List quality profiles |
| radarr_folders | List root folders |
| radarr_stuck | Find stuck imports |
| radarr_import | Trigger manual import |
| radarr_blacklist | Blacklist bad releases |

## Extended Tools (Phase 0050)
| Tool | Description |
|------|-------------|
| radarr_rename | Rename movie files using naming rules |
| radarr_refresh | Refresh movie metadata |
| radarr_discover | Get movie recommendations |

## Quality Routing
Use \`quality: 'hd'\` or \`quality: '4k'\` to target specific Radarr instance.
Default is 'hd' for safety (avoids accidental 4K downloads).

## Example Workflows
1. **Add a movie**: movie_search "Inception" → movie_add with quality:hd
2. **Add 4K movie**: movie_search "Dune" → movie_add with quality:4k
3. **Find upgrades**: movie_upgrade to find available quality improvements`,
                },
              ],
            };

          case "plex":
            return {
              content: [
                {
                  type: "text",
                  text: `# Plex - Media Library Management

## Semantic Tools (User-Facing)
| Tool | Description |
|------|-------------|
| library_list | List all Plex libraries |
| library_search | Search across libraries |
| library_watched | Get watch status for items |
| library_list_movies | List movies with filtering/sorting |

## Admin Tools (Cleanup & Maintenance)
| Tool | Description |
|------|-------------|
| plex_recent | Recently added content |
| plex_refresh | Trigger library scan |
| plex_unwatched | Find old unwatched content |
| plex_watched_old | Find old watched content |
| plex_delete | Delete content (with confirmation) |

## Extended Tools (Phase 0050)
| Tool | Description |
|------|-------------|
| plex_collections | List collections in libraries |
| plex_duplicates | Find duplicate items |
| plex_optimize | Trigger database optimization |

## Example Workflows
1. **Check library**: library_list → library_search "movie name"
2. **Find cleanup candidates**: plex_unwatched days:365 or plex_watched_old days:180
3. **Free up space**: plex_duplicates → plex_delete the extras`,
                },
              ],
            };

          case "sabnzbd":
          case "downloads":
            return {
              content: [
                {
                  type: "text",
                  text: `# Sabnzbd - Download Management

## Semantic Tools (User-Facing)
| Tool | Description |
|------|-------------|
| downloads_queue | View current download queue |
| downloads_history | View download history |
| downloads_pause | Pause all downloads |
| downloads_resume | Resume all downloads |
| downloads_speed | Set speed limit |
| downloads_status | Unified status across services |

## Admin Tools (Troubleshooting)
| Tool | Description |
|------|-------------|
| sabnzbd_delete | Delete a queue item |
| sabnzbd_failed | List failed downloads |
| sabnzbd_retry | Retry a failed download |
| sabnzbd_priority | Change queue priority |
| sabnzbd_pause_item | Pause specific item |
| sabnzbd_resume_item | Resume specific item |
| sabnzbd_categories | List download categories |

## Extended Tools (Phase 0050)
| Tool | Description |
|------|-------------|
| sabnzbd_quota | Show quota usage and limits |
| sabnzbd_warnings | Show system warnings |

## Example Workflows
1. **Check downloads**: downloads_queue or downloads_status
2. **Limit bandwidth**: downloads_speed speed:10 (10 MB/s)
3. **Handle failures**: sabnzbd_failed → sabnzbd_retry or sabnzbd_delete`,
                },
              ],
            };

          case "cleanup":
            return {
              content: [
                {
                  type: "text",
                  text: `# Cleanup Workflows

## Quick Analysis
Use \`cleanup_analysis\` to get a comprehensive report of cleanup opportunities:
- Unwatched movies (365+ days)
- Old watched content (180+ days)
- Duplicate files
- Ended TV series
- Failed downloads

## Cleanup Tools by Service

### Plex Cleanup
| Tool | What it finds |
|------|---------------|
| plex_unwatched | Old unwatched content |
| plex_watched_old | Old watched content |
| plex_duplicates | Duplicate files |
| plex_delete | Remove content |

### Radarr Cleanup
| Tool | What it finds |
|------|---------------|
| movie_list unwatched_only:true | Unwatched movies |
| movie_delete | Remove from library |

### Sabnzbd Cleanup
| Tool | What it finds |
|------|---------------|
| sabnzbd_failed | Failed downloads |
| sabnzbd_delete | Clear queue items |

## Step-by-Step Cleanup Workflow

1. **Analyze**: \`cleanup_analysis\` for overview
2. **Review Plex**: \`plex_duplicates\` then \`plex_delete\` extras
3. **Review unwatched**: \`plex_unwatched days:365\`
4. **Clear failures**: \`sabnzbd_failed\` then \`sabnzbd_delete\`
5. **Optimize**: \`plex_optimize\` to clean database`,
                },
              ],
            };

          case "tools":
            return {
              content: [
                {
                  type: "text",
                  text: `# Complete Tool Catalog

## Cross-Service Tools
| Tool | Description |
|------|-------------|
| system_health | Check all services for issues (use verbose:true for details) |
| downloads_status | Unified download status |
| cleanup_analysis | Comprehensive cleanup opportunities |
| media_help | This help system |

## TV Shows (Sonarr)

### Semantic
tv_search, tv_add, tv_list, tv_episodes, tv_search_missing

### Admin
sonarr_queue, sonarr_details, sonarr_delete, sonarr_profiles, sonarr_folders, sonarr_stuck, sonarr_import, sonarr_blacklist, sonarr_calendar

### Extended
sonarr_rename, sonarr_refresh, sonarr_upcoming

## Movies (Radarr)

### Semantic
movie_search, movie_add, movie_list, movie_upgrade, movie_delete

### Admin
radarr_queue, radarr_details, radarr_profiles, radarr_folders, radarr_stuck, radarr_import, radarr_blacklist

### Extended
radarr_rename, radarr_refresh, radarr_discover

## Library (Plex)

### Semantic
library_list, library_search, library_watched, library_list_movies

### Admin
plex_recent, plex_refresh, plex_unwatched, plex_watched_old, plex_delete

### Extended
plex_collections, plex_duplicates, plex_optimize

## Downloads (Sabnzbd)

### Semantic
downloads_queue, downloads_history, downloads_pause, downloads_resume, downloads_speed

### Admin
sabnzbd_delete, sabnzbd_failed, sabnzbd_retry, sabnzbd_priority, sabnzbd_pause_item, sabnzbd_resume_item, sabnzbd_categories

### Extended
sabnzbd_quota, sabnzbd_warnings`,
                },
              ],
            };

          case "workflows":
            return {
              content: [
                {
                  type: "text",
                  text: `# Common Workflows

## Adding Content

### Add a TV Show
1. \`tv_search "Breaking Bad"\` - Find the series
2. \`tv_add tvdbId:... quality:hd\` - Add to library

### Add a Movie
1. \`movie_search "Inception"\` - Find the movie
2. \`movie_add tmdbId:... quality:hd\` - Add to HD library
3. Or use \`quality:4k\` for 4K version

## Monitoring Downloads

### Check Queue
\`downloads_queue\` - See all active downloads
\`downloads_status\` - Unified status with ETA

### Handle Issues
\`system_health\` - Quick check for problems
\`sonarr_stuck\` / \`radarr_stuck\` - Find stuck imports
\`sabnzbd_failed\` - Find failed downloads

## Library Maintenance

### Daily Check
\`system_health verbose:true\` - Detailed status

### Weekly Cleanup
\`cleanup_analysis\` - Comprehensive cleanup report
\`plex_duplicates\` - Find and remove duplicates
\`plex_unwatched days:365\` - Review old unwatched

### Monthly Maintenance
\`plex_optimize\` - Clean database
\`plex_watched_old days:180\` - Review old watched content

## Troubleshooting

### Downloads Stuck
1. Check \`sonarr_stuck\` or \`radarr_stuck\`
2. If bad release: \`sonarr_blacklist\` then search again
3. If import issue: Check paths in \`sonarr_folders\`

### Missing Content
1. \`library_search "title"\` - Check if in Plex
2. \`tv_episodes seriesId:...\` - Check episode status
3. \`tv_search_missing\` - Trigger search for missing`,
                },
              ],
            };
        }
      }

      // General help with status
      let output = `# Media Management Server

## Connected Services
`;

      if (services.length > 0) {
        output += "| Service | Status | Description |\n";
        output += "|---------|--------|-------------|\n";
        for (const svc of services) {
          output += `| ${svc.name} | ${svc.status} | ${svc.description} |\n`;
        }
      } else {
        output += "*No services configured*\n";
      }

      output += `
## Quick Start

**Check System Health**
\`system_health\` - Quick check
\`system_health verbose:true\` - Detailed info

**What's Downloading?**
\`downloads_queue\` - Current queue
\`downloads_status\` - Unified status

**Search & Add Content**
\`tv_search "Show Name"\` - Find TV shows
\`movie_search "Movie Name"\` - Find movies

**Library Overview**
\`library_list\` - Your Plex libraries
\`library_search "title"\` - Search content

**Cleanup & Maintenance**
\`cleanup_analysis\` - Comprehensive cleanup report

## Help Topics

Use \`media_help topic:X\` for detailed help:

| Topic | Description |
|-------|-------------|
| sonarr | TV show management tools |
| radarr | Movie management tools |
| plex | Library management tools |
| downloads | Download management tools |
| cleanup | Cleanup workflows |
| tools | Complete tool catalog |
| workflows | Common workflow examples |`;

      return {
        content: [{ type: "text", text: output }],
      };
    },
  );
}
