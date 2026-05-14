import axios from "axios";

export type AuthUser = {
  id: number;
  username: string;
};

export type Task = {
  id: number;
  title: string;
  project: string;
  priority: "low" | "medium" | "high";
  due_date: string | null;
  completed: boolean;
};

export type DashboardSummary = {
  user: AuthUser;
  tasks: Task[];
  projects: Array<{
    name: string;
    total: number;
    completed: number;
  }>;
  stats: {
    total: number;
    completed: number;
    completion_rate: number;
    due_today: number;
    overdue: number;
    due_this_week: number;
    high_priority_total: number;
    high_priority_completed: number;
  };
};

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://127.0.0.1:5000",
});

// ---------------- AUTH TOKEN ----------------
export const setAuthToken = (token: string | null) => {
  if (token) {
    API.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common.Authorization;
  }
};

setAuthToken(localStorage.getItem("token"));

// ---------------- AUTH APIS ----------------
export const registerUser = (data: {
  username: string;
  email: string;
  password: string;
}) =>
  API.post<{ message: string }>("/register", data);

export const loginUser = (data: { username: string; password: string }) =>
  API.post<{ token: string; user: AuthUser }>("/login", data);

export const getProtected = () =>
  API.get<{ message: string; user: AuthUser }>("/protected");

// ---------------- TASK APIS ----------------
export const createTask = (data: {
  title: string;
  project?: string;
  priority?: Task["priority"];
  due_date?: string | null;
}) =>
  API.post<Task>("/tasks", data);

export const getTasks = () => API.get<Task[]>("/tasks");

export const updateTask = (
  taskId: number,
  data: {
    title?: string;
    project?: string;
    priority?: Task["priority"];
    due_date?: string | null;
    completed?: boolean;
  }
) => API.put<Task>(`/tasks/${taskId}`, data);

export const deleteTask = (taskId: number) =>
  API.delete<{ message: string }>(`/tasks/${taskId}`);

export const getDashboard = () => API.get<DashboardSummary>("/dashboard");

export default API;
