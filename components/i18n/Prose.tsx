"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import { pickLang, type I18nString } from "@/lib/i18n/types";

/**
 * <Prose value={...} /> — long-form text rendering with markdown-lite.
 *
 * Supported syntax (per docs/content-principles.md):
 *   - `## NN Title`        → numbered sub-section header
 *   - `## Title`           → un-numbered sub-section header
 *   - `- key: value`       → definition row (key bold, value plain)
 *   - `- bullet item`      → regular bullet
 *   - `**bold**`           → <strong>
 *   - blank line           → paragraph break
 *
 * Iteration seam: if we later need full markdown / footnotes / inline
 * links, swap the parser here. The frontmatter contract (markdown-lite
 * string) stays.
 */
export function Prose({ value }: { value: I18nString | string }) {
  const { locale } = useLocale();
  const text = pickLang(value, locale);
  const blocks = parseBlocks(text);

  return (
    <div className="space-y-6">
      {blocks.map((block, i) => renderBlock(block, i))}
    </div>
  );
}

// ---- Block model --------------------------------------------------------

type Block =
  | { kind: "heading"; number: string | null; title: string }
  | { kind: "paragraph"; lines: string[] }
  | { kind: "list"; items: ListItem[] };

type ListItem =
  | { kind: "kv"; key: string; value: string }
  | { kind: "plain"; text: string };

function parseBlocks(text: string): Block[] {
  const lines = text.split("\n");
  const blocks: Block[] = [];

  let para: string[] = [];
  let list: ListItem[] = [];

  const flushParagraph = () => {
    if (para.length) {
      blocks.push({ kind: "paragraph", lines: para });
      para = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push({ kind: "list", items: list });
      list = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (line === "") {
      flushParagraph();
      flushList();
      continue;
    }

    // Heading: `## ...`
    const heading = line.match(/^##\s+(.*)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const text = heading[1].trim();
      const numberMatch = text.match(/^(\d+)\s+(.*)$/);
      if (numberMatch) {
        blocks.push({ kind: "heading", number: numberMatch[1], title: numberMatch[2] });
      } else {
        blocks.push({ kind: "heading", number: null, title: text });
      }
      continue;
    }

    // List item: `- ...`
    const listItem = line.match(/^-\s+(.*)$/);
    if (listItem) {
      flushParagraph();
      const itemText = listItem[1];
      // `- key: value` (key separated by `:` or `：`, but only the first one
      // and only if there's content after).
      const kv = itemText.match(/^([^:：]+)[:：]\s+(.+)$/);
      if (kv) {
        list.push({ kind: "kv", key: kv[1].trim(), value: kv[2].trim() });
      } else {
        list.push({ kind: "plain", text: itemText });
      }
      continue;
    }

    // Plain paragraph line.
    flushList();
    para.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}

// ---- Render -------------------------------------------------------------

function renderBlock(block: Block, key: number) {
  switch (block.kind) {
    case "heading":
      return (
        <h3
          key={key}
          className="mt-section flex items-baseline gap-4 text-headline font-medium tracking-[-0.02em] text-fg first:mt-0"
        >
          {block.number ? (
            <span className="font-mono text-subhead text-muted/80 tabular-nums">
              {block.number}
            </span>
          ) : null}
          <span>{block.title}</span>
        </h3>
      );

    case "paragraph":
      return (
        <p key={key} className="text-body leading-[1.7] text-fg/90">
          {renderInlineLines(block.lines)}
        </p>
      );

    case "list":
      return (
        <dl key={key} className="space-y-3">
          {block.items.map((item, i) =>
            item.kind === "kv" ? (
              <div
                key={i}
                className="grid gap-2 border-l-2 border-line/40 pl-5 md:grid-cols-[max-content_1fr] md:gap-x-6 md:border-l md:pl-6"
              >
                <dt className="font-mono text-caption uppercase tracking-[0.18em] text-muted">
                  {renderInline(item.key)}
                </dt>
                <dd className="text-body leading-[1.55] text-fg/90">
                  {renderInline(item.value)}
                </dd>
              </div>
            ) : (
              <div key={i} className="flex gap-3 text-body leading-[1.55] text-fg/90">
                <span aria-hidden className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-muted" />
                <span>{renderInline(item.text)}</span>
              </div>
            ),
          )}
        </dl>
      );
  }
}

function renderInlineLines(lines: string[]): React.ReactNode[] {
  return lines.flatMap((line, i) => {
    const inline = renderInline(line);
    if (i < lines.length - 1) return [...inline, <br key={`br-${i}`} />];
    return inline;
  });
}

function renderInline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-medium text-fg">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
