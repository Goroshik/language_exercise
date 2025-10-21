import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type AlertSeverity = 'error' | 'warning' | 'info' | 'success';

export interface Alert {
  id: string;
  message: string;
  severity: AlertSeverity;
}

interface AlertStore {
  alerts: Alert[];
  addAlert: (message: string, severity?: AlertSeverity) => void;
  removeAlert: (id: string) => void;
  clearAlerts: () => void;
}

export const useAlertStore = create<AlertStore>()(
  devtools((set) => ({
    alerts: [],

    addAlert: (message: string, severity: AlertSeverity = 'info') => {
      const id = `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      set((state) => ({
        alerts: [...state.alerts, { id, message, severity }]
      }));
    },

    removeAlert: (id: string) => {
      set((state) => ({
        alerts: state.alerts.filter((alert) => alert.id !== id)
      }));
    },

    clearAlerts: () => {
      set({ alerts: [] });
    }
  }))
);
