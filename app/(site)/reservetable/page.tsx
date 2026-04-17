"use client";

import Image from "next/image";
import { Star, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import ReservationSuccess from "./ReservationSuccess";
import AsyncSelect from "@/components/ui/AsyncSelect";

export default function ReserveTablePage() {
  const { token, user } = useAuth();
  const { post, get, loading } = useApi(token);

 const [success, setSuccess] = useState(false);
  const [reservationData, setReservationData] = useState<any>(null);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guestCount, setGuestCount] = useState(2);
  const [note, setNote] = useState("");

  const [selectedBranch, setSelectedBranch] = useState<any>(null);

  const customerId = user?.id;
useEffect(() => {
  const prefillSelectedBranch = async () => {
    if (!user?.branchId) return;

    try {
      const res = await get(`/v1/branches/${user.branchId}`);
      if (res?.data) {
        setSelectedBranch(res.data);
      }
    } catch (error) {
      console.error("Failed to prefill selected branch:", error);
    }
  };

  prefillSelectedBranch();
}, [user?.branchId]);
  /* ---------------- FETCH ---------------- */
  const fetchBranches = async ({ search = "", page = 1 }) => {
    return await get(
      `/v1/branches?restaurantId=${user?.restaurantId}&search=${search}&page=${page}`
    );
  };

  const handleBranchSelect = (branch: any) => {
    setSelectedBranch(branch);
    setTime("");
  };

  /* ---------------- DAY ---------------- */
  const selectedDay = useMemo(() => {
    if (!date) return null;
    return new Date(date)
      .toLocaleDateString("en-US", { weekday: "long" })
      .toUpperCase();
  }, [date]);

  /* ---------------- HOURS (SAFE MATCH) ---------------- */
  const todaysHours = useMemo(() => {
    const hours = selectedBranch?.settings?.openingHours;
    if (!hours || !selectedDay) return null;

    return hours.find((h: any) => {
      const apiDay = String(h.dayOfWeek || "")
        .trim()
        .toUpperCase();
      return apiDay === selectedDay;
    });
  }, [selectedBranch, selectedDay]);

  const isClosed = !!todaysHours?.isClosed;

  /* ---------------- VALIDATION ---------------- */
  const isTimeInRange = (t: string) => {
    if (!todaysHours || isClosed) return false;
    if (!t) return false;

    const toMin = (x: string) => {
      const [h, m] = x.split(":").map(Number);
      return h * 60 + m;
    };

    const selected = toMin(t);
    const open = toMin(todaysHours.openTime);
    const close = toMin(todaysHours.closeTime);

    return selected >= open && selected <= close;
  };

  const timeError = useMemo(() => {
    if (!date || !time || !todaysHours) return "";

    if (isClosed) return "This branch is closed on selected day.";
    if (!isTimeInRange(time)) return "Selected time is outside opening hours.";

    return "";
  }, [date, time, todaysHours]);

  /* ---------------- SUBMIT ---------------- */
  async function handleSubmit() {
    try {
      if (!customerId) return toast.error("User not found");

      if (!selectedBranch?.id) {
        return toast.error("Please select a branch");
      }

      if (!date || !time) {
        return toast.error("Select date & time");
      }

      if (timeError) {
        return toast.error(timeError);
      }

      const reservationDate = new Date(`${date}T${time}`).toISOString();

      const res = await post(
        `/v1/customer-app/table-reservations?customerId=${customerId}`,
        {
          branchId: selectedBranch.id,
          reservationDate,
          guestCount,
          note,
        }
      );

      if (!res || res.error) {
        return toast.error(res?.error || "Failed");
      }

      toast.success("Reservation confirmed 🎉");

      setSuccess(true);
      setReservationData(res.data);

      setDate("");
      setTime("");
      setGuestCount(2);
      setNote("");
      setSelectedBranch(null);
    } catch {
      toast.error("Something went wrong");
    }
  }

  if (success) return <ReservationSuccess data={reservationData} />;

  const hasOpeningHours = !!selectedBranch?.settings?.openingHours;

  return (
    <main className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">

      {/* BG */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/reserve-table-bg.jpg"
          alt="bg"
          fill
          className="object-cover opacity-10"
        />
      </div>

      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 grid lg:grid-cols-2 gap-12 py-12">

        {/* LEFT */}
        <div className="space-y-3 mt-10">
          <h1 className="text-[60px] font-bold">
            Taste The <span className="text-primary block">Extraordinary</span>
          </h1>

          <p className="text-gray-600">
            Book your perfect dining experience effortlessly.
          </p>

          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span>4.9</span>
            <span className="text-gray-500">(2.7k reviews)</span>
          </div>
        </div>

        {/* RIGHT */}
        <div className="bg-white rounded-2xl p-10 shadow-xl">

         <div className="space-y-[2px] mb-[27px]">
            <h2 className="text-[23px] font-semibold text-gray-900">
              Reserve a Table
            </h2>
            <p className="text-gray-500 text-sm">
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

            {/* BRANCH */}
            <div>
              <label className="text-sm font-medium">Select Branch</label>

              <div className="mt-2 flex items-center gap-2">
                <AsyncSelect
                  value={selectedBranch}
                  onChange={handleBranchSelect}
                  placeholder="Choose branch"
                  fetchOptions={fetchBranches}
                />

                {/* INFO TOOLTIP */}
                {hasOpeningHours && (
                  <div className="relative group">
                    <Info className="w-4 h-4 text-gray-500 cursor-pointer" />

                    <div className="absolute left-0 top-6 hidden group-hover:block bg-white border shadow-xl rounded-xl p-3 text-xs w-[240px] z-50">
                      <p className="font-semibold mb-2">Opening Hours</p>

                      <div className="space-y-1">
                        {selectedBranch.settings.openingHours.map((h: any) => (
                          <div key={h.dayOfWeek} className="flex justify-between">
                            <span>{h.dayOfWeek.slice(0, 3)}</span>
                            <span>
                              {h.isClosed
                                ? "Closed"
                                : `${h.openTime} - ${h.closeTime}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* DATE + TIME */}
            <div className="grid grid-cols-2 gap-4">

              <div>
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setTime("");
                  }}
                  className="mt-2 rounded-full bg-[#FAFAF9] pr-11"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Time</label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="mt-2 rounded-full bg-[#FAFAF9] pr-25"
                />

                {/* INLINE ERROR */}
                {timeError && (
                  <p className="text-xs text-red-500 mt-1">{timeError}</p>
                )}
              </div>

            </div>

            {/* GUEST */}
            <div>
              <label className="text-sm font-medium">Guests</label>

              <div className="grid grid-cols-4 gap-2 mt-2">
                {[2, 3, 4, 5].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGuestCount(g)}
                    className={`py-2 rounded-full ${
                      guestCount === g
                        ? "bg-primary text-white"
                        : "bg-gray-100"
                    }`}
                  >
                    {g === 5 ? "5+" : g}
                  </button>
                ))}
              </div>
            </div>

            {/* NOTE */}
            <div>
              <label className="text-sm font-medium">
                Special Request
              </label>

              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Birthday, allergies, window seat..."
                className="mt-2 bg-[#FAFAF9] rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
              />

              <p className="text-xs text-gray-500 mt-1">
                Tip: Add occasion details for better experience
              </p>
            </div>

            {/* SUBMIT */}
            <Button className="w-full py-4 text-white" disabled={loading}>
              {loading ? "Reserving..." : "Confirm Reservation"}
            </Button>

          </form>
        </div>
      </div>
    </main>
  );
}