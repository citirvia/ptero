import * as React from "react";
import { ErrorState } from "./error-state";

/**
 * Structural subset of TanStack's UseQueryResult — accepts any query shape
 * regardless of its specific `Error` parameter, so consumers can drop the
 * `as any` casts that the strict generic version forced.
 */
export interface QueryLike<TData> {
  data: TData | undefined;
  isLoading: boolean;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
}

interface DataStateProps<TData> {
  query: QueryLike<TData>;
  loading: React.ReactNode;
  empty?: React.ReactNode;
  /** Optional custom error renderer. If absent, a default <ErrorState/> is shown. */
  error?: (err: Error, retry: () => void) => React.ReactNode;
  isEmpty?: (data: TData) => boolean;
  children: (data: TData) => React.ReactNode;
}

/**
 * Render-prop wrapper that picks the right state for a TanStack Query result.
 * Pages get loading → error → empty → data switching for free, with a single
 * import. Pass a custom `isEmpty` if "no rows" isn't the default `!data` /
 * `length === 0` check.
 */
export function DataState<TData>({
  query,
  loading,
  empty,
  error,
  isEmpty,
  children,
}: DataStateProps<TData>) {
  if (query.isLoading || query.isPending) return <>{loading}</>;
  if (query.isError) {
    const e = (query.error ?? new Error("Unknown error")) as Error;
    return error ? (
      <>{error(e, () => void query.refetch())}</>
    ) : (
      <ErrorState
        description={e?.message ?? "We couldn't load this data."}
        onRetry={() => void query.refetch()}
      />
    );
  }
  const data = query.data as TData;
  const emptyCheck = isEmpty
    ? isEmpty(data)
    : Array.isArray(data)
      ? data.length === 0
      : data == null;
  if (emptyCheck && empty) return <>{empty}</>;
  return <>{children(data)}</>;
}
