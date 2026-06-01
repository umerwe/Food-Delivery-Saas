"use client";

import { useEffect, useRef, useState, type UIEvent } from "react";
import { Check, ChevronDown, Loader2, Search } from "lucide-react";

export type AsyncSelectOption = object;

type AsyncSelectResult<TOption extends AsyncSelectOption> = {
  data?: TOption[];
  meta?: unknown;
};

interface Props<TValue extends AsyncSelectOption = AsyncSelectOption> {
  value: TValue | null;
  onChange: (val: TValue | null) => void;
  placeholder?: string;
  fetchOptions: (params: {
    search: string;
    page: number;
  }) => Promise<AsyncSelectResult<TValue> | TValue[]>;
  labelKey?: keyof TValue & string;
  valueKey?: keyof TValue & string;
}

const getOptionValue = <TValue extends AsyncSelectOption>(option: TValue, key: keyof TValue & string) => option[key];

const normalize = <TValue extends AsyncSelectOption>(res: AsyncSelectResult<TValue> | TValue[]): TValue[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  return [];
};

export default function AsyncSelect<TValue extends AsyncSelectOption = AsyncSelectOption>({
  value,
  onChange,
  placeholder = "Select",
  fetchOptions,
  labelKey = "name" as keyof TValue & string,
  valueKey = "id" as keyof TValue & string,
}: Props<TValue>) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<TValue[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadOptions = async (reset = false, nextSearch?: string) => {
    try {
      setLoading(true);

      const res = await fetchOptions({
        search: nextSearch ?? search,
        page: reset ? 1 : page,
      });

      const data = normalize(res);

      setOptions((prev) => (reset ? data : [...prev, ...data]));
      setHasMore(data.length > 0);

      if (reset) setPage(1);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    loadOptions(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const t = setTimeout(() => {
      loadOptions(true, search);
    }, 300);

    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (open && page > 1) loadOptions(false);
  }, [page]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 20) {
      if (hasMore && !loading) setPage((p) => p + 1);
    }
  };

  return (
  <div ref={wrapperRef} className="relative w-full">
    <button
      type="button"
      onClick={() => setOpen((p) => !p)}
      className="flex h-[44px] w-full items-center justify-between rounded-xl bg-white/70 backdrop-blur px-4 text-sm shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.08)] transition"
    >
      <span className={value ? "text-gray-900" : "text-gray-400"}>
        {value ? String(getOptionValue(value, labelKey) ?? "") : placeholder}
      </span>

      <ChevronDown
        size={16}
        className={`transition ${open ? "rotate-180" : ""}`}
      />
    </button>

    {open && (
      <div className="absolute z-50 mt-2 w-full rounded-2xl bg-white/90 backdrop-blur shadow-[0_10px_40px_rgba(0,0,0,0.08)] overflow-hidden">

        <div className="p-3">
          <div className="flex items-center gap-2 bg-gray-50/70 rounded-lg px-3 h-[38px] focus-within:ring-2 focus-within:ring-orange-200 transition">
            <Search size={14} className="text-gray-400" />
            <input
              className="w-full bg-transparent outline-none text-sm"
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>
        </div>

        <div
          className="max-h-[240px] overflow-y-auto px-1 pb-2"
          onScroll={handleScroll}
        >
          {options.map((opt) => {
            const optionValue = getOptionValue(opt, valueKey);
            const selected = value ? getOptionValue(value, valueKey) === optionValue : false;

            return (
              <div
                key={String(optionValue)}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`mx-2 px-3 py-2 cursor-pointer text-sm flex justify-between items-center rounded-lg transition ${
                  selected
                    ? "bg-orange-50 text-orange-600"
                    : "hover:bg-gray-100/70"
                }`}
              >
                {String(getOptionValue(opt, labelKey) ?? "")}
                {selected && <Check size={14} />}
              </div>
            );
          })}

          {loading && (
            <div className="p-4 text-center">
              <Loader2 className="animate-spin mx-auto text-gray-400" />
            </div>
          )}

          {!loading && options.length === 0 && (
            <div className="p-4 text-center text-gray-400 text-sm">
              No results found
            </div>
          )}
        </div>
      </div>
    )}
  </div>
);
}
