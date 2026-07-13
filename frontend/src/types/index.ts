export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
};

export type Task = {
  id: number;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  task_date: string;
  due_date: string | null;
  tags: string[];
  order: number;
  created_at: string;
  updated_at: string;
};

export type PolygonPoint = {
  x: number;
  y: number;
};

export type Polygon = {
  id: number;
  image: number;
  points: PolygonPoint[];
  color: string;
  label: string;
  created_at: string;
};

export type UploadedImage = {
  id: number;
  image: string;
  name: string;
  uploaded_at: string;
  polygons: Polygon[];
};
