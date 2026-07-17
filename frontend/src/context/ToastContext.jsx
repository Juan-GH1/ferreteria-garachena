import { createContext, useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [message, setMessage] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((text) => {
    setMessage(text);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setMessage(null), 3000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] pointer-events-none">
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-brand-dark text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-2xl max-w-sm text-center"
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
