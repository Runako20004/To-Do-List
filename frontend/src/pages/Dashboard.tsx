import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  Calendar,
  CheckCircle2,
  Flag,
  LayoutGrid,
  List,
  LogOut,
  Plus,
  Search,
  Settings,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  createTask,
  deleteTask,
  getDashboard,
  setAuthToken,
  Task,
  updateTask,
} from "../services/api";
import SharedLayout from "../components/SharedLayout";

type Priority = Task["priority"];

const priorityStyles: Record<Priority, string> = {
  high: "border-red-500 bg-red-50 text-red-700",
  medium: "border-amber-500 bg-amber-50 text-amber-700",
  low: "border-green-500 bg-green-50 text-green-700",
};

const todayKey = () => new Date().toISOString().slice(0, 10);

const formatDueDate = (value: string | null) => {
  if (!value) return "No due date";

  const today = todayKey();
  if (value === today) return "Due today";

  const dueDate = new Date(`${value}T00:00:00`);
  return dueDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<
    Array<{ name: string; total: number; completed: number }>
  >([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    completion_rate: 0,
    due_today: 0,
    overdue: 0,
    due_this_week: 0,
    high_priority_total: 0,
    high_priority_completed: 0,
  });
  const [username, setUsername] = useState("there");
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [project, setProject] = useState("General");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editTaskId, setEditTaskId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editProject, setEditProject] = useState("General");
  const [editPriority, setEditPriority] = useState<Priority>("medium");
  const [editDueDate, setEditDueDate] = useState("");
  const [editCompleted, setEditCompleted] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuthToken(null);
    navigate("/");
  }, [navigate]);

  const loadDashboard = useCallback(async () => {
    try {
      const response = await getDashboard();
      setTasks(response.data.tasks);
      setProjects(response.data.projects);
      setStats(response.data.stats);
      setUsername(response.data.user.username);
      setError("");
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      logout();
      return;
    }

    setAuthToken(token);
    loadDashboard();
  }, [loadDashboard, logout]);

  const filteredTasks = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tasks;

    return tasks.filter((task) =>
      [task.title, task.project, task.priority].some((value) =>
        value.toLowerCase().includes(term)
      )
    );
  }, [search, tasks]);

  const upcomingTasks = useMemo(
    () => tasks.filter((task) => !task.completed && task.due_date).slice(0, 3),
    [tasks]
  );

  const handleCreateTask = async (event: FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      setError("Task title is required");
      return;
    }

    setSaving(true);
    try {
      await createTask({
        title: title.trim(),
        project: project.trim() || "General",
        priority,
        due_date: dueDate || null,
      });
      setTitle("");
      setProject("General");
      setPriority("medium");
      setDueDate("");
      await loadDashboard();
    } catch {
      setError("Could not create task");
    } finally {
      setSaving(false);
    }
  };

  const toggleTask = async (task: Task) => {
    await updateTask(task.id, { completed: !task.completed });
    await loadDashboard();
  };

  const removeTask = async (taskId: number) => {
    await deleteTask(taskId);
    await loadDashboard();
  };

  const startEdit = (task: Task) => {
    setEditTaskId(task.id);
    setEditTitle(task.title);
    setEditProject(task.project);
    setEditPriority(task.priority);
    setEditDueDate(task.due_date || "");
    setEditCompleted(task.completed);
  };

  const cancelEdit = () => {
    setEditTaskId(null);
    setEditTitle("");
    setEditProject("General");
    setEditPriority("medium");
    setEditDueDate("");
    setEditCompleted(false);
  };

  const saveEdit = async (task: Task) => {
    if (!editTitle.trim()) return;
    const data: {
      title?: string;
      project?: string;
      priority?: Priority;
      due_date?: string | null;
      completed?: boolean;
    } = {};

    if (editTitle.trim() !== task.title) data.title = editTitle.trim();
    if (editProject.trim() !== task.project) data.project = editProject.trim() || "General";
    if (editPriority !== task.priority) data.priority = editPriority;
    if ((editDueDate || null) !== task.due_date) data.due_date = editDueDate || null;
    if (editCompleted !== task.completed) data.completed = editCompleted;

    if (Object.keys(data).length === 0) {
      cancelEdit();
      return;
    }

    setEditSaving(true);
    try {
      await updateTask(task.id, data);
      await loadDashboard();
      cancelEdit();
    } catch {
      setError("Could not update task");
    } finally {
      setEditSaving(false);
    }
  };

  if (loading) {
    return (
      <SharedLayout>
        <div className="flex min-h-screen items-center justify-center bg-[#f8f9ff] text-slate-700">
          Loading dashboard...
        </div>
      </SharedLayout>
    );
  }

  return (
    <SharedLayout>
      <div className="min-h-screen bg-[#f8f9ff] font-sans text-[#0b1c30]">
      <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-600 text-white">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-green-700">TaskManager</h1>
            <p className="text-sm text-gray-500">Productivity Suite</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <button className="flex w-full items-center gap-3 rounded-lg bg-green-100 px-4 py-3 font-semibold text-green-700">
            <CheckCircle2 size={20} />
            View Tasks
          </button>
          <button
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-gray-600 transition hover:bg-gray-100"
            onClick={() => document.getElementById("new-task-title")?.focus()}
          >
            <Plus size={20} />
            Add Task
          </button>
        </nav>

        <button
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-600 transition hover:bg-gray-100"
          onClick={logout}
        >
          <LogOut size={20} />
          Logout
        </button>
      </aside>

      <header className="fixed left-64 right-0 top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-[#eff4ff] px-8">
        <div className="flex w-[400px] items-center gap-3 rounded-full bg-white px-4 py-2 shadow-sm">
          <Search className="text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search tasks or projects..."
            className="w-full bg-transparent text-sm outline-none"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="flex items-center gap-4">
          <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-200">
            <Bell size={20} />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-200">
            <Settings size={20} />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-green-600 bg-white font-bold text-green-700">
            {username.slice(0, 1).toUpperCase()}
          </div>
        </div>
      </header>

      <main className="ml-64 px-8 pb-10 pt-24">
        <section className="mb-8">
          <h2 className="mb-2 text-5xl font-extrabold">Welcome back, {username}.</h2>
          <p className="text-lg text-gray-500">
            You have {stats.due_today} tasks due today and {stats.overdue} overdue.
          </p>
        </section>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          <section className="col-span-12 rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:col-span-8">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold">Weekly Progress</h3>
              <span className="text-sm text-gray-500">{stats.due_this_week} due this week</span>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="flex flex-col items-center justify-center rounded-lg bg-[#eff4ff] p-6">
                <span className="text-5xl font-black text-green-700">
                  {stats.completion_rate}%
                </span>
                <span className="mt-2 text-gray-500">Tasks Completed</span>
              </div>

              <div className="space-y-5 md:col-span-2">
                {[
                  {
                    title: "High Priority Tasks",
                    value: `${stats.high_priority_completed} / ${stats.high_priority_total}`,
                    width:
                      stats.high_priority_total > 0
                        ? `${(stats.high_priority_completed / stats.high_priority_total) * 100}%`
                        : "0%",
                  },
                  {
                    title: "All Tasks",
                    value: `${stats.completed} / ${stats.total}`,
                    width: `${stats.completion_rate}%`,
                  },
                ].map((item) => (
                  <div key={item.title}>
                    <div className="mb-2 flex justify-between text-sm font-medium">
                      <span>{item.title}</span>
                      <span>{item.value}</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                      <div className="h-full rounded-full bg-green-600" style={{ width: item.width }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <form
            className="col-span-12 rounded-lg bg-green-700 p-6 text-white lg:col-span-4"
            onSubmit={handleCreateTask}
          >
            <h3 className="mb-4 text-2xl font-bold">Add Task</h3>
            <input
              id="new-task-title"
              className="mb-3 w-full rounded-lg border border-white/20 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
              placeholder="Task title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <input
              className="mb-3 w-full rounded-lg border border-white/20 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
              placeholder="Project"
              value={project}
              onChange={(event) => setProject(event.target.value)}
            />
            <div className="mb-3 grid grid-cols-2 gap-3">
              <select
                className="rounded-lg border border-white/20 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                value={priority}
                onChange={(event) => setPriority(event.target.value as Priority)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <input
                type="date"
                className="rounded-lg border border-white/20 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </div>
            <button
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 font-semibold text-green-700 transition hover:bg-green-50 disabled:opacity-70"
              disabled={saving}
            >
              <Plus size={18} />
              {saving ? "Adding..." : "Add Task"}
            </button>
          </form>

          <section className="col-span-12 rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:col-span-5">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold">Upcoming Deadlines</h3>
              <Calendar className="text-green-700" />
            </div>
            <div className="space-y-4">
              {upcomingTasks.length === 0 && (
                <p className="rounded-lg bg-[#eff4ff] p-4 text-sm text-gray-500">
                  No upcoming deadlines yet.
                </p>
              )}
              {upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between rounded-r-lg border-l-4 p-4 ${priorityStyles[task.priority]}`}
                >
                  <div>
                    <p className="font-semibold">{task.title}</p>
                    <p className="text-sm">{formatDueDate(task.due_date)}</p>
                  </div>
                  <Flag />
                </div>
              ))}
            </div>
          </section>

          <section className="col-span-12 rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:col-span-7">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold">Active Projects</h3>
              <div className="flex gap-2">
                <button className="rounded-lg bg-[#eff4ff] p-2">
                  <LayoutGrid size={18} />
                </button>
                <button className="rounded-lg p-2 hover:bg-gray-100">
                  <List size={18} />
                </button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {(projects.length ? projects : [{ name: "General", total: 0, completed: 0 }]).map(
                (projectItem) => {
                  const percent = projectItem.total
                    ? Math.round((projectItem.completed / projectItem.total) * 100)
                    : 0;

                  return (
                    <div
                      key={projectItem.name}
                      className="rounded-lg border border-gray-200 p-5 transition hover:border-green-500"
                    >
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 text-green-700">
                          <BarChart3 />
                        </div>
                        <span className="rounded-full bg-[#eff4ff] px-3 py-1 text-xs font-bold">
                          {percent === 100 && projectItem.total > 0 ? "DONE" : "IN PROGRESS"}
                        </span>
                      </div>
                      <h4 className="mb-1 text-lg font-bold">{projectItem.name}</h4>
                      <p className="mb-4 text-sm text-gray-500">
                        {projectItem.completed} of {projectItem.total} tasks completed
                      </p>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                        <div className="h-full rounded-full bg-green-600" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </section>

          <section className="col-span-12 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-2xl font-bold">Tasks</h3>
            <div className="divide-y divide-gray-100">
              {filteredTasks.length === 0 && (
                <p className="py-6 text-sm text-gray-500">No tasks match your search.</p>
              )}
              {filteredTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-4 py-4">
                  <button
                    className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                      task.completed
                        ? "border-green-600 bg-green-600 text-white"
                        : "border-gray-300 text-transparent"
                    }`}
                    onClick={() => toggleTask(task)}
                  >
                    <CheckCircle2 size={16} />
                  </button>

                  <div className="min-w-0 flex-1">
                    {editTaskId === task.id ? (
                      <div>
                        <input
                          className="mb-2 w-full rounded border border-gray-300 px-2 py-1 text-sm outline-none"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                        />

                        <div className="mb-2 grid grid-cols-2 gap-2">
                          <input
                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm outline-none"
                            value={editProject}
                            onChange={(e) => setEditProject(e.target.value)}
                            placeholder="Project"
                          />
                          <select
                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm outline-none"
                            value={editPriority}
                            onChange={(e) => setEditPriority(e.target.value as Priority)}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>

                        <div className="mb-2 flex items-center gap-3">
                          <input
                            type="date"
                            className="rounded border border-gray-300 px-2 py-1 text-sm outline-none"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                          />
                          <label className="inline-flex items-center text-sm text-gray-600">
                            <input
                              type="checkbox"
                              className="mr-2"
                              checked={editCompleted}
                              onChange={(e) => setEditCompleted(e.target.checked)}
                            />
                            Completed
                          </label>
                        </div>

                        <div className="mt-1 flex gap-2">
                          <button
                            className="rounded-md bg-brand-600 px-3 py-1 text-sm text-white"
                            onClick={() => saveEdit(task)}
                            disabled={editSaving}
                          >
                            {editSaving ? "Saving..." : "Save"}
                          </button>
                          <button className="rounded-md px-3 py-1 text-sm" onClick={cancelEdit}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p
                          className={`font-semibold ${
                            task.completed ? "text-gray-400 line-through" : "text-slate-900"
                          }`}
                        >
                          {task.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {task.project} · {task.priority} priority · {formatDueDate(task.due_date)}
                        </p>
                      </>
                    )}
                  </div>

                  {editTaskId !== task.id && (
                    <button
                      className="rounded-lg px-3 py-1 text-sm text-brand-600 hover:text-brand-700"
                      onClick={() => startEdit(task)}
                    >
                      Edit
                    </button>
                  )}

                  <button
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    onClick={() => removeTask(task.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  </SharedLayout>
  );
}
