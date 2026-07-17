<script lang="ts">
  import { defaultTrackerState, type TrackerState } from "$lib/form-state";
  import TrackerForm from "$lib/TrackerForm.svelte";
  import TrackerSheet from "$lib/TrackerSheet.svelte";

  // The single source of truth for the sheet. The form mutates it; the sheet
  // renders it.
  let tracker: TrackerState = $state(defaultTrackerState());
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
