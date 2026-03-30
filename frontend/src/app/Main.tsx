import React from 'react';
import { Provider } from 'react-redux';
import { store } from '@/shared/state/store';
import ClaudeThemeProvider from '@/shared/styles/ThemeContext';
import Debugger from '@/app/pages/Debugger/Debugger';

const Main: React.FC = () => {
  return (
    <Provider store={store}>
      <ClaudeThemeProvider>
        <Debugger />
      </ClaudeThemeProvider>
    </Provider>
  );
};

export default Main;
