/** Minimal markdown → HTML for owned content (we control the source). */

export type Frontmatter = Record<string, string>;

export function parseFrontmatter(raw: string): {
  data: Frontmatter;
  content: string;
} {
  const trimmed = raw.replace(/^\uFEFF/, "");
  if (!trimmed.startsWith("---")) {
    return { data: {}, content: trimmed.trim() };
  }
  const end = trimmed.indexOf("\n---", 3);
  if (end === -1) {
    return { data: {}, content: trimmed.trim() };
  }
  const fm = trimmed.slice(3, end).trim();
  const content = trimmed.slice(end + 4).replace(/^\s+/, "");
  const data: Frontmatter = {};
  for (const line of fm.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return { data, content };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(text: string) {
  let html = escapeHtml(text);
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g,
    '<a href="$2">$1</a>'
  );
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  return html;
}

function isTableSeparator(line: string) {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
}

function tableRow(line: string) {
  const cells = line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
  return cells;
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;
  let inList: "ul" | "ol" | null = null;

  const closeList = () => {
    if (inList) {
      out.push(inList === "ul" ? "</ul>" : "</ol>");
      inList = null;
    }
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      closeList();
      i += 1;
      continue;
    }

    if (trimmed === "---") {
      closeList();
      out.push("<hr />");
      i += 1;
      continue;
    }

    if (trimmed.startsWith("|") && lines[i + 1] && isTableSeparator(lines[i + 1])) {
      closeList();
      const headers = tableRow(trimmed);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(tableRow(lines[i]));
        i += 1;
      }
      out.push("<table><thead><tr>");
      headers.forEach((h) => out.push(`<th>${inline(h)}</th>`));
      out.push("</tr></thead><tbody>");
      rows.forEach((row) => {
        out.push("<tr>");
        row.forEach((cell) => out.push(`<td>${inline(cell)}</td>`));
        out.push("</tr>");
      });
      out.push("</tbody></table>");
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      i += 1;
      continue;
    }

    if (trimmed.startsWith("> ")) {
      closeList();
      const quote: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("> ")) {
        quote.push(lines[i].trim().slice(2));
        i += 1;
      }
      out.push(`<blockquote><p>${inline(quote.join(" "))}</p></blockquote>`);
      continue;
    }

    const ul = trimmed.match(/^[-*]\s+(.+)$/);
    if (ul) {
      if (inList !== "ul") {
        closeList();
        out.push("<ul>");
        inList = "ul";
      }
      out.push(`<li>${inline(ul[1])}</li>`);
      i += 1;
      continue;
    }

    const ol = trimmed.match(/^\d+\.\s+(.+)$/);
    if (ol) {
      if (inList !== "ol") {
        closeList();
        out.push("<ol>");
        inList = "ol";
      }
      out.push(`<li>${inline(ol[1])}</li>`);
      i += 1;
      continue;
    }

    closeList();
    const para: string[] = [trimmed];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith("|") &&
      !lines[i].trim().startsWith("- ") &&
      !lines[i].trim().startsWith("> ") &&
      !/^\d+\.\s+/.test(lines[i].trim())
    ) {
      para.push(lines[i].trim());
      i += 1;
    }
    out.push(`<p>${inline(para.join(" "))}</p>`);
  }

  closeList();
  return out.join("\n");
}
