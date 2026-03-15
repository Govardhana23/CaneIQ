import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 bg-red-900 text-white min-h-screen flex flex-col items-start justify-start">
          <h1 className="text-3xl font-bold mb-4">React Runtime Crash</h1>
          <div className="bg-black/80 p-6 rounded-lg overflow-auto w-full font-mono text-xs text-red-300 shadow-xl border border-red-500">
            <h2 className="text-red-400 font-bold mb-2">Error: {this.state.error && this.state.error.toString()}</h2>
            <pre className="whitespace-pre-wrap leading-relaxed">
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
