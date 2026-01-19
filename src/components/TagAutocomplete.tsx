"use client";

import { useState, useRef, useEffect } from "react";
import { X, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TagAutocompleteProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function TagAutocomplete({
  tags,
  onTagsChange,
  placeholder = "Add tags...",
  disabled = false,
  className,
}: TagAutocompleteProps) {
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [allTags, setAllTags] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch existing tags from API on mount
  useEffect(() => {
    fetch("/api/tags")
      .then((res) => res.json())
      .then((data) => setAllTags(data.tags || []))
      .catch(() => setAllTags([]));
  }, []);

  // Filter suggestions based on input
  const suggestions = input.trim()
    ? allTags.filter(
        (tag) =>
          tag.toLowerCase().includes(input.toLowerCase()) &&
          !tags.includes(tag)
      ).slice(0, 8) // Limit to 8 suggestions
    : [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset highlighted index when suggestions change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [suggestions.length]);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onTagsChange([...tags, trimmed]);
    }
    setInput("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" || e.key === " ") {
      // Space or Enter creates a tag
      if (input.trim()) {
        e.preventDefault();
        if (suggestions.length > 0 && isOpen && e.key === "Enter") {
          // Enter with suggestions selects the highlighted one
          addTag(suggestions[highlightedIndex]);
        } else {
          // Space or Enter without selection creates from input
          addTag(input);
        }
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // If user pastes or types text with spaces, split into tags
    if (value.includes(" ")) {
      const parts = value.split(" ");
      const lastPart = parts.pop() || "";
      parts.forEach((part) => {
        if (part.trim()) addTag(part);
      });
      setInput(lastPart);
    } else {
      setInput(value);
    }
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className={cn("space-y-2", className)}>
      {/* Selected tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-primary/20 text-primary text-xs uppercase tracking-wide font-semibold pl-2 pr-1 py-0.5 gap-1"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-0.5 hover:bg-primary/20 rounded-full p-0.5"
                disabled={disabled}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input with dropdown */}
      <div className="relative">
        <div className="relative">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => input.trim() && setIsOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className="pl-9 h-10"
          />
        </div>

        {/* Suggestions dropdown */}
        {isOpen && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addTag(suggestion)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors",
                  index === highlightedIndex && "bg-accent"
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Show hint for custom tag */}
        {isOpen && input.trim() && suggestions.length === 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg">
            <button
              type="button"
              onClick={() => addTag(input)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
            >
              Add &ldquo;{input.trim()}&rdquo;
            </button>
          </div>
        )}
      </div>

      {/* Helper text */}
      {tags.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Type to search tags or add custom ones
        </p>
      )}
    </div>
  );
}
