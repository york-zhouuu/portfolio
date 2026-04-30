"use client";

import { useState } from "react";
import {
  type DevMapMode,
  type DevMapOverlay,
  type DevMapState,
  type Waypoint,
} from "@/lib/cinema/trajectoryTypes";
import { TRAJECTORY_TEMPLATES } from "@/lib/cinema/trajectoryTemplates";

type Props = {
  waypoints: Waypoint[];
  mapState: DevMapState;
  onMapStateChange: (next: DevMapState) => void;
  onAddWaypoint: () => void;
  onDeleteWaypoint: (id: string) => void;
  onUpdateWaypoint: (id: string, patch: Partial<Waypoint>) => void;
  onGoToWaypoint: (id: string) => void;
  onApplyTemplate: (id: string) => void;
  onExport: () => void;
  onTogglePreview: () => void;
  previewing: boolean;
  selectedIndex: number | null;
  onSelect: (idx: number | null) => void;
  totalDuration: number;
};

const MAP_MODES: DevMapMode[] = ["matte", "blueprint"];
const MAP_OVERLAYS: DevMapOverlay[] = ["none", "agents_trajectories", "digital_silos_heatmap"];

export function RecorderPanel({
  waypoints,
  mapState,
  onMapStateChange,
  onAddWaypoint,
  onDeleteWaypoint,
  onUpdateWaypoint,
  onGoToWaypoint,
  onApplyTemplate,
  onExport,
  onTogglePreview,
  previewing,
  selectedIndex,
  onSelect,
  totalDuration,
}: Props) {
  const [templateId, setTemplateId] = useState<string>("");
  const [confirmTemplate, setConfirmTemplate] = useState<string | null>(null);

  return (
    <aside className="pointer-events-auto absolute right-4 top-16 z-10 flex max-h-[calc(100vh-7rem)] w-[360px] flex-col gap-4 overflow-y-auto rounded-2xl border border-line/20 bg-bg/72 p-4 backdrop-blur-xl">
      {/* Templates */}
      <Section title="Templates">
        <div className="flex gap-2">
          <select
            className="flex-1 rounded-md border border-line/25 bg-bg/60 px-2 py-1.5 text-caption text-fg/90"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
          >
            <option value="">— select —</option>
            {TRAJECTORY_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button
            className="rounded-md border border-line/30 bg-bg/40 px-3 py-1.5 text-caption text-fg/90 disabled:opacity-40"
            onClick={() => {
              if (!templateId) return;
              if (waypoints.length > 0) setConfirmTemplate(templateId);
              else {
                onApplyTemplate(templateId);
                setTemplateId("");
              }
            }}
            disabled={!templateId}
          >
            Load
          </button>
        </div>
        {templateId && (
          <p className="mt-1.5 text-caption text-muted/70">
            {TRAJECTORY_TEMPLATES.find((t) => t.id === templateId)?.description}
          </p>
        )}
        {confirmTemplate && (
          <div className="mt-2 rounded-md border border-line/30 bg-bg/50 p-2 text-caption text-fg/85">
            <p className="mb-2">Replace existing {waypoints.length} waypoint(s)?</p>
            <div className="flex gap-2">
              <button
                className="rounded border border-line/30 bg-bg/40 px-2 py-1"
                onClick={() => {
                  onApplyTemplate(confirmTemplate);
                  setConfirmTemplate(null);
                  setTemplateId("");
                }}
              >
                Replace
              </button>
              <button
                className="rounded border border-line/30 px-2 py-1"
                onClick={() => setConfirmTemplate(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Section>

      {/* MapState controls */}
      <Section title="MapState (live)">
        <Row label="mode">
          <select
            className="flex-1 rounded-md border border-line/25 bg-bg/60 px-2 py-1 text-caption text-fg/90"
            value={mapState.mode}
            onChange={(e) =>
              onMapStateChange({ ...mapState, mode: e.target.value as DevMapMode })
            }
          >
            {MAP_MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Row>
        <Row label={`dim ${mapState.dim.toFixed(2)}`}>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={mapState.dim}
            onChange={(e) =>
              onMapStateChange({ ...mapState, dim: parseFloat(e.target.value) })
            }
            className="flex-1"
          />
        </Row>
        <Row label="overlay">
          <select
            className="flex-1 rounded-md border border-line/25 bg-bg/60 px-2 py-1 text-caption text-fg/90"
            value={mapState.overlay}
            onChange={(e) =>
              onMapStateChange({ ...mapState, overlay: e.target.value as DevMapOverlay })
            }
          >
            {MAP_OVERLAYS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </Row>
      </Section>

      {/* Waypoints */}
      <Section title={`Waypoints (${waypoints.length})  ·  ${totalDuration.toFixed(1)}s`}>
        {waypoints.length === 0 ? (
          <p className="text-caption text-muted/70">
            No waypoints. Press <kbd className="font-mono">R</kbd> or click Add.
          </p>
        ) : (
          <ul className="space-y-2">
            {waypoints.map((w, i) => (
              <li
                key={w.id}
                className={`rounded-md border px-2 py-1.5 text-caption ${
                  selectedIndex === i
                    ? "border-fg/40 bg-bg/65"
                    : "border-line/20 bg-bg/35 hover:bg-bg/50"
                }`}
                onClick={() => onSelect(i)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-fg/85">
                    [{i + 1}] {w.label ?? "—"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      className="rounded border border-line/30 bg-bg/40 px-1.5 py-0 font-mono text-[10px] text-fg/85 hover:bg-bg/60"
                      onClick={(e) => {
                        e.stopPropagation();
                        onGoToWaypoint(w.id);
                      }}
                      aria-label="Go to waypoint"
                      title="Camera fly to this waypoint"
                    >
                      ▶ Go
                    </button>
                    <button
                      className="text-muted/80 hover:text-fg/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteWaypoint(w.id);
                      }}
                      aria-label="Delete waypoint"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="mt-1 font-mono text-caption text-fg/70">
                  pos&nbsp;&nbsp;[{w.position.map(fmt).join(", ")}]
                </div>
                <div className="font-mono text-caption text-fg/70">
                  look [{w.lookAt.map(fmt).join(", ")}]
                </div>
                <div className="mt-1 font-mono text-caption text-muted/80">
                  {w.mapState.mode} · dim {w.mapState.dim.toFixed(2)} · {w.mapState.overlay}
                </div>
                {selectedIndex === i ? (
                  <WaypointEditor waypoint={w} onUpdate={onUpdateWaypoint} />
                ) : (
                  <div className="mt-1 font-mono text-caption text-muted/80">
                    duration → next: {w.durationToNext.toFixed(1)}s
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button
          className="rounded-md border border-line/30 bg-bg/40 px-3 py-2 text-caption text-fg/90 hover:bg-bg/55"
          onClick={onAddWaypoint}
        >
          + Add waypoint <span className="font-mono text-muted/70">(R)</span>
        </button>
        <button
          className="rounded-md border border-line/30 bg-bg/40 px-3 py-2 text-caption text-fg/90 hover:bg-bg/55 disabled:opacity-40"
          onClick={onTogglePreview}
          disabled={waypoints.length < 2}
        >
          {previewing ? "■ Stop preview" : "▶ Preview"} <span className="font-mono text-muted/70">(Space)</span>
        </button>
        <button
          className="rounded-md border border-line/30 bg-bg/40 px-3 py-2 text-caption text-fg/90 hover:bg-bg/55 disabled:opacity-40"
          onClick={onExport}
          disabled={waypoints.length === 0}
        >
          ⎘ Export YAML <span className="font-mono text-muted/70">(E)</span>
        </button>
      </div>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-1.5 font-mono text-caption uppercase tracking-[0.18em] text-muted/85">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1.5 flex items-center gap-2">
      <span className="w-20 font-mono text-caption text-muted/85">{label}</span>
      {children}
    </div>
  );
}

function WaypointEditor({
  waypoint,
  onUpdate,
}: {
  waypoint: Waypoint;
  onUpdate: (id: string, patch: Partial<Waypoint>) => void;
}) {
  const updateAxis = (
    field: "position" | "lookAt",
    axis: 0 | 1 | 2,
    value: string,
  ) => {
    const next = [...waypoint[field]] as [number, number, number];
    const parsed = value === "" || value === "-" ? 0 : parseFloat(value);
    next[axis] = isNaN(parsed) ? 0 : parsed;
    onUpdate(waypoint.id, { [field]: next });
  };
  const axisInput = (field: "position" | "lookAt", axis: 0 | 1 | 2) => (
    <input
      type="number"
      step={0.05}
      value={waypoint[field][axis]}
      onChange={(e) => updateAxis(field, axis, e.target.value)}
      className="w-16 rounded border border-line/30 bg-bg/55 px-1 py-0.5 font-mono text-caption text-fg/90"
      onClick={(e) => e.stopPropagation()}
    />
  );

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span className="w-12 font-mono text-caption text-muted/85">pos</span>
        {axisInput("position", 0)}
        {axisInput("position", 1)}
        {axisInput("position", 2)}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-12 font-mono text-caption text-muted/85">look</span>
        {axisInput("lookAt", 0)}
        {axisInput("lookAt", 1)}
        {axisInput("lookAt", 2)}
      </div>
      <div className="flex items-center gap-2">
        <span className="w-12 font-mono text-caption text-muted/85">dur</span>
        <input
          type="number"
          min={0}
          max={60}
          step={0.5}
          value={waypoint.durationToNext}
          onChange={(e) =>
            onUpdate(waypoint.id, { durationToNext: parseFloat(e.target.value) || 0 })
          }
          onClick={(e) => e.stopPropagation()}
          className="w-20 rounded border border-line/30 bg-bg/55 px-2 py-0.5 font-mono text-caption text-fg/90"
        />
        <span className="font-mono text-caption text-muted/85">s</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-12 font-mono text-caption text-muted/85">label</span>
        <input
          type="text"
          value={waypoint.label ?? ""}
          onChange={(e) => onUpdate(waypoint.id, { label: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 rounded border border-line/30 bg-bg/55 px-2 py-0.5 font-mono text-caption text-fg/90"
          placeholder="optional"
        />
      </div>
    </div>
  );
}

function fmt(n: number): string {
  return n.toFixed(2);
}
