import type { Tag } from "@/types";

interface TagChipProps {
  tag: Tag;
}

export function TagChip({ tag }: TagChipProps) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: tag.color }}
    >
      {tag.name}
    </span>
  );
}
