import { createStore, StoreApi } from 'zustand/vanilla';
import { AppStore } from '../types';
import { useAppStore } from './appStore';

interface InitialState {
  app?: AppStore;
}

let stores: {
  app?: StoreApi<AppStore>;
} = {};

export const initializeStores = (initialState: InitialState = {}) => {
  // Initialize stores on the server
  if (typeof window === 'undefined') {
    const createAppStore = useAppStore.getState();

    stores = {
      app: createStore<AppStore>()(set => ({
        ...createAppStore,
        ...(initialState.app || {})
      }))
    };

    return stores;
  }

  // On client side, return the existing stores
  return stores;
};

export const getStoreSnapshot = () => {
  return {
    app: stores.app?.getState()
  };
};
