"use client";

import { PAD_ROWS } from "@/lib/types";
import { useStore } from "@/lib/store";
import { PadButton } from "./Pad";

export function PadGrid({
  pressedIds,
  onDropAsset,
  onPadDown,
  onPadUp,
}: {
  pressedIds: Set<string>;
  onDropAsset: (padId: string, e: React.DragEvent) => void;
  onPadDown: (padId: string) => void;
  onPadUp: (padId: string) => void;
}) {
  const { state } = useStore();

  return (
    <div className="grid grid-cols-4 grid-rows-4 gap-2 flex-1 min-h-0">
      {PAD_ROWS.flat().map((id) => {
        const pad = state.project.pads[id];
        return (
          <PadButton
            key={id}
            pad={pad}
            selected={state.selectedPadId === id}
            pressed={pressedIds.has(id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onDropAsset(id, e);
            }}
            onPressDown={() => onPadDown(id)}
            onPressUp={() => onPadUp(id)}
          />
        );
      })}
    </div>
  );
}
