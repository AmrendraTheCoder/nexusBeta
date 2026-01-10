import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-red-500" size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Something went wrong</h1>
                <p className="text-slate-600">The application encountered an error</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h2 className="font-bold text-red-800 mb-2">Error Details:</h2>
              <pre className="text-sm text-red-700 overflow-auto max-h-40">
                {this.state.error && this.state.error.toString()}
              </pre>
            </div>

            {this.state.errorInfo && (
              <details className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <summary className="font-bold text-slate-700 cursor-pointer">
                  Component Stack
                </summary>
                <pre className="text-xs text-slate-600 mt-2 overflow-auto max-h-60">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3 px-6 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-md"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
