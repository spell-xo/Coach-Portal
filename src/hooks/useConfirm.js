import { useState, useCallback } from 'react';

export const useConfirm = () => {
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
    severity: 'warning',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
  });

  const confirm = useCallback(
    ({
      title,
      message,
      severity = 'warning',
      confirmLabel = 'Confirm',
      cancelLabel = 'Cancel',
    }) => {
      return new Promise((resolve) => {
        setConfirmState({
          open: true,
          title,
          message,
          severity,
          confirmLabel,
          cancelLabel,
          onConfirm: () => {
            setConfirmState((prev) => ({ ...prev, open: false }));
            resolve(true);
          },
          onCancel: () => {
            setConfirmState((prev) => ({ ...prev, open: false }));
            resolve(false);
          },
        });
      });
    },
    []
  );

  return { confirmState, confirm };
};

export default useConfirm;
