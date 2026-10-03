"use client";

import { useEffect } from "react";
import { toHindi } from "@/shared/i18n";
import { useLanguage } from "@/components/language";

const ATTRS = ["placeholder", "aria-label", "title"] as const;
const SKIP = "script,style,textarea,input,code,canvas,[translate=no],[contenteditable=true]";

/**
 * When Hindi is selected, translates every piece of visible text and the placeholder /
 * aria-label / title attributes through the shared dictionary, and keeps doing so as
 * React updates the page. Text inside one element is translated as a whole sentence,
 * so word order can change. Switching back to English restores the original text.
 */
export function AutoTranslate() {
  const { language } = useLanguage();

  useEffect(() => {
    if (language !== "hi") return;
    const originals = new Map<Text, string>();
    const written = new WeakMap<Text, string>();
    const attrOriginals = new Map<Element, Map<string, string>>();
    const attrWritten = new WeakMap<Element, Map<string, string>>();

    // The English text of a node: what React last wrote, not what we wrote.
    const original = (n: Text): string => {
      const value = n.nodeValue ?? "";
      if (written.get(n) !== value) originals.set(n, value);
      return originals.get(n) ?? value;
    };
    const write = (n: Text, value: string) => {
      if (n.nodeValue !== value) n.nodeValue = value;
      written.set(n, value);
    };

    const processAttrs = (el: Element) => {
      for (const name of ATTRS) {
        const value = el.getAttribute(name);
        if (!value) continue;
        const done = attrWritten.get(el) ?? new Map<string, string>();
        const orig = attrOriginals.get(el) ?? new Map<string, string>();
        if (done.get(name) !== value) orig.set(name, value);
        const english = orig.get(name) ?? value;
        const hindi = toHindi(english);
        if (hindi !== value) el.setAttribute(name, hindi);
        done.set(name, hindi);
        attrWritten.set(el, done);
        attrOriginals.set(el, orig);
      }
    };

    const processElement = (el: Element) => {
      if (el.closest(SKIP)) return;
      processAttrs(el);
      const kids = Array.from(el.childNodes);
      const texts = kids.filter((k): k is Text => k.nodeType === Node.TEXT_NODE);
      if (texts.length === 0) return;
      if (texts.length > 1 && texts.length === kids.length) {
        // React splits "Runs out {date} · {rate} L/day" into several nodes; translate the sentence.
        const parts = texts.map(original);
        const joined = parts.join("");
        const hindi = toHindi(joined);
        if (hindi !== joined) texts.forEach((t, i) => write(t, i === 0 ? hindi : ""));
        else texts.forEach((t, i) => write(t, toHindi(parts[i])));
        return;
      }
      for (const t of texts) write(t, toHindi(original(t)));
    };

    const processTree = (root: Element) => {
      processElement(root);
      root.querySelectorAll("*").forEach(processElement);
    };

    let pending = new Set<Element>();
    let scheduled = false;
    const flush = () => {
      scheduled = false;
      const batch = pending;
      pending = new Set();
      batch.forEach((el) => el.isConnected && processTree(el));
    };
    const queue = (el: Element | null) => {
      if (!el) return;
      pending.add(el);
      if (!scheduled) {
        scheduled = true;
        queueMicrotask(flush);
      }
    };

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "characterData") {
          const t = m.target as Text;
          if (written.get(t) !== t.nodeValue) queue(t.parentElement);
        } else if (m.type === "attributes") {
          const el = m.target as Element;
          const value = el.getAttribute(m.attributeName ?? "");
          if (value && attrWritten.get(el)?.get(m.attributeName ?? "") !== value) queue(el);
        } else {
          queue(m.target as Element);
        }
      }
    });

    processTree(document.body);
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });

    return () => {
      observer.disconnect();
      originals.forEach((english, node) => {
        if (node.isConnected && node.nodeValue === written.get(node)) node.nodeValue = english;
      });
      attrOriginals.forEach((map, el) => {
        map.forEach((english, name) => {
          if (el.isConnected && el.getAttribute(name) === attrWritten.get(el)?.get(name)) el.setAttribute(name, english);
        });
      });
    };
  }, [language]);

  return null;
}
