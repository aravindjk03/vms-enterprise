import React from 'react';
import ReactDOM from 'react-dom/client';
import { Root } from './auth/Root.js';
import './styles/tailwind.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>
  );
}
