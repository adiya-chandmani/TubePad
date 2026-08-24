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
    <div className="flex items-center gap-2 shrink-0">
      <input
        value={state.project.name}
        onChange={(e) => dispatch({ type: "RENAME_PROJECT", name: e.target.value })}
        className="rounded-none bg-black/40 border-2 border-gold/40 px-2 py-1 font-pixel text-lg text-cream w-36 outline-none focus:border-gold"
      />
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-none border-2 border-black bg-cream shadow-pixelSm px-2 py-1 font-display text-[9px] text-navyDeep hover:brightness-95 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
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
        className="rounded-none border-2 border-black bg-cream shadow-pixelSm px-2 py-1 font-display text-[9px] text-navyDeep hover:brightness-95 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        NEW
      </button>

      {open && (
        <div className="absolute top-10 right-4 z-20 w-64 rounded-none border-2 border-gold bg-navyDeep p-2 shadow-pixel">
          {projects.length === 0 && <p className="font-pixel text-base text-cream/40 p-2">No saved projects yet.</p>}
          {projects.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2 px-2 py-1 hover:bg-cream/10">
              <button
                className="flex-1 text-left font-pixel text-base text-cream/80 truncate"
                onClick={() => {
                  dispatch({ type: "HYDRATE", project: p });
                  localStorage.setItem(LAST_PROJECT_KEY, p.id);
                  setOpen(false);
                }}
              >
                {p.name}
                <div className="text-sm text-cream/40">{new Date(p.updatedAt).toLocaleString()}</div>
              </button>
              <button
                className="text-sm text-red hover:brightness-125"
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
