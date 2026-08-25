// src/components/common/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from "react"
import { Button } from "./Button"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught component error:", error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center text-slate-900">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-3 border border-red-200">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">
            Component Rendering Error
          </h2>
          <p className="text-xs text-slate-500 max-w-md mt-1 mb-4">
            An unexpected error occurred while rendering this view.
            {this.state.error?.message && (
              <span className="block font-mono text-[11px] bg-slate-100 p-2 rounded mt-2 text-red-600 text-left overflow-x-auto">
                {this.state.error.message}
              </span>
            )}
          </p>
          <Button
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={this.handleReset}
          >
            Reload Component
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
