"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Edit3, Plus, Trash2, X } from "lucide-react";

import { AppShell } from "@/components/common/AppShell";
import { DateSelector } from "@/components/common/DateSelector";
import { api } from "@/lib/api";
import { useDateStore } from "@/store/date-store";
import type { Task, TaskPriority, TaskStatus } from "@/types";

const COLUMNS: Array<{ id: TaskStatus; title: string }> = [
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "done", title: "Done" },
];

type Draft = {
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
  tags: string;
};

const makeDraft = (status: TaskStatus = "todo"): Draft => ({
  title: "",
  status,
  priority: "medium",
  due_date: "",
  tags: "",
});

export default function TasksPage() {
  const selectedDate = useDateStore((state) => state.selectedDate);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draft, setDraft] = useState<Draft>(makeDraft());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  // ── Data fetching ──────────────────────────────────────────────────────────

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await api.get<Task[]>("/tasks/", {
        params: { date: selectedDate },
      });
      setTasks(response.data);
    } catch {
      setError("Tasks could not be loaded. Check that the Django server is running.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  // ── Modal helpers ──────────────────────────────────────────────────────────

  function openCreateModal(status: TaskStatus = "todo") {
    setEditingTask(null);
    setDraft(makeDraft(status));
    setError("");
    setIsModalOpen(true);
  }

  function openEditModal(task: Task) {
    setEditingTask(task);
    setDraft({
      title: task.title,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ?? "",
      tags: task.tags.join(", "),
    });
    setError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingTask(null);
    setDraft(makeDraft());
    setError("");
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────

  async function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = draft.title.trim();
    if (!title) {
      setError("Title cannot be empty.");
      return;
    }

    const payload = {
      title,
      status: draft.status,
      priority: draft.priority,
      task_date: selectedDate,
      due_date: draft.due_date || null,
      tags: draft.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    try {
      if (editingTask) {
        const response = await api.patch<Task>(`/tasks/${editingTask.id}/`, payload);
        setTasks((prev) =>
          prev.map((t) => (t.id === response.data.id ? response.data : t))
        );
      } else {
        const response = await api.post<Task>("/tasks/", payload);
        setTasks((prev) => [...prev, response.data]);
      }
      closeModal();
    } catch {
      setError("Could not save the task. Please check the backend is running.");
    }
  }

  async function deleteTask(taskId: number) {
    try {
      await api.delete(`/tasks/${taskId}/`);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch {
      setError("Task could not be deleted.");
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const taskId = Number(event.active.id);
    const nextStatus = event.over?.id as TaskStatus | undefined;
    const task = tasks.find((t) => t.id === taskId);

    if (!task || !nextStatus || task.status === nextStatus) return;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t))
    );

    try {
      const response = await api.patch<Task>(`/tasks/${taskId}/`, {
        status: nextStatus,
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? response.data : t))
      );
    } catch {
      // Rollback
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: task.status } : t))
      );
      setError("Drag failed. Task was restored.");
    }
  }

  // ── Grouped tasks ──────────────────────────────────────────────────────────

  const taskGroups = useMemo(
    () =>
      COLUMNS.reduce<Record<TaskStatus, Task[]>>(
        (acc, col) => ({
          ...acc,
          [col.id]: tasks.filter((t) => t.status === col.id),
        }),
        { todo: [], in_progress: [], done: [] }
      ),
    [tasks]
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
              Task board
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-950">Daily Kanban</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <DateSelector />
            <button
              type="button"
              onClick={() => openCreateModal("todo")}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-teal-800 transition"
            >
              <Plus size={18} aria-hidden="true" />
              Add task
            </button>
          </div>
        </div>

        {/* Global error banner */}
        {error && !isModalOpen ? (
          <p className="mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        {/* Kanban board */}
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <section className="mt-6 grid gap-4 lg:grid-cols-3">
            {COLUMNS.map((col) => (
              <TaskColumn
                key={col.id}
                id={col.id}
                title={col.title}
                tasks={taskGroups[col.id]}
                isLoading={isLoading}
                onEdit={openEditModal}
                onDelete={deleteTask}
                onAdd={() => openCreateModal(col.id)}
              />
            ))}
          </section>
        </DndContext>
      </main>

      {/* Task modal */}
      {isModalOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <form
            onSubmit={saveTask}
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-950">
                {editingTask ? "Edit task" : "Add task"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-slate-100"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Title */}
            <label className="mt-5 block text-sm font-medium text-slate-700">
              Title <span className="text-rose-500">*</span>
              <input
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="What needs to be done?"
                className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-teal-600"
                required
                autoFocus
              />
            </label>

            {/* Status + Priority */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Column / Status
                <select
                  value={draft.status}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, status: e.target.value as TaskStatus }))
                  }
                  className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-teal-600"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Priority
                <select
                  value={draft.priority}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, priority: e.target.value as TaskPriority }))
                  }
                  className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-teal-600"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
            </div>

            {/* Due / Finished date */}
            <label className="mt-4 block text-sm font-medium text-slate-700">
              {draft.status === "done" ? "Finished date" : "Due date"}{" "}
              <span className="text-slate-400">(optional)</span>
              <input
                type="date"
                value={draft.due_date}
                onChange={(e) => setDraft((d) => ({ ...d, due_date: e.target.value }))}
                className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-teal-600"
              />
            </label>

            {/* Tags */}
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Tags <span className="text-slate-400">(comma-separated, optional)</span>
              <input
                value={draft.tags}
                onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))}
                placeholder="design, urgent, frontend"
                className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-teal-600"
              />
            </label>

            {/* Modal error */}
            {error ? (
              <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            ) : null}

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="h-10 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-10 rounded-md bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-teal-800 transition"
              >
                {editingTask ? "Save changes" : "Add task"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </AppShell>
  );
}

// ── TaskColumn ────────────────────────────────────────────────────────────────

function TaskColumn({
  id,
  title,
  tasks,
  isLoading,
  onEdit,
  onDelete,
  onAdd,
}: {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  isLoading: boolean;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onAdd: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[480px] flex-col rounded-xl border p-3 transition ${
        isOver ? "border-teal-400 bg-teal-50" : "border-slate-200 bg-white"
      }`}
    >
      {/* Column header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-slate-950">{title}</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
            {tasks.length}
          </span>
        </div>
        {/* Per-column add button */}
        <button
          type="button"
          onClick={onAdd}
          className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-teal-700 transition"
          aria-label={`Add task to ${title}`}
          title={`Add to ${title}`}
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Tasks */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-400">
            Loading…
          </p>
        ) : null}

        {!isLoading && tasks.length === 0 ? (
          <button
            type="button"
            onClick={onAdd}
            className="rounded-md border border-dashed border-slate-200 p-4 text-sm text-slate-400 hover:border-teal-400 hover:text-teal-600 transition text-left"
          >
            + Nothing here yet — click to add
          </button>
        ) : null}

        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

// ── TaskCard ──────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onEdit,
  onDelete,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id });
  const style = { transform: CSS.Translate.toString(transform) };

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-slate-950">{task.title}</h3>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${priorityClass(task.priority)}`}>
          {task.priority}
        </span>
      </div>

      {task.due_date ? (
        <p className="mt-1 text-xs text-slate-400">
          {task.status === "done" ? "Finished" : "Due"} {task.due_date}
        </p>
      ) : null}

      {task.tags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex justify-end gap-1">
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-950 transition"
          aria-label="Edit task"
        >
          <Edit3 size={15} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
          aria-label="Delete task"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </article>
  );
}

function priorityClass(priority: TaskPriority) {
  if (priority === "high") return "bg-rose-100 text-rose-700";
  if (priority === "low") return "bg-slate-100 text-slate-600";
  return "bg-amber-100 text-amber-700";
}
