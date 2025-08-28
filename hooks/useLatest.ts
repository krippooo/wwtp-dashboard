// /hooks/useLatest.ts
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
});

export function useLatest(table: "t700" | "t500", ms = 60000) {
  const { data, error, isLoading } = useSWR(`/api/latest?table=${table}`, fetcher, {
    refreshInterval: ms,
    revalidateOnFocus: false,
  });
  return { data, error, isLoading };
}
