import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export default function Modal({
  isOpen,
  onClose,
  title,
  message,
  confirmLabel = 'Bəli',
  cancelLabel = 'Xeyr',
  onConfirm,
  type = 'info'
}: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background-dark/40 backdrop-blur-sm"
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-background-light rounded-2xl shadow-2xl border border-border-subtle overflow-hidden transition-colors duration-300"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`size-12 rounded-full flex items-center justify-center shrink-0 ${
                  type === 'danger' ? 'bg-red-500/10 text-red-500' : 
                  type === 'warning' ? 'bg-amber-500/10 text-amber-500' : 
                  'bg-primary/10 text-primary'
                }`}>
                  <span className="material-symbols-outlined">
                    {type === 'danger' ? 'delete' : type === 'warning' ? 'warning' : 'info'}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-primary mb-2">{title}</h3>
                  <p className="text-primary/70 leading-relaxed">{message}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-background-soft border-t border-border-subtle">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-primary/60 hover:text-primary transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="px-6 py-2 rounded-lg text-sm font-bold transition-all bg-primary text-white dark:text-background-light hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
