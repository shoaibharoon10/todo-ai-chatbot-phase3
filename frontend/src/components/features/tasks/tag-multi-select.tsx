"use client";

import { useEffect, useState } from "react";
import { Plus, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TagChip } from "./tag-chip";
import { createTag, getTags } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import type { Tag } from "@/types";

const TAG_COLORS = ["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#8b5cf6","#ef4444","#14b8a6"];

interface TagMultiSelectProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

export function TagMultiSelect({ selectedIds, onChange }: TagMultiSelectProps) {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? "";
  const [tags, setTags] = useState<Tag[]>([]);
  const [createName, setCreateName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!userId) return;
    getTags(userId)
      .then(setTags)
      .catch(() => {});
  }, [userId]);

  const selectedTags = tags.filter((t) => selectedIds.includes(t.id));

  function toggle(tagId: number) {
    if (selectedIds.includes(tagId)) {
      onChange(selectedIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedIds, tagId]);
    }
  }

  async function handleCreate() {
    const name = createName.trim();
    if (!name || isCreating || !userId) return;
    setIsCreating(true);
    try {
      const color = TAG_COLORS[tags.length % TAG_COLORS.length];
      const newTag = await createTag(userId, { name, color });
      setTags((prev) => prev.some((t) => t.id === newTag.id) ? prev : [...prev, newTag]);
      if (!selectedIds.includes(newTag.id)) {
        onChange([...selectedIds, newTag.id]);
      }
      setCreateName("");
    } catch {
      // silent — tag may already exist server-side (idempotent)
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 dark:border-slate-700 dark:text-slate-300"
          >
            <Tags className="h-3.5 w-3.5" />
            Add Tags
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2 dark:border-slate-700 dark:bg-slate-900">
          <div className="space-y-1">
            {tags.map((tag) => (
              <label
                key={tag.id}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(tag.id)}
                  onChange={() => toggle(tag.id)}
                  className="h-3.5 w-3.5"
                />
                <TagChip tag={tag} />
              </label>
            ))}
            {tags.length > 0 && (
              <hr className="my-1 border-slate-200 dark:border-slate-700" />
            )}
            <div className="flex gap-1 pt-0.5">
              <Input
                placeholder="New tag name…"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
                className="h-7 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCreate}
                disabled={isCreating || !createName.trim()}
                className="h-7 w-7 shrink-0 p-0 dark:border-slate-700"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTags.map((tag) => (
            <TagChip key={tag.id} tag={tag} />
          ))}
        </div>
      )}
    </div>
  );
}
