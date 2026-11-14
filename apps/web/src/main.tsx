import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { AppProvider } from './app/AppContext';
import { CobaltRoot } from './app/CobaltRoot';
import '@q-labs/cobalt/styles.css';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <CobaltRoot>
        <RouterProvider router={router} />
      </CobaltRoot>
    </AppProvider>
  </React.StrictMode>
);
