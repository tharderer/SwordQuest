// @ts-nocheck
import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AlertCircle } from 'lucide-react';

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          minHeight: '100vh', 
          backgroundColor: '#fef2f2', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '2rem', 
          textAlign: 'center',
          fontFamily: 'sans-serif'
        }}>
          <AlertCircle style={{ width: '4rem', height: '4rem', color: '#ef4444', marginBottom: '1rem' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#7f1d1d', marginBottom: '0.5rem' }}>Something went wrong</h1>
          <p style={{ color: '#991b1b', marginBottom: '1.5rem', maxWidth: '28rem' }}>
            The application encountered an error. This might be due to a missing API key or a temporary issue.
          </p>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '1rem', 
            borderRadius: '0.5rem', 
            border: '1px solid #fecaca', 
            textAlign: 'left', 
            width: '100%', 
            maxWidth: '42rem', 
            overflow: 'auto', 
            marginBottom: '1.5rem' 
          }}>
            <pre style={{ fontSize: '0.75rem', color: '#b91c1c', whiteSpace: 'pre-wrap', margin: 0 }}>
              {this.state.error?.toString()}
              {"\n\n"}
              {this.state.error?.stack}
            </pre>
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{ 
              padding: '0.75rem 1.5rem', 
              backgroundColor: '#dc2626', 
              color: 'white', 
              borderRadius: '0.75rem', 
              fontWeight: 'bold', 
              border: 'none', 
              cursor: 'pointer' 
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
