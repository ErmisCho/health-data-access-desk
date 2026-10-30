import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(`${process.cwd()}/src/styles.css`, "utf8");

function palette(selector: string): Record<string, number[]> {
  const block = css.slice(css.indexOf(`${selector} {`)).split("}")[0]!;
  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+): oklch\(([^)]+)\)/g)].map((match) => [
      match[1]!,
      match[2]!.split(/\s+/).map(Number),
    ]),
  );
}

// OKLCH -> linear sRGB, then WCAG relative luminance (with gamut clipping).
function luminance([lightness = 0, chroma = 0, hue = 0]: number[]): number {
  const a = chroma * Math.cos((hue * Math.PI) / 180);
  const b = chroma * Math.sin((hue * Math.PI) / 180);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((v) => Math.max(0, Math.min(1, v)));
  return 0.2126 * rgb[0]! + 0.7152 * rgb[1]! + 0.0722 * rgb[2]!;
}

describe.each([":root", ".dark"])("%s text contrast", (selector) => {
  const tokens = { ...palette(":root"), ...palette(selector) };
  const pairs = [
    ["foreground", "background"],
    ["foreground", "landing"],
    ["muted-foreground", "landing"],
    ["primary", "landing"],
    ["accent", "landing"],
    ["card-foreground", "card"],
    ["popover-foreground", "popover"],
    ["primary-foreground", "primary"],
    ["secondary-foreground", "secondary"],
    ["accent-foreground", "accent"],
    ["muted-foreground", "background"],
    ["muted-foreground", "card"],
    ["muted-foreground", "muted"],
    ["foreground", "muted"],
    ["destructive-foreground", "destructive"],
    ["destructive", "card"],
    ["success-foreground", "success"],
    ["info-foreground", "info"],
  ];
  it.each(pairs)("%s on %s meets AA for normal text", (foreground, background) => {
    const values = [luminance(tokens[foreground!]!), luminance(tokens[background!]!)].sort(
      (a, b) => b - a,
    );
    expect((values[0]! + 0.05) / (values[1]! + 0.05)).toBeGreaterThanOrEqual(4.5);
  });
});

