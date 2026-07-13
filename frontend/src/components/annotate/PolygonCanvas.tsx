"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Konva from "konva";
import { Circle, Image as KonvaImage, Layer, Line, Stage } from "react-konva";
import { Check, Download, Minus, Plus, RotateCcw, Undo2, X, ZoomIn } from "lucide-react";

import { api } from "@/lib/api";
import type { Polygon, PolygonPoint, UploadedImage } from "@/types";

type Props = {
  image: UploadedImage;
  imageUrl: string;
  onImageChange: (image: UploadedImage) => void;
};

const COLORS = ["#0f766e", "#dc2626", "#2563eb", "#9333ea", "#ca8a04"];
const MIN_SCALE = 0.25;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.2;

export function PolygonCanvas({ image, imageUrl, onImageChange }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);

  const [htmlImage, setHtmlImage] = useState<HTMLImageElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(720);
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  const [draftPoints, setDraftPoints] = useState<PolygonPoint[]>([]);
  const [selectedPolygonId, setSelectedPolygonId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // ── Load image ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => setHtmlImage(img);
    img.onerror = () => setError("This image could not be loaded into the canvas.");
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl]);

  // ── Watch container width ───────────────────────────────────────────────────
  useEffect(() => {
    const element = wrapRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(Math.max(320, Math.floor(entry.contentRect.width)));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Natural canvas size (before zoom)
  const baseHeight = useMemo(() => {
    if (!htmlImage) return 420;
    return Math.max(260, Math.round(containerWidth * (htmlImage.naturalHeight / htmlImage.naturalWidth)));
  }, [htmlImage, containerWidth]);

  // Visible stage size (the container clips the canvas)
  const stageWidth = containerWidth;
  const stageHeight = baseHeight;

  // ── Zoom helpers ────────────────────────────────────────────────────────────
  // Always zoom centred on the middle of the stage.
  function zoom(delta: number) {
    setScale((prev) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev + delta));
      // Reposition so the image centre stays at the stage centre.
      setStagePos({
        x: (stageWidth  / 2) * (1 - next),
        y: (stageHeight / 2) * (1 - next),
      });
      return next;
    });
  }

  function resetZoom() {
    setScale(1);
    setStagePos({ x: 0, y: 0 });
  }

  // ── Point helpers ───────────────────────────────────────────────────────────
  // Convert normalised [0,1] → canvas pixels, accounting for zoom/pan
  function toStagePoints(points: PolygonPoint[]) {
    return points.flatMap((p) => [p.x * containerWidth, p.y * baseHeight]);
  }

  function handleStageClick(e: Konva.KonvaEventObject<MouseEvent>) {
    if (isSaving) return;
    const stage = e.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;

    // Convert pointer (in stage viewport coords) back to image coords
    const imgX = (pointer.x - stagePos.x) / scale;
    const imgY = (pointer.y - stagePos.y) / scale;

    setDraftPoints((cur) => [
      ...cur,
      {
        x: clamp(imgX / containerWidth),
        y: clamp(imgY / baseHeight),
      },
    ]);
  }

  // ── Save polygon ────────────────────────────────────────────────────────────
  async function savePolygon() {
    if (draftPoints.length < 3) {
      setError("A polygon needs at least three points.");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      const response = await api.post<Polygon>("/polygons/", {
        image: image.id,
        points: draftPoints,
        color: COLORS[image.polygons.length % COLORS.length],
        label: `Polygon ${image.polygons.length + 1}`,
      });
      onImageChange({ ...image, polygons: [...image.polygons, response.data] });
      setDraftPoints([]);
    } catch {
      setError("Polygon could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  // ── Delete polygon ──────────────────────────────────────────────────────────
  async function deletePolygon(polygonId: number) {
    setError("");
    try {
      await api.delete(`/polygons/${polygonId}/`);
      onImageChange({
        ...image,
        polygons: image.polygons.filter((p) => p.id !== polygonId),
      });
      setSelectedPolygonId(null);
    } catch {
      setError("Polygon could not be removed.");
    }
  }

  // ── Download annotated image ────────────────────────────────────────────────
  function downloadAnnotated() {
    if (!stageRef.current) return;

    // Temporarily reset zoom so the exported image is at 1:1 scale
    const stage = stageRef.current;
    const prevScale = stage.scaleX();
    const prevX = stage.x();
    const prevY = stage.y();

    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    stage.batchDraw();

    const dataUrl = stage.toDataURL({ pixelRatio: 2 });

    // Restore zoom
    stage.scale({ x: prevScale, y: prevScale });
    stage.position({ x: prevX, y: prevY });
    stage.batchDraw();

    // Trigger browser download
    const link = document.createElement("a");
    link.download = `annotated_${image.name || `image_${image.id}`}`;
    link.href = dataUrl;
    link.click();
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      {/* Canvas area */}
      <div>
        {/* Zoom toolbar */}
        <div className="mb-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => zoom(-ZOOM_STEP)}
            className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            title="Zoom out"
          >
            <Minus size={15} />
          </button>
          <span className="min-w-[48px] text-center text-sm text-slate-600">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => zoom(ZOOM_STEP)}
            className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            title="Zoom in"
          >
            <Plus size={15} />
          </button>
          <button
            type="button"
            onClick={resetZoom}
            className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            title="Reset zoom"
          >
            <ZoomIn size={15} />
          </button>
          <span className="ml-2 text-xs text-slate-400">Click image to place points</span>
        </div>

        {/* Stage */}
        <div
          ref={wrapRef}
          className="overflow-hidden rounded-md border border-slate-200 bg-slate-100"
          style={{ height: stageHeight }}
        >
          <Stage
            ref={stageRef}
            width={stageWidth}
            height={stageHeight}
            scaleX={scale}
            scaleY={scale}
            x={stagePos.x}
            y={stagePos.y}
            onClick={handleStageClick}
            draggable={scale > 1}
            onDragEnd={(e) => setStagePos({ x: e.target.x(), y: e.target.y() })}
          >
            <Layer>
              {htmlImage ? (
                <KonvaImage image={htmlImage} width={containerWidth} height={baseHeight} />
              ) : null}

              {/* Saved polygons */}
              {image.polygons.map((polygon) => {
                const selected = selectedPolygonId === polygon.id;
                return (
                  <Line
                    key={polygon.id}
                    points={toStagePoints(polygon.points)}
                    closed
                    fill={`${polygon.color || "#0f766e"}33`}
                    stroke={polygon.color || "#0f766e"}
                    strokeWidth={selected ? 4 : 2}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      setSelectedPolygonId(polygon.id);
                    }}
                  />
                );
              })}

              {/* Draft polygon */}
              {draftPoints.length > 0 ? (
                <Line
                  points={toStagePoints(draftPoints)}
                  stroke="#0f172a"
                  strokeWidth={2}
                  dash={[8, 6]}
                  closed={draftPoints.length > 2}
                />
              ) : null}
              {draftPoints.map((point, index) => (
                <Circle
                  key={`${point.x}-${point.y}-${index}`}
                  x={point.x * containerWidth}
                  y={point.y * baseHeight}
                  radius={5}
                  fill="#0f172a"
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              ))}
            </Layer>
          </Stage>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="flex min-h-[260px] flex-col rounded-md border border-slate-200 bg-white p-4">
        <div>
          <h2 className="font-semibold text-slate-950">{image.name || `Image ${image.id}`}</h2>
          <p className="mt-1 text-sm text-slate-500">{image.polygons.length} saved polygon{image.polygons.length !== 1 ? "s" : ""}</p>
        </div>

        {/* Drawing controls */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setDraftPoints((cur) => cur.slice(0, -1))}
            disabled={draftPoints.length === 0 || isSaving}
            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            title="Undo last point"
          >
            <Undo2 size={16} />
          </button>
          <button
            type="button"
            onClick={() => setDraftPoints([])}
            disabled={draftPoints.length === 0 || isSaving}
            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            title="Clear draft"
          >
            <RotateCcw size={16} />
          </button>
          <button
            type="button"
            onClick={() => void savePolygon()}
            disabled={draftPoints.length < 3 || isSaving}
            className="inline-flex h-9 items-center justify-center rounded-md bg-slate-950 text-white hover:bg-teal-800 disabled:opacity-40"
            title="Save polygon"
          >
            <Check size={16} />
          </button>
        </div>

        {draftPoints.length > 0 ? (
          <p className="mt-3 text-sm text-slate-500">Draft: {draftPoints.length} point{draftPoints.length !== 1 ? "s" : ""}</p>
        ) : null}

        {error ? (
          <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}

        {/* Download button */}
        <button
          type="button"
          onClick={downloadAnnotated}
          disabled={!htmlImage}
          className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-md border border-teal-600 text-sm font-semibold text-teal-700 hover:bg-teal-50 disabled:opacity-40"
          title="Download annotated image"
        >
          <Download size={15} />
          Download annotated
        </button>

        {/* Polygon list */}
        <div className="mt-4 flex-1 space-y-2 overflow-y-auto">
          {image.polygons.length === 0 ? (
            <p className="text-sm text-slate-500">Click the image to place points, then save.</p>
          ) : null}
          {image.polygons.map((polygon) => (
            <div
              key={polygon.id}
              className={`flex items-center justify-between gap-3 rounded-md border p-3 text-sm ${
                selectedPolygonId === polygon.id
                  ? "border-teal-500 bg-teal-50"
                  : "border-slate-200"
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedPolygonId(polygon.id)}
                className="min-w-0 text-left"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 shrink-0 rounded-full"
                    style={{ background: polygon.color || "#0f766e" }}
                  />
                  <span className="block truncate font-medium text-slate-950">
                    {polygon.label || `Polygon ${polygon.id}`}
                  </span>
                </span>
                <span className="mt-0.5 block text-slate-500">{polygon.points.length} points</span>
              </button>
              <button
                type="button"
                onClick={() => void deletePolygon(polygon.id)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                aria-label="Remove polygon"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}
