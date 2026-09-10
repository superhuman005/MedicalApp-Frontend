import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Copy, RotateCcw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Catches render-time errors anywhere in the tree below it and shows a visible,
// copyable error report instead of letting React silently unmount to a blank
// page. This is the difference between "the page is just blank" (undiagnosable
// without DevTools) and "here's exactly what broke" (fixable in one round trip).
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleCopy = () => {
    const { error, errorInfo } = this.state;
    const text = `${error?.name}: ${error?.message}\n\n${error?.stack || ""}\n\nComponent stack:${errorInfo?.componentStack || ""}`;
    navigator.clipboard?.writeText(text).catch(() => {});
  };

  handleReload = () => {
    this.setState({ error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-2xl w-full bg-white border border-red-200 rounded-lg shadow-sm p-6">
            <div className="flex items-start space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Something went wrong</h1>
                <p className="text-sm text-gray-600 mt-1">
                  This page hit an error while rendering. Copy the details below and share them
                  to get this fixed.
                </p>
              </div>
            </div>

            <pre className="bg-gray-900 text-red-300 text-xs rounded-md p-4 overflow-auto max-h-64 whitespace-pre-wrap break-words">
              {this.state.error.name}: {this.state.error.message}
              {"\n\n"}
              {this.state.error.stack}
            </pre>

            <div className="flex space-x-3 mt-4">
              <Button onClick={this.handleCopy} variant="outline" size="sm">
                <Copy className="w-4 h-4 mr-2" />
                Copy error details
              </Button>
              <Button onClick={this.handleReload} size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reload page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
