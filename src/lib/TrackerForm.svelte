<script lang="ts">
  import {
    TRACKER_DAYS,
    FormStateError,
    defaultTrackerState,
    serializeState,
    parseState,
    isImageDataUrl,
    type LogoMode,
    type TrackerState,
  } from "$lib/form-state";

  // Two-way bound so load/reset can replace the whole state object; deep edits
  // (add/remove/field changes) mutate the shared reactive proxy in place.
  let { tracker = $bindable() }: { tracker: TrackerState } = $props();

  // Message shown when a loaded file is rejected or the current form state
  // cannot be saved as a re-loadable file.
  let formError: string | null = $state(null);

  // Ephemeral form-UI state (not part of the saved tracker).
  type Tab = "weather" | "journal" | "logo";
  let activeTab: Tab = $state("journal");
  let collapsed = $state(false);

  function printSheet() {
    window.print();
  }

  function addWeatherGroup() {
    tracker.weatherGroups.push({ start: 1, end: 1, label: "" });
  }
  function removeWeatherGroup(index: number) {
    tracker.weatherGroups.splice(index, 1);
  }

  function addBook() {
    tracker.books.push({ col: 1, label: "" });
  }
  function removeBook(index: number) {
    tracker.books.splice(index, 1);
  }

  function setLogoMode(mode: LogoMode) {
    tracker.logoMode = mode;
  }

  function onLogoFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      // The picker's accept filter is only a hint - validate the result through
      // the same gate the JSON loader uses before it can reach the img src.
      if (result && !isImageDataUrl(result)) {
        formError = "That file is not a supported image.";
        return;
      }
      tracker.logoDataUrl = result;
      tracker.logoMode = "custom";
      formError = null;
    };
    reader.readAsDataURL(file);
    input.value = "";
  }

  function saveJson() {
    const json = serializeState(tracker);
    // Round-trip guard: never write a file the loader would later reject. The
    // number inputs can hold empty/out-of-range values, so validate before
    // download and surface the precise reason instead of a broken file.
    try {
      parseState(json);
    } catch (err) {
      formError =
        err instanceof FormStateError
          ? err.message
          : "Some fields are invalid, so the tracker cannot be saved yet.";
      return;
    }
    formError = null;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "campaign-tracker.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onLoadFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      tracker = parseState(await file.text());
      formError = null;
    } catch (err) {
      formError =
        err instanceof FormStateError
          ? err.message
          : "This file could not be loaded.";
    } finally {
      input.value = "";
    }
  }

  function resetAll() {
    if (!confirm("Reset every field back to the defaults? This cannot be undone.")) {
      return;
    }
    tracker = defaultTrackerState();
    formError = null;
  }
</script>

<aside class="controls" class:collapsed aria-label="Tracker settings">
  <div class="controls-inner">
    <header class="controls-head">
      {#if !collapsed}
        <h1>Make a Custom EBR Campaign Tracker</h1>
      {/if}
      <div class="lede-row">
        <p class="lede">
          Set up your tracker, then print this page to save the sheet as a PDF. (Only the sheet prints.)
        </p>
        {#if collapsed}
          <button type="button" class="add" onclick={printSheet}>Print</button>
        {/if}
      </div>
    </header>

    {#if !collapsed}
      <div class="tabs">
        <button
          type="button"
          class="tab"
          class:active={activeTab === "journal"}
          aria-pressed={activeTab === "journal"}
          onclick={() => (activeTab = "journal")}>Journal markers</button
        >
        <button
          type="button"
          class="tab"
          class:active={activeTab === "weather"}
          aria-pressed={activeTab === "weather"}
          onclick={() => (activeTab = "weather")}>Weather conditions</button
        >
        <button
          type="button"
          class="tab"
          class:active={activeTab === "logo"}
          aria-pressed={activeTab === "logo"}
          onclick={() => (activeTab = "logo")}>Logo / wordmark</button
        >
      </div>

      {#if activeTab === "weather"}
        <div class="fieldset">
          <div class="fieldset-head">
            <h2>Weather conditions</h2>
            <button type="button" class="add" onclick={addWeatherGroup}
              >+ Add</button
            >
          </div>
          {#if tracker.weatherGroups.length === 0}
            <p class="empty">No weather brackets. Add one to label a run of days.</p>
          {/if}
          {#each tracker.weatherGroups as _g, i}
            <div class="row weather-row">
              <label>
                <span class="row-label">From day</span>
                <input
                  type="number"
                  min="1"
                  max={TRACKER_DAYS}
                  bind:value={tracker.weatherGroups[i].start}
                />
              </label>
              <label>
                <span class="row-label">To day</span>
                <input
                  type="number"
                  min="1"
                  max={TRACKER_DAYS}
                  bind:value={tracker.weatherGroups[i].end}
                />
              </label>
              <label class="grow">
                <span class="row-label">Condition</span>
                <input
                  type="text"
                  placeholder="e.g. Downpour"
                  bind:value={tracker.weatherGroups[i].label}
                />
              </label>
              <button
                type="button"
                class="remove"
                aria-label="Remove weather condition"
                onclick={() => removeWeatherGroup(i)}>&times;</button
              >
            </div>
          {/each}
        </div>
      {:else if activeTab === "journal"}
        <div class="fieldset">
          <div class="fieldset-head">
            <h2>Journal markers</h2>
            <button type="button" class="add" onclick={addBook}>+ Add</button>
          </div>
          {#if tracker.books.length === 0}
            <p class="empty">No journal markers. Add one to flag a day column.</p>
          {/if}
          {#each tracker.books as _b, i}
            <div class="row book-row">
              <label>
                <span class="row-label">Day</span>
                <input
                  type="number"
                  min="1"
                  max={TRACKER_DAYS}
                  bind:value={tracker.books[i].col}
                />
              </label>
              <label class="grow">
                <span class="row-label">Label</span>
                <input
                  type="text"
                  placeholder="e.g. 1.04"
                  bind:value={tracker.books[i].label}
                />
              </label>
              <button
                type="button"
                class="remove"
                aria-label="Remove journal marker"
                onclick={() => removeBook(i)}>&times;</button
              >
            </div>
          {/each}
        </div>
      {:else}
        <div class="fieldset">
          <div class="fieldset-head">
            <h2>Logo / wordmark</h2>
          </div>
          <div class="row logo-modes">
            <label class="radio">
              <input
                type="radio"
                name="logo-mode"
                checked={tracker.logoMode === "default"}
                onchange={() => setLogoMode("default")}
              />
              Default logo
            </label>
            <label class="radio">
              <input
                type="radio"
                name="logo-mode"
                checked={tracker.logoMode === "placeholder"}
                onchange={() => setLogoMode("placeholder")}
              />
              Blank slot
            </label>
            <label class="radio">
              <input
                type="radio"
                name="logo-mode"
                checked={tracker.logoMode === "custom"}
                onchange={() => setLogoMode("custom")}
              />
              Custom image
            </label>
            <label class="radio">
              <input
                type="radio"
                name="logo-mode"
                checked={tracker.logoMode === "text"}
                onchange={() => setLogoMode("text")}
              />
              Text
            </label>
          </div>
          {#if tracker.logoMode === "custom"}
            <div class="row">
              <label class="grow">
                <span class="row-label">Upload image</span>
                <input type="file" accept="image/*" onchange={onLogoFile} />
              </label>
            </div>
          {/if}
          {#if tracker.logoMode === "text"}
            <div class="row">
              <label class="grow">
                <span class="row-label">Wordmark text</span>
                <textarea
                  rows="2"
                  placeholder="LEGACY OF THE ANCESTORS"
                  bind:value={tracker.logoText}
                ></textarea>
              </label>
            </div>
          {/if}
        </div>
      {/if}

      <div class="fieldset actions">
        <button type="button" class="add" onclick={printSheet}>Print</button>
        <button type="button" class="add" onclick={saveJson}>Save As Settings File</button>
        <label class="load-btn">
          Load Settings File
          <input type="file" accept="application/json,.json" onchange={onLoadFile} />
        </label>
        <button type="button" class="reset" onclick={resetAll}>Reset</button>
        {#if formError}
          <p class="load-error" role="alert">{formError}</p>
        {/if}
        <p class="feedback">
          Feedback? Feel free to file feature requests on the
          <a
            href="https://github.com/Earthborne-Rangers-Community-Mods/ebr-tracker-maker/issues"
            target="_blank"
            rel="noopener noreferrer">GitHub Issues</a
          > page.
        </p>
      </div>

      <p class="disclaimer">
        Earthborne Rangers is copyrighted by Earthborne Games. This is a
        community-created tool and is not produced by, endorsed by, or officially
        affiliated with Earthborne Games.
      </p>
    {/if}

    <button
      type="button"
      class="collapse-toggle"
      class:collapsed
      aria-expanded={!collapsed}
      aria-label={collapsed ? "Expand form" : "Collapse form"}
      onclick={() => (collapsed = !collapsed)}
    ></button>
  </div>
</aside>

<style>
  .controls {
    display: flex;
    justify-content: center;
    padding: 20px 16px 16px;
    background: var(--chrome-bg);
    font-family: var(--font-body);
    color: var(--ink);
  }
  .controls.collapsed {
    padding-top: 6px;
    padding-bottom: 6px;
  }
  .controls.collapsed .controls-inner {
    gap: 4px;
  }
  .controls.collapsed .lede {
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 12px;
  }
  .controls.collapsed .lede-row button {
    padding: 3px 12px;
  }
  .controls-inner {
    width: 100%;
    max-width: 760px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .controls-head {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .controls-head h1 {
    margin: 0 0 4px;
    font-size: 22px;
    letter-spacing: 0.02em;
  }
  .lede {
    margin: 0;
    font-size: 13px;
    color: var(--gray);
    line-height: 1.4;
  }
  .lede-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  /* Small triangle toggle centered at the bottom of the form, above the
     divider. Points up to collapse, down to expand. */
  .collapse-toggle {
    align-self: center;
    border: none;
    background: transparent;
    padding: 8px 24px;
    cursor: pointer;
    line-height: 0;
  }
  .collapse-toggle:hover {
    background: transparent;
  }
  .collapse-toggle::before {
    content: "";
    display: block;
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-bottom: 7px solid var(--gray);
  }
  .collapse-toggle:hover::before {
    border-bottom-color: var(--ink);
  }
  .collapse-toggle.collapsed::before {
    border-bottom: none;
    border-top: 7px solid var(--gray);
  }
  .collapse-toggle.collapsed:hover::before {
    border-top-color: var(--ink);
  }
  .tabs {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid var(--chrome-border);
  }
  .tab {
    border: 1px solid transparent;
    border-bottom: none;
    border-radius: 6px 6px 0 0;
    background: transparent;
    padding: 8px 14px;
    margin-bottom: -1px;
    color: var(--gray);
  }
  .tab:hover {
    background: var(--chrome-hover);
  }
  .tab.active {
    border-color: var(--chrome-border);
    background: var(--chrome-surface);
    color: var(--ink);
    font-weight: 600;
  }
  .feedback {
    flex-basis: 100%;
    margin: 0;
    font-size: 12px;
    color: var(--gray);
    line-height: 1.4;
  }
  .feedback a {
    color: var(--ink);
  }
  .fieldset {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px 16px;
    border: 1px solid var(--chrome-border);
    border-radius: 8px;
    background: var(--chrome-surface);
  }
  .fieldset-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .fieldset-head h2 {
    margin: 0;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }
  .empty {
    margin: 0;
    font-size: 12px;
    color: var(--gray);
    font-style: italic;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 10px;
  }
  .row label {
    display: flex;
    flex-direction: column;
    gap: 3px;
    font-size: 12px;
  }
  .row label.grow {
    flex: 1 1 160px;
  }
  .row-label {
    color: var(--gray);
    letter-spacing: 0.02em;
  }
  .row input[type="number"] {
    width: 68px;
  }
  .row input[type="text"],
  .row input[type="number"],
  .row textarea {
    padding: 6px 8px;
    border: 1px solid var(--chrome-border);
    border-radius: 5px;
    font: inherit;
    font-size: 13px;
    background: var(--chrome-surface);
    color: var(--ink);
  }
  .row input[type="text"],
  .row textarea {
    width: 100%;
    box-sizing: border-box;
  }
  .row textarea {
    resize: vertical;
    min-height: 44px;
  }
  .logo-modes {
    gap: 16px;
  }
  .radio {
    flex-direction: row !important;
    align-items: center;
    gap: 6px !important;
    font-size: 13px;
  }
  button,
  .load-btn {
    font: inherit;
    font-size: 13px;
    cursor: pointer;
    border-radius: 6px;
    border: 1px solid var(--chrome-border);
    background: var(--chrome-surface);
    color: var(--ink);
    padding: 7px 14px;
  }
  button:hover,
  .load-btn:hover {
    background: var(--chrome-hover);
  }
  button.add {
    padding: 5px 12px;
  }
  button.remove {
    align-self: flex-end;
    width: 30px;
    height: 30px;
    padding: 0;
    font-size: 18px;
    line-height: 1;
  }
  .actions {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }
  .load-btn {
    display: inline-flex;
    align-items: center;
  }
  .load-btn input[type="file"] {
    display: none;
  }
  .load-error {
    flex-basis: 100%;
    margin: 0;
    color: var(--error);
    font-size: 13px;
  }
  .disclaimer {
    margin: 0;
    font-size: 11px;
    color: var(--gray);
    line-height: 1.4;
  }

  @media print {
    .controls {
      display: none;
    }
  }
</style>
