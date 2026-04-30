/**
 * Preset trajectory templates — starter waypoints for common camera moves.
 * Author selects a template, then tweaks waypoints to taste.
 *
 * 6 presets cover the most common cinema moves:
 *   - ground-hold:   贴地静止
 *   - ground-dolly:  贴地前推
 *   - lift-to-god:   抬升至 god view
 *   - orbit:         高空环绕
 *   - push-in:       主体推近
 *   - bird-eye:      俯瞰揭示
 */

import type { TrajectoryTemplate } from "./trajectoryTypes";

export const TRAJECTORY_TEMPLATES: TrajectoryTemplate[] = [
  {
    id: "ground-hold",
    name: "街道平视 hold",
    description: "Y=0.05 贴地静止 5s · 适合 paradox / 开场 hold",
    waypoints: [
      {
        position: [0, 0.05, 4],
        lookAt: [0, 0.05, 0],
        mapState: { mode: "matte", dim: 0.5, overlay: "none" },
        durationToNext: 5,
        label: "ground hold start",
      },
    ],
  },
  {
    id: "ground-dolly",
    name: "街道前推",
    description: "Y=0.05 / Z 4→2 forward dolly 4s · 沿街道走几步",
    waypoints: [
      {
        position: [0, 0.05, 4],
        lookAt: [0, 0.05, 0],
        mapState: { mode: "matte", dim: 0.5, overlay: "none" },
        durationToNext: 4,
        label: "ground dolly start",
      },
      {
        position: [0, 0.05, 2],
        lookAt: [0, 0.05, 0],
        mapState: { mode: "matte", dim: 0.5, overlay: "none" },
        durationToNext: 0,
        label: "ground dolly end",
      },
    ],
  },
  {
    id: "lift-to-god",
    name: "抬升至 god view",
    description: "any → [0, 12, 12] 6s · 从街道升到俯瞰",
    waypoints: [
      {
        position: [0, 0.05, 2],
        lookAt: [0, 0, 0],
        mapState: { mode: "blueprint", dim: 0.5, overlay: "agents_trajectories" },
        durationToNext: 6,
        label: "lift start",
      },
      {
        position: [0, 12, 12],
        lookAt: [0, 0, 0],
        mapState: { mode: "blueprint", dim: 0.5, overlay: "agents_trajectories" },
        durationToNext: 0,
        label: "lift end (god)",
      },
    ],
  },
  {
    id: "orbit",
    name: "高空环绕",
    description: "Y=8 around origin 8s · 三 waypoint 1/4 圆弧",
    waypoints: [
      {
        position: [8, 8, 0],
        lookAt: [0, 0, 0],
        mapState: { mode: "blueprint", dim: 0.6, overlay: "agents_trajectories" },
        durationToNext: 4,
        label: "orbit east",
      },
      {
        position: [0, 8, 8],
        lookAt: [0, 0, 0],
        mapState: { mode: "blueprint", dim: 0.6, overlay: "agents_trajectories" },
        durationToNext: 4,
        label: "orbit south",
      },
      {
        position: [-8, 8, 0],
        lookAt: [0, 0, 0],
        mapState: { mode: "blueprint", dim: 0.6, overlay: "agents_trajectories" },
        durationToNext: 0,
        label: "orbit west",
      },
    ],
  },
  {
    id: "push-in",
    name: "主体推近",
    description: "Z 远→近 push-in 3s · 拉近聚焦",
    waypoints: [
      {
        position: [0, 4, 8],
        lookAt: [0, 0, 0],
        mapState: { mode: "matte", dim: 0.7, overlay: "none" },
        durationToNext: 3,
        label: "push-in start",
      },
      {
        position: [0, 2, 3],
        lookAt: [0, 0, 0],
        mapState: { mode: "matte", dim: 0.7, overlay: "none" },
        durationToNext: 0,
        label: "push-in end",
      },
    ],
  },
  {
    id: "bird-eye",
    name: "俯瞰揭示",
    description: "Y=14 look down 4s · digital silos heatmap reveal",
    waypoints: [
      {
        position: [0, 14, 0.001],
        lookAt: [0, 0, 0],
        mapState: { mode: "blueprint", dim: 0.8, overlay: "digital_silos_heatmap" },
        durationToNext: 4,
        label: "bird-eye hold",
      },
    ],
  },
];

export function findTemplateById(id: string): TrajectoryTemplate | undefined {
  return TRAJECTORY_TEMPLATES.find((t) => t.id === id);
}
