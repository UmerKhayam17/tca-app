import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { scheduleSlotEntries, type ScheduleSlot } from "@/lib/timetableApi";
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
  const entries = scheduleSlotEntries(slot);
  const isChoice = entries.length > 1;
  const title = entries.map((e) => e.subject.name).join(" / ");

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
      <div className="font-semibold text-sm">{title}</div>
      {isChoice ? (
        <div className="mt-1 space-y-0.5">
          {entries.map((e) => (
            <div key={e.subject._id} className="text-xs opacity-80">
              {e.subject.name}: {e.teacher.name}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs opacity-80">{slot.teacher.name}</div>
      )}
    </div>
  );
}
