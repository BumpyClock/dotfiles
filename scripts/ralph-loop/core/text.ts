export function formatShort(text: string, maxLength = 300): string {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length <= maxLength ? compact : `${compact.slice(0, maxLength)}...`;
}

export function wrapText(input: string, maxWidth: number): string[] {
  const width = Math.max(24, maxWidth);
  const lines: string[] = [];
  for (const rawLine of input.split("\n")) {
    const words = rawLine.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of words) {
      if (!line) {
        line = word;
        continue;
      }
      if (`${line} ${word}`.length <= width) {
        line = `${line} ${word}`;
      } else {
        lines.push(line);
        line = word;
      }
    }
    if (line) {
      lines.push(line);
    }
  }
  return lines;
}
