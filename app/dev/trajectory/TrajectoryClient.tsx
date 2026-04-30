"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MapGeometryAsset } from "@/lib/content/load-sswt-assets";
import {
  DEFAULT_DURATION,
  DEFAULT_MAP_STATE,
  type DevMapState,
  type Waypoint,
} from "@/lib/cinema/trajectoryTypes";
import { findTemplateById, TRAJECTORY_TEMPLATES } from "@/lib/cinema/trajectoryTemplates";
import { exportToYaml, totalDuration } from "@/lib/cinema/trajectoryExport";
import { RecorderPanel } from "./RecorderPanel";

const DevCinemaCanvas = dynamic(
  () => import("./DevCinemaCanvas").then((m) => ({ default: m.DevCinemaCanvas })),
  { ssr: false, loading: () => <div className="h-screen w-screen bg-bg" aria-hidden /> },
);

export type CameraReadout = {
  position: [number, number, number];
  lookAt: [number, number, number];
};

/**
 * TrajectoryClient — orchestrates dev canvas + recorder UI.
 *
 * State:
 *   - waypoints[]      — recorded camera waypoints
 *   - mapState         — current dev mapState (controls SandTable + overlays)
 *   - readout          — current camera position + lookAt (live, from canvas)
 *   - selectedIndex    — currently selected waypoint (for delete / edit)
 *   - previewing       — preview play active (Space toggles)
 *   - cameraTargetSeed — when set, FreeFlyCamera resets to this position
 */
export function TrajectoryClient({
  slug,
  geometry,
}: {
  slug: string;
  geometry: MapGeometryAsset | null;
}) {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [mapState, setMapState] = useState<DevMapState>(DEFAULT_MAP_STATE);
  const [readout, setReadout] = useState<CameraReadout>({
    position: [0, 4, 8],
    lookAt: [0, 0, 0],
  });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [cameraTargetSeed, setCameraTargetSeed] = useState<CameraReadout | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const readoutRef = useRef(readout);
  readoutRef.current = readout;

  const pressedKeysRef = useRef<Set<string>>(new Set());

  const goToWaypoint = useCallback((id: string) => {
    setWaypoints((prev) => {
      const wp = prev.find((w) => w.id === id);
      if (wp) {
        setMapState({ ...wp.mapState });
        setCameraTargetSeed({
          position: [...wp.position] as [number, number, number],
          lookAt: [...wp.lookAt] as [number, number, number],
        });
      }
      return prev;
    });
  }, []);

  const snapCameraTo = useCallback((next: CameraReadout) => {
    setCameraTargetSeed({
      position: [...next.position] as [number, number, number],
      lookAt: [...next.lookAt] as [number, number, number],
    });
  }, []);

  const handleReadoutChange = useCallback((next: CameraReadout) => {
    setReadout(next);
  }, []);

  const addWaypoint = useCallback(() => {
    const wp: Waypoint = {
      id: cryptoRandom(),
      position: [...readoutRef.current.position] as [number, number, number],
      lookAt: [...readoutRef.current.lookAt] as [number, number, number],
      mapState: { ...mapState },
      durationToNext: DEFAULT_DURATION,
    };
    setWaypoints((prev) => [...prev, wp]);
  }, [mapState]);

  const deleteWaypoint = useCallback((id: string) => {
    setWaypoints((prev) => prev.filter((w) => w.id !== id));
    setSelectedIndex(null);
  }, []);

  const updateWaypoint = useCallback((id: string, patch: Partial<Waypoint>) => {
    setWaypoints((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }, []);

  const applyTemplate = useCallback((tplId: string) => {
    const tpl = findTemplateById(tplId);
    if (!tpl) return;
    const seeded: Waypoint[] = tpl.waypoints.map((w) => ({ ...w, id: cryptoRandom() }));
    setWaypoints(seeded);
    setSelectedIndex(null);
    if (seeded[0]) {
      setMapState({ ...seeded[0].mapState });
      setCameraTargetSeed({
        position: [...seeded[0].position],
        lookAt: [...seeded[0].lookAt],
      });
    }
    showToast(`Loaded "${tpl.name}" (${seeded.length} waypoints)`);
  }, []);

  const exportClipboard = useCallback(async () => {
    const yaml = exportToYaml(waypoints);
    try {
      await navigator.clipboard.writeText(yaml);
      const sceneCount = Math.max(1, waypoints.length - 1);
      showToast(`Copied ${waypoints.length === 0 ? 0 : sceneCount} scene block(s) to clipboard`);
    } catch (e) {
      showToast(`Clipboard write failed: ${(e as Error).message}`);
    }
  }, [waypoints]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  };

  // Keyboard shortcuts (R / Space / E / Backspace) + pressed-keys tracking
  // for WASD / QE / Arrow continuous nudge (consumed by DevCameraDriver).
  useEffect(() => {
    const isInputFocused = () => {
      const t = document.activeElement as HTMLElement | null;
      return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (isInputFocused()) return;

      // Discrete shortcuts
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        addWaypoint();
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
        setPreviewing((p) => !p);
        return;
      }
      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        void exportClipboard();
        return;
      }
      if (e.key === "Backspace" && selectedIndex !== null) {
        e.preventDefault();
        const wp = waypoints[selectedIndex];
        if (wp) deleteWaypoint(wp.id);
        return;
      }

      // Continuous nudge keys — track in set
      const NUDGE_CODES = new Set([
        "KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "KeyE",
        "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
        "ShiftLeft", "ShiftRight", "AltLeft", "AltRight",
      ]);
      if (NUDGE_CODES.has(e.code)) {
        pressedKeysRef.current.add(e.code);
        // Prevent page scroll on space/arrow if not focused
        if (e.code.startsWith("Arrow")) e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      pressedKeysRef.current.delete(e.code);
    };
    const onBlur = () => pressedKeysRef.current.clear();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [addWaypoint, exportClipboard, deleteWaypoint, selectedIndex, waypoints]);

  const total = useMemo(() => totalDuration(waypoints), [waypoints]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-bg text-fg">
      {/* Top banner */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-center">
        <div className="pointer-events-auto mt-3 rounded-full border border-line/30 bg-bg/85 px-4 py-1.5 text-caption font-mono uppercase tracking-[0.18em] text-muted backdrop-blur-md">
          DEV TOOL · trajectory recorder · slug: {slug}
        </div>
      </div>

      {/* Canvas */}
      <DevCinemaCanvas
        geometry={geometry}
        mapState={mapState}
        onReadoutChange={handleReadoutChange}
        cameraSeed={cameraTargetSeed}
        previewing={previewing}
        waypoints={waypoints}
        pressedKeysRef={pressedKeysRef}
      />

      {/* Live readout — editable (top-left) */}
      <LiveReadout readout={readout} onSnap={snapCameraTo} />

      {/* Recorder panel */}
      <RecorderPanel
        waypoints={waypoints}
        mapState={mapState}
        onMapStateChange={setMapState}
        onAddWaypoint={addWaypoint}
        onDeleteWaypoint={deleteWaypoint}
        onUpdateWaypoint={updateWaypoint}
        onGoToWaypoint={goToWaypoint}
        onApplyTemplate={applyTemplate}
        onExport={exportClipboard}
        onTogglePreview={() => setPreviewing((p) => !p)}
        previewing={previewing}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
        totalDuration={total}
      />

      {/* Toast */}
      {toast ? (
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-md border border-line/30 bg-bg/90 px-4 py-2 text-caption text-fg/90 backdrop-blur-md">
          {toast}
        </div>
      ) : null}

      {/* Help bar */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-center">
        <div className="mb-3 rounded-full border border-line/20 bg-bg/70 px-4 py-1 font-mono text-caption text-muted/80 backdrop-blur-md">
          R add · Space preview · E export · Backspace del · WASD move · QE up/down · arrows look · Shift 5× · Alt 0.1×
        </div>
      </div>
    </main>
  );
}

/**
 * LiveReadout — editable inline number inputs for camera position + lookAt.
 * Local state during editing; commits to camera on Enter / blur.
 */
function LiveReadout({
  readout,
  onSnap,
}: {
  readout: CameraReadout;
  onSnap: (next: CameraReadout) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<CameraReadout>(readout);

  // Sync draft when readout changes (and not actively editing)
  useEffect(() => {
    if (!editing) setDraft(readout);
  }, [readout, editing]);

  const commit = () => {
    onSnap(draft);
    setEditing(false);
  };

  const axisInput = (
    field: "position" | "lookAt",
    axis: 0 | 1 | 2,
  ) => (
    <input
      type="number"
      step={0.05}
      value={draft[field][axis]}
      onFocus={() => setEditing(true)}
      onChange={(e) => {
        const v = e.target.value === "" || e.target.value === "-" ? 0 : parseFloat(e.target.value);
        const next = [...draft[field]] as [number, number, number];
        next[axis] = isNaN(v) ? 0 : v;
        setDraft({ ...draft, [field]: next });
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        }
      }}
      onBlur={commit}
      className="w-16 rounded border border-line/25 bg-bg/45 px-1 py-0.5 font-mono text-[11px] text-fg/90"
    />
  );

  return (
    <div className="pointer-events-auto absolute left-4 top-16 z-10 space-y-1 rounded-md border border-line/20 bg-bg/70 px-3 py-2 font-mono text-caption backdrop-blur-md">
      <div className="flex items-center gap-1.5">
        <span className="w-10 text-muted/85">pos</span>
        {axisInput("position", 0)}
        {axisInput("position", 1)}
        {axisInput("position", 2)}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-10 text-muted/85">look</span>
        {axisInput("lookAt", 0)}
        {axisInput("lookAt", 1)}
        {axisInput("lookAt", 2)}
      </div>
    </div>
  );
}

function cryptoRandom(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `wp-${Math.random().toString(36).slice(2, 10)}`;
}
