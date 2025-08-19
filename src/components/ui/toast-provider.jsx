import React from 'react';
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

const ToastProvider = ({ children }) => {
  return (
    <div className='relative'>
      {children}
      <ToastContainer />
    </div>
  );
};

const ToastContainer = () => {
  return (
    <div
      id='toast-container'
      className='fixed top-4 right-4 z-50 flex flex-col space-y-2 max-w-sm'
      role='alert'
      aria-live='polite'
    />
  );
};

export const toast = {
  success: (message, options = {}) => showToast('success', message, options),
  error: (message, options = {}) => showToast('error', message, options),
  warning: (message, options = {}) => showToast('warning', message, options),
  info: (message, options = {}) => showToast('info', message, options),
};

const showToast = (type, message, options = {}) => {
  const id = Math.random().toString(36).substr(2, 9);
  const duration = options.duration || 4000;

  const toastElement = createToastElement(id, type, message, options);
  const container = document.getElementById('toast-container');

  if (container) {
    container.appendChild(toastElement);

    // Animate in
    setTimeout(() => {
      toastElement.classList.add('animate-in', 'slide-in-from-right-full');
    }, 10);

    // Auto remove
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }
};

// Define removeToast function before it's used
const removeToast = id => {
  const toast = document.getElementById(`toast-${id}`);
  if (toast) {
    toast.classList.add('animate-out', 'slide-out-to-right-full');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }
};

const createToastElement = (id, type, message, options) => {
  const toast = document.createElement('div');
  toast.id = `toast-${id}`;
  toast.className = getToastClasses(type);

  const icons = {
    success:
      '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>',
    error:
      '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>',
    warning:
      '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>',
    info: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
  };

  toast.innerHTML = `
    <div class="flex items-start">
      <div class="flex-shrink-0">
        ${icons[type]}
      </div>
      <div class="ml-3 w-0 flex-1">
        ${options.title ? `<p class="text-sm font-medium">${options.title}</p>` : ''}
        <p class="text-sm ${options.title ? 'mt-1' : ''}">${message}</p>
      </div>
      <div class="ml-4 flex-shrink-0 flex">
        <button 
          class="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500 transition ease-in-out duration-150"
          onclick="document.getElementById('toast-${id}').remove()"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
  `;

  return toast;
};

const getToastClasses = type => {
  const baseClasses =
    'max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 ease-in-out p-4 dark:bg-gray-800';

  const typeClasses = {
    success: 'border-l-4 border-green-400 text-green-800 dark:text-green-200',
    error: 'border-l-4 border-red-400 text-red-800 dark:text-red-200',
    warning:
      'border-l-4 border-yellow-400 text-yellow-800 dark:text-yellow-200',
    info: 'border-l-4 border-blue-400 text-blue-800 dark:text-blue-200',
  };

  return `${baseClasses} ${typeClasses[type]}`;
};

export default ToastProvider;
