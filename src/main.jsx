import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter for routing
import './index.css';
import App from './App';
import { AuthProvider } from './Context/authContext'; // Adjust import based on your folder structure
import axios from 'axios';

// Global Axios Interceptor to dynamically replace localhost:3000 with VITE_API_URL
axios.interceptors.request.use(
  (config) => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
      if (config.url && config.url.startsWith('http://localhost:3000')) {
        config.url = config.url.replace('http://localhost:3000', apiUrl);
      } else if (config.url && (config.url.startsWith('/api') || config.url.startsWith('/auth'))) {
        config.url = `${apiUrl}${config.url}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global Fetch Interceptor to dynamically replace localhost:3000 with VITE_API_URL
const originalFetch = window.fetch;
window.fetch = async function (resource, options) {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    if (typeof resource === 'string') {
      if (resource.startsWith('http://localhost:3000')) {
        resource = resource.replace('http://localhost:3000', apiUrl);
      } else if (resource.startsWith('/api') || resource.startsWith('/auth')) {
        resource = `${apiUrl}${resource}`;
      }
    } else if (resource instanceof URL) {
      if (resource.href.startsWith('http://localhost:3000')) {
        resource = new URL(resource.href.replace('http://localhost:3000', apiUrl));
      }
    }
  }
  return originalFetch(resource, options);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);