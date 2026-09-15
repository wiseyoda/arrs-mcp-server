# Extending the server

## Adding a new tool to an existing service

Example: adding a new Sonarr tool.

1. **Add client method** in `src/services/sonarr/client.ts`:
   ```typescript
   async getHistory(page: number = 1): Promise<HistoryPage> {
     return this.http.get<HistoryPage>(`/history?page=${page}`);
   }
   ```

2. **Add types** in `src/services/sonarr/types.ts` if needed:
   ```typescript
   export interface HistoryPage {
     page: number;
     records: HistoryRecord[];
   }
   ```

3. **Register the tool** in `src/services/sonarr/tools.ts`, inside `registerSonarrTools()`:
   ```typescript
   server.tool(
     "sonarr_history",  // snake_case, service prefix for admin tools
     "Show recent download history in Sonarr",
     { page: z.coerce.number().optional().describe("Page number. Default: 1") },
     async ({ page }) => {
       try {
         const history = await client.getHistory(page);
         const formatted = history.records
           .map((r) => `${r.date} - ${r.eventType}: ${r.sourceTitle}`)
           .join("\n");
         return { content: [{ type: "text", text: `Recent history:\n\n${formatted}` }] };
       } catch (error) {
         return { content: [{ type: "text", text: formatErrorResponse(error) }], isError: true };
       }
     },
   );
   ```

4. **Verify** — run `pnpm typecheck` and `pnpm lint`.

To add a new **cross-service tool** in `src/tools/`:
1. Create `src/tools/my-new-tool.ts` following the pattern of existing tools.
2. Export a `registerMyNewTool(server, config, registry)` function.
3. Register it in `src/tools/index.ts` inside `registerSystemTools()`.
4. Use `registry.requireProviders()` to validate provider availability.

## Adding a new service

Example: adding Lidarr for music.

1. **Create the directory**: `src/services/lidarr/`

2. **Create types.ts** — TypeScript interfaces for the API entities:
   ```typescript
   export interface Artist {
     id: number;
     artistName: string;
     // ...
   }
   ```

3. **Create client.ts** — implement the API client:
   ```typescript
   import { HttpClient } from "../../shared/http.js";
   import type { ServiceConfig } from "../../config.js";
   import type { Artist } from "./types.js";

   export class LidarrClient {
     private http: HttpClient;

     constructor(config: ServiceConfig) {
       this.http = new HttpClient({
         baseUrl: `${config.url}/api/v1`,
         headers: { "X-Api-Key": config.apiKey },
         serviceName: "Lidarr",
       });
     }

     async searchArtist(query: string): Promise<Artist[]> {
       return this.http.get<Artist[]>(`/artist/lookup?term=${encodeURIComponent(query)}`);
     }
   }
   ```

4. **Create tools.ts** — register MCP tools:
   ```typescript
   import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
   import { z } from "zod";
   import type { Config } from "../../config.js";
   import { LidarrClient } from "./client.js";
   import { formatErrorResponse } from "../../shared/errors.js";

   export function registerLidarrTools(server: McpServer, config: Config): void {
     if (!config.lidarr) {
       console.error("Lidarr not configured, skipping tool registration");
       return;
     }
     const client = new LidarrClient(config.lidarr);
     server.tool(
       "music_search",  // Semantic name, not "lidarr_artist_lookup"
       "Search for music artists by name",
       { query: z.string().describe("Artist name to search for") },
       async ({ query }) => {
         try {
           const results = await client.searchArtist(query);
           return { content: [{ type: "text", text: results.map((a) => a.artistName).join("\n") }] };
         } catch (error) {
           return { content: [{ type: "text", text: formatErrorResponse(error) }], isError: true };
         }
       },
     );
   }
   ```

5. **Create index.ts** — barrel exports:
   ```typescript
   export { LidarrClient } from "./client.js";
   export { registerLidarrTools } from "./tools.js";
   export * from "./types.js";
   ```

6. **Add config support** in `src/config.ts`: add `lidarr?: ServiceConfig` to the `Config` interface, and add `lidarr` to `serviceNames` and `schemas`. The shared loader derives `LIDARR_URL`/`LIDARR_API_KEY` and validates merged fields.

7. **Register in `src/index.ts`**:
   ```typescript
   import { registerLidarrTools } from "./services/lidarr/tools.js";
   // ...
   if (config.lidarr) registerLidarrTools(server, config);
   ```

8. **Add to provider registry** in `src/providers/`: add `"lidarr"` to `ProviderName` in `types.ts`, a definition in `PROVIDER_DEFINITIONS` and detection logic in `detectConfiguredProviders()` (`registry.ts`), and config info in `PROVIDER_CONFIG_INFO` (`errors.ts`).

9. **Verify**: `pnpm typecheck && pnpm lint && pnpm test`.

Use `booleanParam()` from `src/shared/params.ts` for tool booleans. MCP sends typed
JSON, but legacy string booleans are also supported; never use truthiness coercion.
Add regression fixtures in `test/` for each new service contract and safety gate.
