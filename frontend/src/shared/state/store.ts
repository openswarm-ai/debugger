import { configureStore } from '@reduxjs/toolkit';
import debuggerReducer from './debuggerSlice';

export const store = configureStore({
  reducer: {
    debugger: debuggerReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
