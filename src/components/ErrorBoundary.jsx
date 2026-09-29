import { Component } from "react";
import Card from "./ui/Card";
import Button from "./ui/Button";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production this could be reported to logging
    console.error("ErrorBoundary caught:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 md:p-8">
          <Card>
            <div className="flex flex-col items-center py-8 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-red-900/40 bg-red-950/30 text-red-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v5" />
                  <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <h2 className="mt-3 text-sm font-semibold text-zinc-100">Something went wrong</h2>
              <p className="mt-1 max-w-md text-sm text-zinc-400">
                An unexpected error occurred. Try again or return to the dashboard.
              </p>
              <div className="mt-4 flex gap-2">
                <Button onClick={this.handleReset}>Try again</Button>
                <Button variant="secondary" onClick={() => (window.location.href = "/")}>
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
