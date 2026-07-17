import { describe, it, expect } from "vitest";
import {
  TRACKER_DAYS,
  SCHEMA_VERSION,
  FormStateError,
  defaultTrackerState,
  serializeState,
  parseState,
  isImageDataUrl,
  type TrackerState,
} from "../src/lib/form-state";

describe("defaultTrackerState", () => {
  it("returns the official-logo authoring default", () => {
    const state = defaultTrackerState();
    expect(state.logoMode).toBe("default");
    expect(state.logoDataUrl).toBeNull();
    expect(state.books.length).toBeGreaterThan(0);
    expect(state.weatherGroups.length).toBeGreaterThan(0);
  });

  it("returns a fresh object each call (no shared mutable state)", () => {
    const a = defaultTrackerState();
    const b = defaultTrackerState();
    a.books.push({ col: 30, label: "x" });
    expect(b.books).not.toContainEqual({ col: 30, label: "x" });
  });
});

describe("serializeState / parseState round-trip", () => {
  it("preserves state through a save/load cycle", () => {
    const original = defaultTrackerState();
    const restored = parseState(serializeState(original));
    expect(restored).toEqual(original);
  });

  it("stamps the schema version into the serialized payload", () => {
    const json = JSON.parse(serializeState(defaultTrackerState()));
    expect(json.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it("round-trips a custom logo data URL", () => {
    const state: TrackerState = {
      logoMode: "custom",
      logoDataUrl: "data:image/png;base64,AAAA",
      logoText: "",
      books: [],
      weatherGroups: [],
    };
    expect(parseState(serializeState(state))).toEqual(state);
  });
});

describe("parseState validation", () => {
  it("rejects non-JSON input", () => {
    expect(() => parseState("not json")).toThrow(FormStateError);
  });

  it("rejects a JSON array at the top level", () => {
    expect(() => parseState("[]")).toThrow(FormStateError);
  });

  it("rejects a missing or unknown logo mode", () => {
    const unknown = () => parseState(JSON.stringify({ logoMode: "wat" }));
    expect(unknown).toThrow(FormStateError);
    expect(unknown).toThrow(/logo mode/i);

    const missing = () => parseState(JSON.stringify({}));
    expect(missing).toThrow(FormStateError);
    expect(missing).toThrow(/logo mode/i);
  });

  it("treats missing books and weather as empty lists", () => {
    const state = parseState(JSON.stringify({ logoMode: "default" }));
    expect(state.books).toEqual([]);
    expect(state.weatherGroups).toEqual([]);
  });

  it("rejects day columns out of the 1..N range", () => {
    const tooHigh = () =>
      parseState(
        JSON.stringify({
          logoMode: "default",
          books: [{ col: TRACKER_DAYS + 1, label: "x" }],
        }),
      );
    expect(tooHigh).toThrow(FormStateError);
    expect(tooHigh).toThrow(/between 1 and/i);

    const tooLow = () =>
      parseState(
        JSON.stringify({
          logoMode: "default",
          books: [{ col: 0, label: "x" }],
        }),
      );
    expect(tooLow).toThrow(FormStateError);
    expect(tooLow).toThrow(/between 1 and/i);
  });

  it("rejects non-integer day columns", () => {
    const call = () =>
      parseState(
        JSON.stringify({
          logoMode: "default",
          books: [{ col: 1.5, label: "x" }],
        }),
      );
    expect(call).toThrow(FormStateError);
    expect(call).toThrow(/whole number/i);
  });

  it("rejects a weather group that ends before it starts", () => {
    const call = () =>
      parseState(
        JSON.stringify({
          logoMode: "default",
          weatherGroups: [{ start: 5, end: 3, label: "x" }],
        }),
      );
    expect(call).toThrow(FormStateError);
    expect(call).toThrow(/ends before it starts/i);
  });

  it("rejects a logo data URL that is not an embedded image", () => {
    for (const bad of [
      "javascript:alert(1)",
      "https://evil.example/logo.svg",
      "data:text/html,<script>alert(1)</script>",
    ]) {
      const call = () =>
        parseState(JSON.stringify({ logoMode: "custom", logoDataUrl: bad }));
      expect(call).toThrow(FormStateError);
      expect(call).toThrow(/embedded image/i);
    }
  });

  it("accepts a null logo data URL", () => {
    const state = parseState(
      JSON.stringify({ logoMode: "default", logoDataUrl: null }),
    );
    expect(state.logoDataUrl).toBeNull();
  });

  it("rejects a non-string label", () => {
    const call = () =>
      parseState(
        JSON.stringify({
          logoMode: "default",
          books: [{ col: 1, label: 5 }],
        }),
      );
    expect(call).toThrow(FormStateError);
    expect(call).toThrow(/not text/i);
  });

  it("rejects books that are not a list", () => {
    const call = () =>
      parseState(JSON.stringify({ logoMode: "default", books: "nope" }));
    expect(call).toThrow(FormStateError);
    expect(call).toThrow(/not a list/i);
  });

  it("rejects weather conditions that are not a list", () => {
    const call = () =>
      parseState(JSON.stringify({ logoMode: "default", weatherGroups: "nope" }));
    expect(call).toThrow(FormStateError);
    expect(call).toThrow(/not a list/i);
  });

  it("coerces a null label to empty string", () => {
    const state = parseState(
      JSON.stringify({ logoMode: "default", books: [{ col: 1, label: null }] }),
    );
    expect(state.books[0].label).toBe("");
  });

  it("coerces a missing label key to empty string", () => {
    const state = parseState(
      JSON.stringify({ logoMode: "default", books: [{ col: 1 }] }),
    );
    expect(state.books[0].label).toBe("");
  });

  it("normalizes an empty-string logo data URL to null", () => {
    const state = parseState(
      JSON.stringify({ logoMode: "default", logoDataUrl: "" }),
    );
    expect(state.logoDataUrl).toBeNull();
  });

  it("rejects a null day column (null is not a whole number)", () => {
    const call = () =>
      parseState(
        JSON.stringify({
          logoMode: "default",
          books: [{ col: null, label: "x" }],
        }),
      );
    expect(call).toThrow(FormStateError);
    expect(call).toThrow(/whole number/i);
  });
});

describe("placeholder logo mode", () => {
  it("round-trips the placeholder logo mode", () => {
    const state: TrackerState = {
      logoMode: "placeholder",
      logoDataUrl: null,
      logoText: "",
      books: [],
      weatherGroups: [],
    };
    expect(parseState(serializeState(state))).toEqual(state);
  });
});

describe("text logo mode", () => {
  it("defaults logoText to the Legacy of the Ancestors wordmark", () => {
    expect(defaultTrackerState().logoText).toBe("LEGACY OF THE\nANCESTORS");
  });

  it("round-trips a multi-line text wordmark", () => {
    const state: TrackerState = {
      logoMode: "text",
      logoDataUrl: null,
      logoText: "LEGACY OF THE\nANCESTORS",
      books: [],
      weatherGroups: [],
    };
    expect(parseState(serializeState(state))).toEqual(state);
  });

  it("coerces a missing or null logoText to empty string", () => {
    expect(parseState(JSON.stringify({ logoMode: "default" })).logoText).toBe(
      "",
    );
    expect(
      parseState(JSON.stringify({ logoMode: "default", logoText: null }))
        .logoText,
    ).toBe("");
  });

  it("rejects a non-string logoText", () => {
    const call = () =>
      parseState(JSON.stringify({ logoMode: "default", logoText: 5 }));
    expect(call).toThrow(FormStateError);
    expect(call).toThrow(/logo text is not text/i);
  });
});

describe("isImageDataUrl", () => {
  it("accepts inert image data URLs, including SVG", () => {
    expect(isImageDataUrl("data:image/png;base64,AAAA")).toBe(true);
    expect(isImageDataUrl("data:image/jpeg;base64,AAAA")).toBe(true);
    expect(isImageDataUrl("data:image/svg+xml;base64,AAAA")).toBe(true);
  });

  it("rejects non-image and non-data URLs", () => {
    expect(isImageDataUrl("javascript:alert(1)")).toBe(false);
    expect(isImageDataUrl("https://evil.example/logo.svg")).toBe(false);
    expect(isImageDataUrl("data:text/html,<script>alert(1)</script>")).toBe(
      false,
    );
  });

  it("is the same gate parseState applies to a loaded logo", () => {
    const svg = "data:image/svg+xml;base64,AAAA";
    const state = parseState(
      JSON.stringify({ logoMode: "custom", logoDataUrl: svg }),
    );
    expect(state.logoDataUrl).toBe(svg);
  });
});
