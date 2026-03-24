/**
 * RxDB replication to the Python backend.
 *
 * Preferences: bidirectional (push to PATCH /api/py/devices, pull from GET /api/py/devices)
 * Suitability rules: pull-only (GET /api/py/suitability every 10 min)
 *
 * Uses leader election — only the leader tab replicates to avoid conflicts.
 */

import { replicateRxCollection, type RxReplicationState } from "rxdb/plugins/replication";
import { preferencesCollection, suitabilityRulesCollection } from "./collections";
import { getDeviceId } from "./bridge";
import type { PreferencesDocType } from "./schemas";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_BASE = "/api/py";
const RULES_PULL_INTERVAL_MS = 10 * 60_000; // 10 min

// ---------------------------------------------------------------------------
// Replication state
// ---------------------------------------------------------------------------

let prefsReplication: RxReplicationState<PreferencesDocType, unknown> | null = null;
let rulesRefreshTimer: ReturnType<typeof setInterval> | null = null;

// ---------------------------------------------------------------------------
// Preferences replication (bidirectional)
// ---------------------------------------------------------------------------

async function startPrefsReplication(): Promise<void> {
  const col = await preferencesCollection();
  if (!col) return;

  const deviceId = getDeviceId();

  prefsReplication = replicateRxCollection<PreferencesDocType, unknown>({
    collection: col,
    replicationIdentifier: `mukoko-prefs-${deviceId}`,
    autoStart: true,
    retryTime: 5000, // retry every 5s on failure
    waitForLeadership: true, // only leader tab replicates

    push: {
      batchSize: 1,
      handler: async (changeRows) => {
        for (const row of changeRows) {
          if (!row.newDocumentState) continue;
          const prefs = row.newDocumentState;

          try {
            await fetch(`${API_BASE}/devices/${deviceId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                theme: prefs.theme,
                selectedLocation: prefs.selectedLocation,
                savedLocations: prefs.savedLocations,
                locationLabels: prefs.locationLabels,
                selectedActivities: prefs.selectedActivities,
                hasOnboarded: prefs.hasOnboarded,
              }),
            });
          } catch {
            // Network error — will retry automatically
            throw new Error("Push failed — will retry");
          }
        }
        return [];
      },
    },

    pull: {
      handler: async (lastCheckpoint, batchSize) => {
        void lastCheckpoint;
        void batchSize;

        try {
          const res = await fetch(`${API_BASE}/devices/${deviceId}`);
          if (!res.ok) return { documents: [], checkpoint: null };

          const profile = await res.json();
          const serverPrefs = profile.preferences;
          if (!serverPrefs) return { documents: [], checkpoint: null };

          const doc = {
            id: deviceId,
            theme: serverPrefs.theme ?? "system",
            selectedLocation: serverPrefs.selectedLocation ?? "",
            savedLocations: serverPrefs.savedLocations ?? [],
            locationLabels: serverPrefs.locationLabels ?? {},
            selectedActivities: serverPrefs.selectedActivities ?? [],
            hasOnboarded: serverPrefs.hasOnboarded ?? false,
            updatedAt: Date.now(),
            _deleted: false,
          };

          return { documents: [doc], checkpoint: null };
        } catch {
          return { documents: [], checkpoint: null };
        }
      },
      batchSize: 1,
      stream$: undefined as never, // no real-time stream — poll only
    },
  });
}

// ---------------------------------------------------------------------------
// Suitability rules refresh (pull-only, not RxDB replication)
// ---------------------------------------------------------------------------

async function refreshSuitabilityRules(): Promise<void> {
  const col = await suitabilityRulesCollection();
  if (!col) return;

  try {
    const res = await fetch(`${API_BASE}/suitability`);
    if (!res.ok) return;

    const data = await res.json();
    const rules = data?.rules;
    if (!Array.isArray(rules) || rules.length === 0) return;

    const now = Date.now();
    for (const rule of rules) {
      if (!rule.key) continue;
      await col.upsert({
        key: rule.key,
        conditions: JSON.stringify(rule.conditions ?? []),
        updatedAt: now,
      });
    }
  } catch {
    // Network error — use stale cache
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Start all replication handlers.
 * Call once after RxDB bridge is initialized.
 */
export async function startReplication(): Promise<void> {
  await startPrefsReplication();

  // Initial rules fetch
  await refreshSuitabilityRules();

  // Periodic rules refresh
  if (!rulesRefreshTimer) {
    rulesRefreshTimer = setInterval(refreshSuitabilityRules, RULES_PULL_INTERVAL_MS);
  }
}

/**
 * Stop all replication (for cleanup/testing).
 */
export async function stopReplication(): Promise<void> {
  if (prefsReplication) {
    await prefsReplication.cancel();
    prefsReplication = null;
  }

  if (rulesRefreshTimer) {
    clearInterval(rulesRefreshTimer);
    rulesRefreshTimer = null;
  }
}
