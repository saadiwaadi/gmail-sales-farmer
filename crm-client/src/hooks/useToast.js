import { useState, useEffect } from 'react';

let listeners = [];
let toasts = [];
let nextId = 0;

export function addToast(kind, message) {
  const id = nextId++;
  const toastItem = { id, kind, message, leaving: false };
  toasts = [...toasts, toastItem];
  
  listeners.forEach(listener => listener(toasts));

  // Set timeout to start leaving animation
  setTimeout(() => {
    toasts = toasts.map(t => t.id === id ? { ...t, leaving: true } : t);
    listeners.forEach(listener => listener(toasts));
    
    // Set timeout to remove
    setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id);
      listeners.forEach(listener => listener(toasts));
    }, 320);
  }, 3200);
}

export function useToast() {
  const [currentToasts, setCurrentToasts] = useState(toasts);

  useEffect(() => {
    listeners.push(setCurrentToasts);
    return () => {
      listeners = listeners.filter(l => l !== setCurrentToasts);
    };
  }, []);

  return { toasts: currentToasts, addToast };
}
