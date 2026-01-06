import { cn } from "@/lib/utils";
import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";

interface DragHandleProps {
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  className?: string;
}

export default function DragHandle(props: DragHandleProps) {
  const { dragHandleProps, className } = props;

  return (
    <div
      {...dragHandleProps}
      className={cn(
        "mr-2 cursor-move hover:text-primary transition-colors ",
        className
      )}
    >
      <svg
        className="w-4 h-4 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 8h16M4 16h16"
        />
      </svg>
    </div>
  );
}
