"use client";

import { useEffect, useRef } from "react";

import { useAuth } from "@/hooks/useAuth";

export type ViolationSource =
  | "devtools"
  | "extension"
  | "contextmenu"
  | "shortcut"
  | "copy"
  | "cut"
  | "paste"
  | "selectstart";

export type ViolationSeverity = "hard" | "soft";

export interface ExamViolationEvent {
  source: ViolationSource;
  severity: ViolationSeverity;
  metadata?: Record<string, unknown>;
}

interface ExamSecurityGuardProps {
  enabled?: boolean;
  onViolation: (event: ExamViolationEvent) => void;
}

interface ExtensionGlobalRule {
  extension: string;
  matcher: () => boolean;
  details: () => Record<string, unknown>;
}

interface ExtensionDomRule {
  extension: string;
  selectors: string[];
}

const SOFT_SHORTCUTS = new Set([
  "f12",
  "ctrl+shift+i",
  "ctrl+shift+j",
  "ctrl+shift+c",
  "ctrl+u",
  "meta+alt+i",
  "meta+alt+j",
  "meta+alt+c",
]);

const DEVTOOLS_THRESHOLD_MS = 120;
const DEVTOOLS_STREAK_TO_LOCK = 3;
const EXTENSION_SCAN_INTERVAL_MS = 2500;
const DEVTOOLS_CHECK_INTERVAL_MS = 1200;

const EXTENSION_GLOBAL_RULES: ExtensionGlobalRule[] = [
  {
    extension: "Grammarly",
    matcher: () =>
      "__grammarlyAPI" in window ||
      "__grammarly_callback" in window ||
      "Grammarly" in window,
    details: () => ({
      matchedGlobals: [
        "__grammarlyAPI",
        "__grammarly_callback",
        "Grammarly",
      ].filter((key) => key in window),
    }),
  },
  {
    extension: "Google Translate",
    matcher: () => {
      const candidate = (window as Window & {
        google?: { translate?: unknown };
      }).google;
      return Boolean(candidate?.translate);
    },
    details: () => ({
      matchedGlobals: ["google.translate"],
    }),
  },
  {
    extension: "MetaMask",
    matcher: () => {
      const ethereum = (window as Window & {
        ethereum?: { isMetaMask?: boolean };
      }).ethereum;
      return Boolean(ethereum?.isMetaMask);
    },
    details: () => ({
      matchedGlobals: ["ethereum.isMetaMask"],
    }),
  },
  {
    extension: "Tampermonkey",
    matcher: () =>
      "__tampermonkey__" in window ||
      "TM_info" in window ||
      "unsafeWindow" in window,
    details: () => ({
      matchedGlobals: ["__tampermonkey__", "TM_info", "unsafeWindow"].filter(
        (key) => key in window
      ),
    }),
  },
  {
    extension: "Violentmonkey",
    matcher: () =>
      "__violentmonkey__" in window ||
      "VMInitInjection" in window ||
      "VM_shortcut" in window,
    details: () => ({
      matchedGlobals: ["__violentmonkey__", "VMInitInjection", "VM_shortcut"].filter(
        (key) => key in window
      ),
    }),
  },
];

const EXTENSION_DOM_RULES: ExtensionDomRule[] = [
  {
    extension: "Grammarly",
    selectors: [
      "grammarly-desktop-integration",
      "grammarly-popups",
      "[data-grammarly-shadow-root]",
      "[data-new-gr-c-s-check-loaded]",
    ],
  },
  {
    extension: "Google Translate",
    selectors: [
      "iframe.goog-te-banner-frame",
      "iframe.goog-te-menu-frame",
      ".skiptranslate",
      "[class*='goog-te']",
      "[class*='VIpgJd']",
    ],
  },
  {
    extension: "MetaMask",
    selectors: [
      "[data-testid='mmd-notification-card']",
      "[data-testid='popover-close']",
      "#metamask-notification-content",
    ],
  },
  {
    extension: "Tampermonkey",
    selectors: ["#tm-dynamic-style", "[data-tampermonkey]"],
  },
  {
    extension: "Violentmonkey",
    selectors: ["[id^='VM-']", "[class*='violentmonkey']"],
  },
];

function getShortcutSignature(event: KeyboardEvent): string {
  const parts: string[] = [];

  if (event.ctrlKey) parts.push("ctrl");
  if (event.metaKey) parts.push("meta");
  if (event.shiftKey) parts.push("shift");
  if (event.altKey) parts.push("alt");

  parts.push(event.key.toLowerCase());
  return parts.join("+");
}

function runDebuggerProbe(): number {
  const start = performance.now();
  // Hard violation: only real debugger pause should create a large delta.
  debugger;
  return performance.now() - start;
}

export default function ExamSecurityGuard({
  enabled = true,
  onViolation,
}: ExamSecurityGuardProps) {
  const { user } = useAuth();
  const ignoredReactDevtoolsRef = useRef(false);
  const devtoolsStreakRef = useRef(0);
  const hardLockedRef = useRef(false);
  const reportedExtensionKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let extensionInterval: NodeJS.Timeout | null = null;
    let devtoolsInterval: NodeJS.Timeout | null = null;

    const userId = user?.id ?? null;

    const emitViolation = (
      severity: ViolationSeverity,
      source: ViolationSource,
      metadata?: Record<string, unknown>
    ) => {
      if (severity === "hard") {
        if (hardLockedRef.current) return;
        hardLockedRef.current = true;
      }

      onViolation({
        source,
        severity,
        metadata: {
          ...metadata,
          userId,
          pathname: window.location.pathname,
        },
      });
    };

    // Disable text selection for the full exam session.
    document.documentElement.classList.add("exam-guard-active");
    document.body.classList.add("exam-guard-active");

    // Ignore React DevTools completely. It is common in developer machines and
    // must never count as an exam violation.
    if (
      "__REACT_DEVTOOLS_GLOBAL_HOOK__" in window &&
      !ignoredReactDevtoolsRef.current
    ) {
      console.info("[ANTI-CHEAT] React DevTools detected (IGNORED)");
      ignoredReactDevtoolsRef.current = true;
    }

    // Hard violation detection: only lock when debugger pauses exceed 120ms
    // for 3 consecutive probes. This avoids false positives from normal lag.
    const checkDevtools = () => {
      const elapsed = runDebuggerProbe();
      if (elapsed >= DEVTOOLS_THRESHOLD_MS) {
        devtoolsStreakRef.current += 1;
        console.warn(
          `[ANTI-CHEAT] DevTools probe exceeded ${DEVTOOLS_THRESHOLD_MS}ms (${Math.round(
            elapsed
          )}ms) - streak ${devtoolsStreakRef.current}/${DEVTOOLS_STREAK_TO_LOCK}`
        );

        if (devtoolsStreakRef.current >= DEVTOOLS_STREAK_TO_LOCK) {
          emitViolation("hard", "devtools", {
            elapsed,
            thresholdMs: DEVTOOLS_THRESHOLD_MS,
            streak: devtoolsStreakRef.current,
          });
        }
        return;
      }

      devtoolsStreakRef.current = 0;
    };

    // Soft violation detection for keyboard shortcuts and blocked interactions.
    const reportSoftViolation = (
      source: Exclude<ViolationSource, "devtools" | "extension">,
      metadata?: Record<string, unknown>
    ) => {
      emitViolation("soft", source, metadata);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const signature = getShortcutSignature(event);
      if (!SOFT_SHORTCUTS.has(signature)) return;

      event.preventDefault();
      event.stopPropagation();
      reportSoftViolation("shortcut", { signature });
    };

    const preventAndReport = (
      event: Event,
      source: Exclude<ViolationSource, "devtools" | "extension" | "shortcut">,
      metadata?: Record<string, unknown>
    ) => {
      event.preventDefault();
      event.stopPropagation();
      reportSoftViolation(source, metadata);
    };

    const handleContextMenu = (event: MouseEvent) => {
      preventAndReport(event, "contextmenu", {
        x: event.clientX,
        y: event.clientY,
      });
    };

    const handleCopy = (event: ClipboardEvent) => preventAndReport(event, "copy");
    const handleCut = (event: ClipboardEvent) => preventAndReport(event, "cut");
    const handlePaste = (event: ClipboardEvent) =>
      preventAndReport(event, "paste");
    const handleSelectStart = (event: Event) =>
      preventAndReport(event, "selectstart");

    // Extension detection uses both global variables and DOM selectors.
    // Each real extension is only reported once while it remains present.
    const scanExtensions = () => {
      const activeKeys = new Set<string>();

      const globalHits = EXTENSION_GLOBAL_RULES.filter((rule) => rule.matcher()).map(
        (rule) => ({
          extension: rule.extension,
          method: "global" as const,
          details: rule.details(),
        })
      );

      const domHits = EXTENSION_DOM_RULES.flatMap((rule) => {
        const matchedSelectors = rule.selectors.filter((selector) =>
          document.querySelector(selector)
        );

        if (matchedSelectors.length === 0) return [];

        return [
          {
            extension: rule.extension,
            method: "dom" as const,
            details: { matchedSelectors },
          },
        ];
      });

      const allHits = [...globalHits, ...domHits];

      for (const hit of allHits) {
        const hitKey = `${hit.extension}:${hit.method}`;
        activeKeys.add(hitKey);

        if (reportedExtensionKeysRef.current.has(hitKey)) continue;

        console.warn(
          `[ANTI-CHEAT] Extension detected: ${hit.extension} via ${hit.method}`
        );
        emitViolation("soft", "extension", {
          extension: hit.extension,
          detectionMethod: hit.method,
          ...hit.details,
        });
        reportedExtensionKeysRef.current.add(hitKey);
      }

      reportedExtensionKeysRef.current.forEach((key) => {
        if (!activeKeys.has(key)) {
          reportedExtensionKeysRef.current.delete(key);
        }
      });
    };

    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("contextmenu", handleContextMenu, true);
    document.addEventListener("copy", handleCopy, true);
    document.addEventListener("cut", handleCut, true);
    document.addEventListener("paste", handlePaste, true);
    document.addEventListener("selectstart", handleSelectStart, true);

    scanExtensions();
    extensionInterval = setInterval(scanExtensions, EXTENSION_SCAN_INTERVAL_MS);
    devtoolsInterval = setInterval(checkDevtools, DEVTOOLS_CHECK_INTERVAL_MS);

    return () => {
      if (extensionInterval) clearInterval(extensionInterval);
      if (devtoolsInterval) clearInterval(devtoolsInterval);

      document.documentElement.classList.remove("exam-guard-active");
      document.body.classList.remove("exam-guard-active");

      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("contextmenu", handleContextMenu, true);
      document.removeEventListener("copy", handleCopy, true);
      document.removeEventListener("cut", handleCut, true);
      document.removeEventListener("paste", handlePaste, true);
      document.removeEventListener("selectstart", handleSelectStart, true);

      devtoolsStreakRef.current = 0;
      hardLockedRef.current = false;
      reportedExtensionKeysRef.current.clear();
    };
  }, [enabled, onViolation, user?.id]);

  return null;
}
