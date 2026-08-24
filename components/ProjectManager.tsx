"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Project, newProject } from "@/lib/types";
import { deleteProject, listProjects, LAST_PROJECT_KEY, saveProject } from "@/lib/db";

export function ProjectManager() {
  const { state, dispatch } = useStore();
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  async function refresh() {
    setProjects((await listProjects()).sort((a, b) => b.updatedAt - a.updatedAt));
  }

  useEffect(() => {
    if (open) refresh();
  }, [open]);

  return (
    <div className="flex items-center gap-2">
      <input
        value={state.project.name}
        onChange={(e) => dispatch({ type: "RENAME_PROJECT", name: e.target.value })}
        className="rounded bg-black/40 border border-white/20 px-2 py-1 text-xs text-white w-40 outline-none focus:border-padActive"
      />
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded border border-white/20 bg-white/10 px-2 py-1 text-[10px] font-bold text-white hover:bg-white/20"
      >
        PROJECTS
      </button>
      <button
        onClick={() => {
          const p = newProject();
          dispatch({ type: "HYDRATE", project: p });
          saveProject(p);
          localStorage.setItem(LAST_PROJECT_KEY, p.id);
        }}
        className="rounded border border-white/20 bg-white/10 px-2 py-1 text-[10px] font-bold text-white hover:bg-white/20"
      >
        NEW
      </button>

      {open && (
        <div className="absolute top-10 right-4 z-20 w-64 rounded border border-white/20 bg-panel p-2 shadow-xl">
          {projects.length === 0 && <p className="text-xs text-white/40 p-2">No saved projects yet.</p>}
          {projects.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-white/10">
              <button
                className="flex-1 text-left text-xs text-white/80 truncate"
                onClick={() => {
                  dispatch({ type: "HYDRATE", project: p });
                  localStorage.setItem(LAST_PROJECT_KEY, p.id);
                  setOpen(false);
                }}
              >
                {p.name}
                <div className="text-[10px] text-white/40">{new Date(p.updatedAt).toLocaleString()}</div>
              </button>
              <button
                className="text-[10px] text-rec hover:brightness-125"
                onClick={async () => {
                  await deleteProject(p.id);
                  refresh();
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
