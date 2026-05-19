import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScheduleSlot } from "@/lib/timetableApi";
import { subjectColor } from "./constants";

export default function TimetableSlotCard({
  slot,
  draggable,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  slot: ScheduleSlot;
  draggable: boolean;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "rounded-md border p-2 select-none",
        subjectColor(slot.subject._id),
        draggable && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
    >
      {draggable && <GripVertical className="h-3 w-3 opacity-40 mb-0.5" aria-hidden />}
      <div className="font-semibold text-sm">{slot.subject.name}</div>
      <div className="text-xs opacity-80">{slot.teacher.name}</div>
    </div>
  );
}
