"use client";

import { useEffect } from "react";

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: { metaKey?: boolean; ctrlKey?: boolean } = {}
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { metaKey = true, ctrlKey = true } = options;

      // Check if the correct modifier key is pressed
      const modifierPressed =
        (metaKey && event.metaKey) || (ctrlKey && event.ctrlKey);

      if (modifierPressed && event.key.toLowerCase() === key.toLowerCase()) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [key, callback, options]);
}
