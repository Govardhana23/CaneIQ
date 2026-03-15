import React from 'react';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-neutral-900 text-white font-sans">
        <header className="bg-neutral-800 border-b border-neutral-700 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-green-500 text-white p-2 rounded-lg font-bold text-xl">
              CQ
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">CaneIQ</h1>
              <p className="text-xs text-neutral-400">Inline Sugarcane Quality Intelligence</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center text-sm text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              System Online
            </span>

          </div>
        </header>
        
        <main className="p-6">
          <Dashboard />
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
