import { type ErrorInfo, type ReactNode } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

type Props = { children: ReactNode };

const ErrorBoundary = ({ children }: Props) => {
  const fallback = () => null; // render nothing on error

  const onError = (error: Error, info: ErrorInfo) => {
    console.error('ErrorBoundary caught an error:', error, info);
  };

  return (
    <ReactErrorBoundary FallbackComponent={fallback} onError={onError}>
      {children}
    </ReactErrorBoundary>
  );
};

export default ErrorBoundary;
