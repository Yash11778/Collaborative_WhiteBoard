import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-800 my-4">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="mb-4">
            An error occurred in the application. Please try refreshing the page.
          </p>
          {this.state.error && (
            <details className="bg-red-100 p-4 rounded-lg">
              <summary className="font-medium cursor-pointer mb-2">
                Error details
              </summary>
              <p className="whitespace-pre-wrap font-mono text-sm">
                {this.state.error.toString()}
              </p>
              {this.state.errorInfo && (
                <p className="whitespace-pre-wrap font-mono text-xs mt-2">
                  {this.state.errorInfo.componentStack}
                </p>
              )}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
