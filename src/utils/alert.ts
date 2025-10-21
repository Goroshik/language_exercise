import { useAlertStore } from 'src/store/alertStore';

// Utility function to show alerts from anywhere (not just React components)
export const showAlert = {
  error: (message: string) => {
    useAlertStore.getState().addAlert(message, 'error');
  },
  success: (message: string) => {
    useAlertStore.getState().addAlert(message, 'success');
  },
  warning: (message: string) => {
    useAlertStore.getState().addAlert(message, 'warning');
  },
  info: (message: string) => {
    useAlertStore.getState().addAlert(message, 'info');
  }
};
