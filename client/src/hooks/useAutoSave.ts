import { useState, useEffect, useRef, useCallback } from 'react';

interface UseAutoSaveReturn {
  isSaving: boolean;
  lastSaved: Date | null;
  saveError: string | null;
  saveNow: () => Promise<void>;
}

export function useAutoSave(
  saveFn: () => Promise<void>,
  isDirty: boolean,
  delay: number = 3000
): UseAutoSaveReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveFnRef = useRef(saveFn);

  // Keep the save function reference current without triggering effect re-runs
  useEffect(() => {
    saveFnRef.current = saveFn;
  }, [saveFn]);

  const executeSave = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await saveFnRef.current();
      setLastSaved(new Date());
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Debounced auto-save when isDirty changes
  useEffect(() => {
    if (!isDirty) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      executeSave();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isDirty, delay, executeSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    await executeSave();
  }, [executeSave]);

  return { isSaving, lastSaved, saveError, saveNow };
}
