"use client";

import dynamic from "next/dynamic";
import { ChangeEvent, FormEvent, useCallback, useState } from "react";
import { History, ImagePlus, RefreshCw, Trash2 } from "lucide-react";

import { AppShell } from "@/components/common/AppShell";
import { api } from "@/lib/api";
import type { UploadedImage } from "@/types";

const PolygonCanvas = dynamic(
  () => import("@/components/annotate/PolygonCanvas").then((mod) => mod.PolygonCanvas),
  {
    ssr: false,
    loading: () => <div className="min-h-[420px] rounded-md bg-slate-100" />,
  },
);

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api").replace(/\/api\/?$/, "");

export default function AnnotatePage() {
  // Start with no images — user sees a clean workspace on every login
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingPrev, setIsLoadingPrev] = useState(false);
  const [showingPrevious, setShowingPrevious] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // ── Upload ────────────────────────────────────────────────────────────────

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
  }

  async function uploadImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Choose an image first.");
      return;
    }

    const data = new FormData();
    data.append("image", file);

    setIsUploading(true);
    setError("");
    try {
      const response = await api.post<UploadedImage>("/images/", data);
      // Append the new image — all images in this session stay visible
      setImages((current) => [response.data, ...current]);
      setShowingPrevious(false);
      setFile(null);
    } catch {
      setError("Upload failed. Try a PNG, JPG, GIF, or WebP image.");
    } finally {
      setIsUploading(false);
    }
  }

  // ── Load previous images ────────────────────────────────────────────────

  const loadPreviousImages = useCallback(async () => {
    setIsLoadingPrev(true);
    setError("");
    try {
      const response = await api.get<UploadedImage[]>("/images/archived/");
      if (response.data.length === 0) {
        setError("No previous images found.");
      } else {
        setImages(response.data);
        setShowingPrevious(true);
      }
    } catch {
      setError("Could not load previous images. Check that the Django server is running.");
    } finally {
      setIsLoadingPrev(false);
    }
  }, []);

  // ── Delete ────────────────────────────────────────────────────────────────

  async function deleteImage(imageId: number) {
    try {
      await api.delete(`/images/${imageId}/`);
      setImages((current) => current.filter((image) => image.id !== imageId));
    } catch {
      setError("Image could not be deleted.");
    }
  }

  function updateImage(updatedImage: UploadedImage) {
    setImages((current) =>
      current.map((image) => (image.id === updatedImage.id ? updatedImage : image))
    );
  }

  // ── Refresh ───────────────────────────────────────────────────────────────

  function handleRefresh() {
    setRefreshKey((k) => k + 1);
    // Refreshes the canvas state but keeps the current images list intact
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Annotation</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Image workspace</h1>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={17} aria-hidden="true" />
            Refresh
          </button>
        </div>

        {/* Upload bar */}
        <form
          onSubmit={uploadImage}
          className="mt-6 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
        >
          <label className="flex flex-1 items-center gap-3 rounded-md border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 cursor-pointer hover:border-teal-400 transition">
            <ImagePlus size={19} className="text-teal-700 shrink-0" aria-hidden="true" />
            <span className="min-w-0 truncate">{file ? file.name : "Choose image to upload"}</span>
            <input type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
          </label>
          <button
            type="submit"
            disabled={isUploading}
            className="h-11 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60 transition"
          >
            {isUploading ? "Uploading..." : "Upload"}
          </button>
          <button
            type="button"
            onClick={() => void loadPreviousImages()}
            disabled={isLoadingPrev}
            className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition"
          >
            <History size={17} aria-hidden="true" />
            {isLoadingPrev ? "Loading..." : "Previous images"}
          </button>
        </form>

        {error ? (
          <p className="mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
        ) : null}

        {/* Empty state */}
        {images.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <ImagePlus size={36} className="mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No image loaded</p>
            <p className="mt-1 text-xs text-slate-400">
              Upload a new image or click <strong>Previous images</strong> to restore your last session.
            </p>
          </div>
        ) : (
          /* Single card containing all images — scrollable */
          <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
            {showingPrevious && (
              <div className="flex items-center gap-2 rounded-t-xl border-b border-slate-100 bg-amber-50 px-5 py-3 text-sm text-amber-700">
                <History size={15} />
                Showing previous session images (read-only view)
              </div>
            )}

            <div className="divide-y divide-slate-100 overflow-y-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
              {images.map((image) => (
                <div key={image.id} className="p-5">
                  {/* Image header */}
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-slate-950">{image.name || `Image ${image.id}`}</h2>
                      <p className="mt-0.5 text-sm text-slate-500">Click on the image to add polygon points.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteImage(image.id)}
                      className="grid h-9 w-9 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-700 transition"
                      aria-label="Delete image"
                    >
                      <Trash2 size={17} aria-hidden="true" />
                    </button>
                  </div>

                  {/* Canvas */}
                  <PolygonCanvas
                    key={`${image.id}-${refreshKey}`}
                    image={image}
                    imageUrl={resolveImageUrl(image.image)}
                    onImageChange={updateImage}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </AppShell>
  );
}

function resolveImageUrl(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${API_ORIGIN}${url}`;
}
