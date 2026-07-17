<script>
  import { asset } from "$app/paths";

  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  // Journal / campaign-guide markers that sit above specific day columns.
  const books = [
    { col: 1, label: "1" },
    { col: 3, label: "94.1" },
    { col: 4, label: "1.04" },
  ];

  // Weather brackets group runs of days and name the prevailing weather.
  const weatherGroups = [
    { start: 1, end: 3, label: "A Perfect Day" },
    { start: 4, end: 7, label: "Downpour" },
    { start: 8, end: 9, label: "A Perfect Day" },
    { start: 10, end: 12, label: "Downpour" },
    { start: 13, end: 14, label: "Howling Winds" },
    { start: 15, end: 17, label: "Downpour" },
    { start: 18, end: 20, label: "Howling Winds" },
    { start: 21, end: 22, label: "A Perfect Day" },
    { start: 23, end: 25, label: "Downpour" },
    { start: 26, end: 28, label: "Howling Winds" },
    { start: 29, end: 30, label: "A Perfect Day" },
  ];

  // Mission rows and reward/notable lines
  const ROW_COUNT = 11;
  const missionRows = Array.from({ length: ROW_COUNT });
  const missionCols = [0, 1, 2];
  const rewardCols = [0, 1, 2];
  const notableCols = [0, 1];

  // Journal marker glyph (U+1F56E, monochrome book pictograph).
  const BOOK = String.fromCodePoint(0x1f56e);

  // Moon phase: one synodic cycle across the day track, matching the official
  // sheet - new moon at day 28.5, full moon at day 14. Illuminated fraction is
  // k = (1 - cos(2*pi*phase/period))/2; waning days are the mirror of waxing.
  const SYNODIC = 29;
  const NEW_MOON_DAY = 28.5;
  const MOON_R = 8.8; // outline ring radius
  const MOON_FILL_R = 6.8; // shaded region radius - leaves padding inside the ring

  /**
   * @param {number} k illuminated fraction 0..1
   * @param {number} r moon radius
   */
  function moonLitPath(k, r) {
    // Lit region of a waxing moon (lit on the right): right limb + terminator.
    const rx = (Math.abs(1 - 2 * k) * r).toFixed(3);
    const sweep = k < 0.5 ? 0 : 1; // crescent curves in, gibbous bulges out
    return `M0,${-r} A${r},${r} 0 0 1 0,${r} A${rx},${r} 0 0 ${sweep} 0,${-r} Z`;
  }

  const dayMoons = days.map((day) => {
    const phase = (((day - NEW_MOON_DAY) % SYNODIC) + SYNODIC) % SYNODIC;
    const k = (1 - Math.cos((2 * Math.PI * phase) / SYNODIC)) / 2;
    return { day, path: moonLitPath(k, MOON_FILL_R), waning: phase > SYNODIC / 2 };
  });
</script>

<div class="page-frame">
  <section class="sheet" aria-label="Campaign tracker">
    <!-- ===== Day track ===== -->
    <div class="day-grid">
      {#each books as b}
        <div class="book" style="grid-column:{b.col}">
          <span class="book-ico" aria-hidden="true">{BOOK}</span>
          <span class="book-label">{b.label}</span>
        </div>
      {/each}

      {#each dayMoons as m}
        <div class="circle" style="grid-column:{m.day}">
          <svg class="moon" viewBox="-10 -10 20 20" aria-hidden="true">
            <circle class="moon-disc" r={MOON_R} />
            <path
              class="moon-lit"
              d={m.path}
              transform={m.waning ? "scale(-1,1)" : undefined}
            />
            <circle class="moon-ring" r={MOON_R} stroke-width="1" />
          </svg>
          <span class="day-num">{m.day}</span>
        </div>
      {/each}

      {#each weatherGroups as g}
        <div class="wgroup" style="grid-column:{g.start} / {g.end + 1}">
          <span
            class="brace"
            style="width:{((g.end - g.start) / (g.end - g.start + 1)) * 100}%"
          ></span>
          <span class="wlabel">{g.label}</span>
        </div>
      {/each}
    </div>

    <!-- ===== Middle band ===== -->
    <div class="mid">
      <div class="left-col">
        <div class="wordmark">
          <img class="wm-logo" src={asset("/art/logo.svg")} alt="Earthborne Rangers" />
          <span class="wm-sub">&bull;&nbsp;Campaign Tracker&nbsp;&bull;</span>
        </div>

        <div class="rangers">
          <span class="col-head">Rangers</span>
          <span class="write-line"></span>
          <span class="write-line"></span>
          <span class="write-line"></span>
          <span class="write-line"></span>
        </div>

        <div class="current-position">
          <span class="cp-title">Current Position</span>
          <span class="field-label">Location</span>
          <span class="write-line"></span>
          <span class="field-label">Path Terrain</span>
          <span class="write-line"></span>
        </div>
      </div>

      <div class="missions">
        <span class="section-cap">Missions</span>
        <div class="mission-cols">
          {#each missionCols as _c}
            <div class="mcol">
              <div class="mrow head">
                <span class="mh-day">Day</span>
                <span class="mh-name">Name</span>
                <span class="mh-prog">Progress</span>
              </div>
              {#each missionRows as _r}
                <div class="mrow">
                  <span class="day-box"></span>
                  <span class="name-line"></span>
                  <span class="prog"><i></i><i></i><i></i></span>
                </div>
              {/each}
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- ===== Bottom band ===== -->
    <div class="bottom">
      <div class="lbox rewards">
        <span class="vlabel">REWARDS</span>
        <div class="line-cols">
          {#each rewardCols as _c}
            <div class="line-col">
              {#each Array(ROW_COUNT) as _r}<span class="write-line"></span>{/each}
            </div>
          {/each}
        </div>
      </div>

      <div class="lbox notable">
        <span class="vlabel">NOTABLE EVENTS</span>
        <div class="line-cols">
          {#each notableCols as _c}
            <div class="line-col">
              {#each Array(ROW_COUNT) as _r}<span class="write-line"></span>{/each}
            </div>
          {/each}
        </div>
      </div>
    </div>
  </section>
</div>

<style>
  :global(:root) {
    --ink: #231f20; /* near-black: text, boxes, rules, brackets, circles */
    --ink-strong: #030405; /* near-pure black: wordmark subtitle */
    --gray: #636466; /* day boxes and progress diamonds */
    --paper: #fff;
    --moon-lit: #c7c2b7; /* illuminated portion of the moon */

    /* Stroke tiers */
    --stroke-thin: 0.5pt;
    --stroke-medium: 1pt;
    --stroke-heavy: 1.5pt;

    /* Type scale */
    --fs-title: 12pt; /* Current Position */
    --fs-label: 10pt; /* section labels, day numbers, field labels */
    --fs-small: 8pt; /* column headers, book + weather labels */
    --fs-caption: 7pt; /* subtitle, footer */

    /* Corner radii. */
    --radius-box: 6pt;
    --radius-daybox: 4pt;
    --radius-diamond: 1.75pt;

    /* Fonts. */
    --font-body: "Ikarius ADF No2", Georgia, serif;
    --font-symbol: "Segoe UI Symbol", "Noto Sans Symbols 2", sans-serif;
  }

  :global(body) {
    margin: 0;
    background: var(--paper);
    font-family: var(--font-body);
    color: var(--ink);
  }

  .page-frame {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12pt;
  }

  /* A4 landscape canvas. Width is physical so 1:1 print fills the page exactly;
     internal sizes are in pt so print output stays resolution-independent. */
  .sheet {
    width: 297mm;
    box-sizing: border-box;
    background: var(--paper);
    padding: 15pt 22pt 8pt;
    display: flex;
    flex-direction: column;
    gap: 4.5pt;
  }

  .write-line {
    display: block;
    border-bottom: var(--stroke-thin) solid var(--ink);
    height: 14pt;
  }

  /* ===== Day track ===== */
  .day-grid {
    display: grid;
    grid-template-columns: repeat(30, 1fr);
    grid-template-rows: auto auto auto;
    align-items: center;
    row-gap: 1.5pt;
    padding: 0 8pt;
    margin-bottom: 8pt;
  }
  .book {
    grid-row: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1;
  }
  .book-ico {
    font-family: var(--font-symbol);
    font-size: 9.5pt;
    line-height: 1;
  }
  .book-label {
    font-size: var(--fs-small);
    margin-top: 0.75pt;
  }
  .circle {
    grid-row: 2;
    justify-self: center;
    position: relative;
    width: 20pt;
    height: 20pt;
  }
  .moon {
    display: block;
    width: 100%;
    height: 100%;
  }
  .moon-disc {
    fill: var(--paper);
  }
  .moon-lit {
    fill: var(--moon-lit);
  }
  .moon-ring {
    fill: none;
    stroke: var(--ink);
  }
  .day-num {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    /* Nudge down to optically center the digits: their ink rides high in the
       line box because numerals sit on the baseline without descenders. */
    transform: translateY(0.0675em);
    font-size: var(--fs-label);
    font-weight: 700;
    color: var(--ink);
  }
  .wgroup {
    grid-row: 3;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 1.5pt;
  }
  .brace {
    display: block;
    height: 8pt;
    border: var(--stroke-thin) solid var(--ink);
    border-top: none;
    border-radius: 0 0 3pt 3pt;
  }
  .wlabel {
    font-size: var(--fs-small);
    margin-top: 3pt;
    text-align: center;
    line-height: 1.1;
    white-space: nowrap;
  }

  /* ===== Middle band ===== */
  .mid {
    display: grid;
    grid-template-columns: 163pt 1fr;
    gap: 19pt;
  }
  .left-col {
    display: flex;
    flex-direction: column;
    gap: 6pt;
  }

  .wordmark {
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1;
  }
  .wm-logo {
    width: 148pt;
    height: auto;
    display: block;
  }
  .wm-sub {
    font-size: var(--fs-caption);
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: var(--ink-strong);
    margin-top: 4.5pt;
  }

  .col-head,
  .section-cap {
    text-transform: uppercase;
    letter-spacing: 0.16em;
    font-size: var(--fs-label);
  }
  .rangers {
    display: flex;
    flex-direction: column;
    gap: 4.5pt;
    padding: 0 10.5pt;
    margin-top: 13pt;
  }
  .rangers .col-head {
    margin-bottom: 1.5pt;
  }

  .current-position {
    margin-top: auto;
    border: var(--stroke-medium) solid var(--ink);
    border-radius: var(--radius-box);
    padding: 6pt 10.5pt 7.5pt;
    display: flex;
    flex-direction: column;
    gap: 2pt;
  }
  .cp-title {
    text-align: center;
    font-size: var(--fs-title);
    margin-bottom: 3pt;
  }
  .field-label {
    font-size: var(--fs-label);
    margin-top: 3pt;
  }

  /* ===== Missions ===== */
  .missions {
    display: flex;
    flex-direction: column;
    gap: 6pt;
  }
  .mission-cols {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 19pt;
  }
  .mcol {
    display: flex;
    flex-direction: column;
    gap: 4.5pt;
  }
  .mrow {
    display: grid;
    grid-template-columns: 16pt 1fr 42.75pt;
    align-items: center;
    gap: 6pt;
  }
  .mrow.head {
    align-items: baseline;
    margin-bottom: 1.5pt;
  }
  .mh-day,
  .mh-name,
  .mh-prog {
    font-size: var(--fs-small);
    color: var(--ink);
  }
  .mh-prog {
    text-align: left;
  }
  .day-box {
    width: 13pt;
    height: 13pt;
    border: var(--stroke-heavy) solid var(--gray);
    border-radius: var(--radius-daybox);
  }
  .name-line {
    border-bottom: var(--stroke-thin) solid var(--ink);
    height: 12.5pt;
  }
  .prog {
    display: inline-flex;
    justify-content: center;
    gap: 6pt;
  }
  .prog i {
    box-sizing: border-box;
    flex-shrink: 0;
    width: 9pt;
    height: 9pt;
    border: var(--stroke-medium) solid var(--gray);
    border-radius: var(--radius-diamond);
    transform: rotate(45deg);
  }

  /* ===== Bottom band ===== */
  .bottom {
    display: grid;
    grid-template-columns: 1.55fr 1fr;
    gap: 34pt;
    margin-top: 4.5pt;
  }
  .lbox {
    position: relative;
    border: var(--stroke-medium) solid var(--ink);
    border-radius: var(--radius-box);
    padding: 6pt 9.5pt 9.5pt;
  }
  .vlabel {
    position: absolute;
    left: -14pt;
    bottom: 0;
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    text-transform: uppercase;
    letter-spacing: 0.22em;
    font-size: var(--fs-label);
    line-height: 1;
  }
  .line-cols {
    display: grid;
    gap: 16pt;
  }
  .rewards .line-cols {
    grid-template-columns: repeat(3, 1fr);
  }
  .notable .line-cols {
    grid-template-columns: repeat(2, 1fr);
  }
  .line-col {
    display: flex;
    flex-direction: column;
    gap: 5pt;
  }

  @media print {
    @page {
      size: A4 landscape;
      margin: 0;
    }
    .page-frame {
      padding: 0;
    }
  }
</style>
