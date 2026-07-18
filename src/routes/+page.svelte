<script lang="ts">
  import { onMount } from "svelte";
  import {
    defaultTrackerState,
    loadPersistedState,
    persistState,
    type TrackerState,
  } from "$lib/form-state";
  import TrackerForm from "$lib/TrackerForm.svelte";
  import TrackerSheet from "$lib/TrackerSheet.svelte";

  // The single source of truth for the sheet. The form mutates it; the sheet
  // renders it.
  let tracker: TrackerState = $state(defaultTrackerState());

  // Auto-save: restore the last session on mount, then persist every edit back
  // to this device.
  let saveReady = $state(false);

  onMount(() => {
    const saved = loadPersistedState(() => localStorage);
    if (saved) tracker = saved;
    saveReady = true;
  });

  $effect(() => {
    // Snapshot first so every nested field is a tracked dependency; this makes
    // the effect re-run on any edit (add/remove/field change) and on whole-
    // object replacements from load/reset.
    const snapshot = $state.snapshot(tracker) as TrackerState;
    if (saveReady) persistState(() => localStorage, snapshot);
  });
</script>

<TrackerForm bind:tracker />
<hr class="form-divider" />
<TrackerSheet {tracker} />

<style>
  /* Full-width rule between the form chrome and the printable sheet. Screen
     only - the sheet is the only thing that prints. */
  .form-divider {
    width: 100%;
    margin: 0;
    border: none;
    border-top: 1px solid var(--chrome-border);
  }

  @media print {
    .form-divider {
      display: none;
    }
  }
</style>
