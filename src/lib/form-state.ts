/**
 * Tracker form state: the shape that drives the printable sheet, plus pure
 * serialize/parse/validate helpers for JSON save/load. Parsing treats the
 * incoming JSON as untrusted (it comes from a user-picked file) and validates
 * every field at this boundary, rejecting anything malformed.
 */

/** Number of day columns on the sheet. A fixed 30-column track. */
export const TRACKER_DAYS = 30;

/** Schema version stamped into saved files so future loaders can migrate. */
export const SCHEMA_VERSION = 1;

/** How the wordmark slot is filled. */
export type LogoMode = "default" | "custom" | "placeholder" | "text";

/** A journal / campaign-guide marker sitting above a single day column. */
export interface BookMarker {
  /** Day column the marker sits above (1..TRACKER_DAYS). */
  col: number;
  /** Entry number printed under the book glyph. */
  label: string;
}

/** A weather bracket spanning a run of days with a named weather condition. */
export interface WeatherGroup {
  /** First day of the run (1..TRACKER_DAYS). */
  start: number;
  /** Last day of the run (start..TRACKER_DAYS). */
  end: number;
  /** Weather-condition name printed under the bracket. */
  label: string;
}

/** Everything the form controls on the sheet. */
export interface TrackerState {
  /** `default` uses the official logo; `custom` uses `logoDataUrl`; `placeholder` leaves the slot neutral; `text` renders `logoText`. */
  logoMode: LogoMode;
  /** Uploaded image as a `data:image/...` URL. Only meaningful when `logoMode === "custom"`. */
  logoDataUrl: string | null;
  /** Wordmark text. Only meaningful when `logoMode === "text"`. Each newline starts a new line on the sheet. */
  logoText: string;
  books: BookMarker[];
  weatherGroups: WeatherGroup[];
}

/** Thrown when a loaded file cannot be parsed into a valid {@link TrackerState}. */
export class FormStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FormStateError";
  }
}

const LOGO_MODES: readonly LogoMode[] = ["default", "custom", "placeholder", "text"];

/**
 * Whether a string is an inert embedded image URL safe to use as an `<img src>`.
 * Only `data:image/...` URLs qualify; `javascript:`, remote `http(s)` references,
 * and non-image data URLs are rejected. This is the single gate for both loaded
 * JSON and freshly uploaded images.
 *
 * SVG is intentionally allowed: browsers render an SVG referenced by `<img>` in
 * secure static mode - no script execution and no external fetches - so an
 * `image/svg+xml` data URL is as inert as any raster in this sink.
 */
export function isImageDataUrl(value: string): boolean {
  return value.startsWith("data:image/");
}

/**
 * The authoring default: the official Lure of the Valley sample data. Serves as
 * the starting sheet and the target of "Reset to defaults".
 */
export function defaultTrackerState(): TrackerState {
  return {
    logoMode: "default",
    logoDataUrl: null,
    logoText: "LEGACY OF THE\nANCESTORS",
    books: [
      { col: 1, label: "1" },
      { col: 3, label: "94.1" },
      { col: 4, label: "1.04" },
    ],
    weatherGroups: [
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
    ],
  };
}

/** Serialize form state to a pretty-printed JSON string for download. */
export function serializeState(state: TrackerState): string {
  const payload = {
    schemaVersion: SCHEMA_VERSION,
    logoMode: state.logoMode,
    logoDataUrl: state.logoDataUrl,
    logoText: state.logoText,
    books: state.books,
    weatherGroups: state.weatherGroups,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Parse and validate a saved JSON string into a {@link TrackerState}. Throws a
 * {@link FormStateError} with a user-facing message on any malformed input.
 */
export function parseState(json: string): TrackerState {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new FormStateError("This file is not valid JSON.");
  }

  if (!isRecord(raw)) {
    throw new FormStateError("This file does not contain tracker data.");
  }

  return {
    logoMode: parseLogoMode(raw.logoMode),
    logoDataUrl: parseLogoDataUrl(raw.logoDataUrl),
    logoText: parseLogoText(raw.logoText),
    books: parseBooks(raw.books),
    weatherGroups: parseWeatherGroups(raw.weatherGroups),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseLogoMode(value: unknown): LogoMode {
  if (typeof value === "string" && (LOGO_MODES as readonly string[]).includes(value)) {
    return value as LogoMode;
  }
  throw new FormStateError("Saved logo mode is missing or unrecognized.");
}

/**
 * A loaded logo URL is written straight into an `<img src>`, so it is a genuine
 * injection point. Only accept inert `data:image/...` URLs; reject everything
 * else (e.g. `javascript:`, remote `http(s)` references, non-image data URLs).
 */
function parseLogoDataUrl(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") {
    throw new FormStateError("Saved logo image is not text.");
  }
  if (value === "") return null;
  if (!isImageDataUrl(value)) {
    throw new FormStateError("Saved logo image must be an embedded image.");
  }
  return value;
}

function parseLogoText(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") {
    throw new FormStateError("Saved logo text is not text.");
  }
  return value;
}

function parseBooks(value: unknown): BookMarker[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new FormStateError("Saved journal markers are not a list.");
  }
  return value.map((entry, i) => {
    if (!isRecord(entry)) {
      throw new FormStateError(`Journal marker ${i + 1} is not valid.`);
    }
    return {
      col: parseDay(entry.col, `Journal marker ${i + 1} day`),
      label: parseLabel(entry.label),
    };
  });
}

function parseWeatherGroups(value: unknown): WeatherGroup[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new FormStateError("Saved weather conditions are not a list.");
  }
  return value.map((entry, i) => {
    if (!isRecord(entry)) {
      throw new FormStateError(`Weather condition ${i + 1} is not valid.`);
    }
    const start = parseDay(entry.start, `Weather condition ${i + 1} start day`);
    const end = parseDay(entry.end, `Weather condition ${i + 1} end day`);
    if (end < start) {
      throw new FormStateError(
        `Weather condition ${i + 1} ends before it starts.`,
      );
    }
    return { start, end, label: parseLabel(entry.label) };
  });
}

function parseDay(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new FormStateError(`${field} must be a whole number.`);
  }
  if (value < 1 || value > TRACKER_DAYS) {
    throw new FormStateError(`${field} must be between 1 and ${TRACKER_DAYS}.`);
  }
  return value;
}

function parseLabel(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") {
    throw new FormStateError("A saved label is not text.");
  }
  return value;
}
