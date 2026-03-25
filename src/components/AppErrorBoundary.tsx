import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div className="p-6 rounded-lg border border-red-500/60 bg-black/55 text-brand-text">
          <h1 className="text-xl font-semibold text-red-400 mb-2">
            Something went wrong
          </h1>
          <p className="text-sm text-brand-text-muted mb-4">
            {error.name}: {error.message}
          </p>
          <pre className="text-xs whitespace-pre-wrap text-brand-text-muted">
            {error.stack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

