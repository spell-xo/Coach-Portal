import toast from 'react-hot-toast';

const defaultOptions = {
  duration: 4000,
  position: 'top-right',
  style: {
    background: '#FFFFFF',
    color: '#000000',
    borderRadius: '8px',
    border: '1px solid #E4E7EB',
    padding: '12px 16px',
    fontSize: '0.875rem',
    fontWeight: 500,
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
  },
};

export const showToast = {
  success: (message, options = {}) => {
    toast.success(message, {
      ...defaultOptions,
      ...options,
      style: {
        ...defaultOptions.style,
        borderLeft: '4px solid #24FF00',
        ...options.style,
      },
      iconTheme: {
        primary: '#24FF00',
        secondary: '#000000',
      },
    });
  },

  error: (message, options = {}) => {
    toast.error(message, {
      ...defaultOptions,
      duration: 5000,
      ...options,
      style: {
        ...defaultOptions.style,
        borderLeft: '4px solid #d32f2f',
        ...options.style,
      },
    });
  },

  info: (message, options = {}) => {
    toast(message, {
      ...defaultOptions,
      ...options,
      icon: 'ℹ️',
      style: {
        ...defaultOptions.style,
        borderLeft: '4px solid #0288d1',
        ...options.style,
      },
    });
  },

  warning: (message, options = {}) => {
    toast(message, {
      ...defaultOptions,
      ...options,
      icon: '⚠️',
      style: {
        ...defaultOptions.style,
        borderLeft: '4px solid #ed6c02',
        ...options.style,
      },
    });
  },

  loading: (message, options = {}) => {
    return toast.loading(message, {
      ...defaultOptions,
      ...options,
    });
  },

  promise: (promise, messages, options = {}) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading || 'Loading...',
        success: messages.success || 'Success!',
        error: messages.error || 'Error occurred',
      },
      {
        ...defaultOptions,
        ...options,
      }
    );
  },

  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },

  custom: (component, options = {}) => {
    toast.custom(component, {
      ...defaultOptions,
      ...options,
    });
  },
};

export default showToast;
