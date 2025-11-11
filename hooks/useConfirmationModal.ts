import { useState, useCallback } from 'react';

export interface ConfirmationOptions {
  title: string;
  message: string;
  variant?: 'danger' | 'warning' | 'info';
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  onConfirm: () => void | Promise<void>;
}

export function useConfirmationModal() {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);
  const [loading, setLoading] = useState(false);

  const showConfirmation = useCallback((config: ConfirmationOptions) => {
    setOptions(config);
    setVisible(true);
    setLoading(false);
  }, []);

  const hideConfirmation = useCallback(() => {
    setVisible(false);
    setLoading(false);
    // Clear options after animation completes
    setTimeout(() => setOptions(null), 300);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!options) return;
    
    try {
      setLoading(true);
      await options.onConfirm();
      hideConfirmation();
    } catch (error) {
      // Error handling is done by the caller
      // We don't hide the modal if there's an error
      // so the user can retry
      setLoading(false);
      console.error('Confirmation action failed:', error);
    }
  }, [options, hideConfirmation]);

  return {
    visible,
    showConfirmation,
    hideConfirmation,
    handleConfirm,
    options,
    loading,
  };
}

