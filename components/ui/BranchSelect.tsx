"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";

export default function BranchSelect({ value, onChange }: any) {
  const { user, token } = useAuth();
  const { get } = useApi(token);

  const [branches, setBranches] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<any>(null);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await get(
        `/v1/branches?restaurantId=${user?.restaurantId}&search=${search}`
      );
      setBranches(res?.data?.filter((b: any) => b.isActive) || []);
    } catch {
      toast.error("Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.restaurantId) fetchBranches();
  }, [search]);

  useEffect(() => {
    const handleClick = (e: any) => {
      if (!dropdownRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // if user already has branch
  if (user?.branchId) return null;

  return (
    <div ref={dropdownRef}>
      <label className="text-sm font-medium text-gray-700">
        Select Branch
      </label>

      <div
        onClick={() => setOpen((prev) => !prev)}
        className="mt-2 h-12 px-4 flex items-center justify-between rounded-full bg-[#FAFAF9] border border-gray-200 cursor-pointer"
      >
        <span className="text-sm text-gray-700">
          {value?.name || "Select a branch"}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </div>

      {open && (
        <div className="mt-2 bg-white border rounded-xl shadow-lg p-2 z-50 relative">

          <Input
            placeholder="Search branch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-2"
          />

          <div className="max-h-[200px] overflow-y-auto">
            {branches.map((b) => (
              <div
                key={b.id}
                onClick={() => {
                  onChange(b);
                  setOpen(false);
                }}
                className={`p-2 rounded-lg cursor-pointer text-sm ${
                  value?.id === b.id
                    ? "bg-primary text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                {b.name}
              </div>
            ))}

            {loading && (
              <div className="text-center text-sm py-2">Loading...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}