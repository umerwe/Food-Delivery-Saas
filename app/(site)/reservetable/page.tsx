"use client";

import Image from "next/image";
import { Star, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import ReservationSuccess from "./ReservationSuccess";

export default function ReserveTablePage() {
  const { token, user } = useAuth();
  const { post, get, loading } = useApi(token);

  const [success, setSuccess] = useState(false);
  const [reservationData, setReservationData] = useState<any>(null);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guestCount, setGuestCount] = useState(2);
  const [note, setNote] = useState("");

  // 🔥 Branch state
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [loadingBranches, setLoadingBranches] = useState(false);

  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<any>(null);

  // 🔥 Fetch branches
  const fetchBranches = async (reset = false) => {
    if (!user?.restaurantId) return;

    try {
      setLoadingBranches(true);

      const currentPage = reset ? 1 : page;

      const res = await get(
        `/v1/branches?restaurantId=${user.restaurantId}&page=${currentPage}&search=${search}`
      );

      const activeBranches =
        res?.data?.filter((b: any) => b.isActive) || [];

      if (reset) {
        setBranches(activeBranches);
      } else {
        setBranches((prev) => [...prev, ...activeBranches]);
      }

      setMeta(res?.meta);

      if (reset) setPage(2);
      else setPage((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load branches");
    } finally {
      setLoadingBranches(false);
    }
  };

  // initial load
  useEffect(() => {
    if (!user?.branchId && user?.restaurantId) {
      fetchBranches(true);
    }
  }, [user]);

  // search debounce
  useEffect(() => {
    if (!user?.branchId) {
      const delay = setTimeout(() => {
        fetchBranches(true);
      }, 400);
      return () => clearTimeout(delay);
    }
  }, [search]);

  // close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: any) => {
      if (!dropdownRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSubmit() {
    try {
      if (!user?.id) {
        toast.error("User not found");
        return;
      }

      const branchId = user?.branchId || selectedBranch?.id;

      if (!branchId) {
        toast.error("Please select a branch");
        return;
      }

      if (!date || !time) {
        toast.error("Please select date & time");
        return;
      }

      const reservationDate = new Date(`${date}T${time}`).toISOString();

      const res = await post(
        `/v1/customer-app/table-reservations?customerId=${user.id}`,
        {
          branchId,
          reservationDate,
          guestCount,
          note,
        }
      );

      if (!res || res.error) {
        toast.error(res?.error || "Failed to reserve table");
        return;
      }

      toast.success("Reservation confirmed 🎉");

      setSuccess(true);
      setReservationData(res.data);

      setDate("");
      setTime("");
      setGuestCount(2);
      setNote("");
      setSelectedBranch(null);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  }

  if (success) {
    return <ReservationSuccess data={reservationData} />;
  }
return (
  <main className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
    
    {/* Background */}
    <div className="absolute inset-0 z-0">
      <Image
        src="/reserve-table-bg.jpg"
        alt="Restaurant background"
        fill
        className="object-cover opacity-12"
        priority
      />
    </div>

    <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 grid lg:grid-cols-2 gap-12 py-12">
      
      {/* LEFT */}
      <div className="text-gray-900 space-y-[12px] max-w-[500px] mt-10">
        <h1 className="text-[60px] font-bold leading-tight">
          Taste The{" "}
          <span className="text-primary block">Extraordinary</span>
        </h1>

        <p className="text-lg leading-relaxed text-gray-600">
          with every bite — a perfect balance of flavor and freshness.
        </p>

        <div className="flex items-center gap-2 mt-[23px]">
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          <span className="text-[17px]">4.9</span>
          <span className="text-gray-500">(2.7k reviews)</span>
        </div>
      </div>

      {/* RIGHT */}
      <div className="bg-white rounded-[20px] p-[40px] shadow-2xl w-full max-w-[618px] mx-auto lg:ml-auto">
        
        <div className="space-y-[8px] mb-[27px]">
          <h2 className="text-[24px] font-semibold text-gray-900">
            Reserve a Table
          </h2>
          <p className="text-gray-500">
            Fill in the details below to book your table.
          </p>
        </div>

        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >

          {/* 🔥 Branch (styled like input) */}
          {!user?.branchId && (
            <div ref={dropdownRef}>
              <label className="text-sm font-medium text-gray-700">
                Select Branch
              </label>

              <div
                onClick={() => setOpen((prev) => !prev)}
                className="mt-[6px] h-12 px-4 flex items-center justify-between rounded-full bg-[#FAFAF9] border border-gray-200 cursor-pointer"
              >
                <span className="text-sm text-gray-700">
                  {selectedBranch?.name || "Select a branch"}
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
                          setSelectedBranch(b);
                          setOpen(false);
                        }}
                        className={`p-2 rounded-lg cursor-pointer text-sm ${
                          selectedBranch?.id === b.id
                            ? "bg-primary text-white"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        {b.name}
                      </div>
                    ))}

                    {loadingBranches && (
                      <div className="text-center text-sm py-2">
                        Loading...
                      </div>
                    )}
                  </div>

                  {meta?.hasNext && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => fetchBranches()}
                    >
                      Load More
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* DATE + TIME */}
          <div className="grid grid-cols-2 gap-4">
            
            <div>
              <label className="text-sm font-medium text-gray-700">
                Date
              </label>
              <div className="relative mt-[6px]">
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-12 pl-4 pr-10 rounded-full bg-[#FAFAF9]"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Time
              </label>
              <div className="relative mt-[6px]">
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="h-12 pl-4 pr-10 rounded-full bg-[#FAFAF9]"
                />
              </div>
            </div>

          </div>

          {/* GUESTS */}
          <div className="pb-4 border-b-2 border-gray-200">
            <label className="text-base font-medium text-gray-700">
              Number of Guests
            </label>

            <div className="grid grid-cols-4 gap-3 mt-[6px]">
              {[2, 3, 4, 5].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGuestCount(g)}
                  className={`h-[52px] rounded-full font-semibold text-base transition ${
                    guestCount === g
                      ? "bg-primary text-white"
                      : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {g === 5 ? "5+" : g}
                </button>
              ))}
            </div>
          </div>

          {/* NOTE */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Special Request (Optional)
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Allergies, birthday, etc."
              className="resize-none h-[100px] mt-[6px] bg-[#FAFAF9] rounded-lg border-2 border-gray-200"
            />
          </div>

          {/* SUBMIT */}
          <Button type="submit" className="text-white w-full py-4" disabled={loading}>
            {loading ? "Reserving..." : "Confirm Reservation"}
          </Button>
        </form>
      </div>
    </div>
  </main>
);
}