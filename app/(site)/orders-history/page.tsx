"use client";

import Image from "next/image";
import { Star } from "lucide-react";

const orders = [
  {
    id: "#48291",
    name: "McDonald's® (Paris Hotel De Ville)",
    price: 45.5,
    status: "Delivered",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
    items:
      "Menu Beef BBQ - 1 Vande (x2), Garden Vegetable Salad (x1), Coca Cola Zero (x2)",
    rating: 4,
    review: false,
  },
  {
    id: "#48291",
    name: "La Piazza Ristorante",
    price: 45.5,
    status: "Delivered",
    image: "https://images.unsplash.com/photo-1594007654729-407eedc4be65",
    items:
      "Menu Beef BBQ - 1 Vande (x2), Garden Vegetable Salad (x1), Coca Cola Zero (x2)",
    rating: 0,
    review: true,
  },
  {
    id: "#48291",
    name: "Sushi World",
    price: 45.5,
    status: "Delivered",
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351",
    items:
      "Menu Beef BBQ - 1 Vande (x2), Garden Vegetable Salad (x1), Coca Cola Zero (x2)",
    rating: 4,
    review: false,
  },
  {
    id: "#48291",
    name: "Green Garden Salads",
    price: 45.5,
    status: "Cancelled",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
    items:
      "Menu Beef BBQ - 1 Vande (x2), Garden Vegetable Salad (x1), Coca Cola Zero (x2)",
    rating: 0,
    review: false,
  },
];

export default function Page() {
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        {/* TITLE */}
        <h1 className="text-lg sm:text-[22px] font-semibold text-gray-900 mb-5 sm:mb-6">
          Your Order History
        </h1>

        {/* LIST */}
        <div className="space-y-4 sm:space-y-5">
          {orders.map((order, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-sm overflow-hidden border border-[#F2F2F2]"
            >

              {/* TOP SECTION */}
              <div className="flex flex-col sm:flex-row gap-4 p-4">

                {/* IMAGE */}
                <div className="relative w-full sm:w-[110px] h-[180px] sm:h-[90px] rounded-xl overflow-hidden shrink-0">
                  <Image
                    src={order.image}
                    alt={order.name}
                    fill
                    className="object-cover"
                  />

                  <span
                    className={`absolute top-2 left-2 text-[11px] px-2 py-[3px] rounded-md font-medium ${
                      order.status === "Delivered"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* CONTENT */}
                <div className="flex-1">

                  {/* HEADER */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">

                    <div className="min-w-0">
                      <h2 className="text-[14px] sm:text-[15px] font-semibold text-gray-900 leading-tight break-words">
                        {order.name}
                      </h2>

                      <p className="text-[11px] text-gray-400 mt-[2px]">
                        Order {order.id} · Oct 24, 2023 at 8:45 PM
                      </p>
                    </div>

                    {/* PRICE (moves under on mobile) */}
                    <p className="text-[14px] sm:text-[15px] font-semibold text-gray-900">
                      ${order.price.toFixed(2)}
                    </p>
                  </div>

                  {/* ITEMS */}
                  <p className="text-[12px] text-gray-500 mt-2 leading-relaxed break-words">
                    <span className="font-medium text-gray-600">Items:</span>{" "}
                    {order.items}
                  </p>

                  {/* ACTIONS */}
                  <div className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-3">
                    <button className="w-full sm:w-auto text-[12px] px-3 py-[7px] border border-primary text-primary rounded-md hover:bg-orange-50 transition">
                      View Details
                    </button>

                    <button
                      disabled={order.status === "Cancelled"}
                      className={`w-full sm:w-auto text-[12px] px-3 py-[7px] rounded-md text-white transition ${
                        order.status === "Cancelled"
                          ? "bg-primary cursor-not-allowed"
                          : "bg-primary hover:bg-orange-600"
                      }`}
                    >
                      Reorder
                    </button>
                  </div>
                </div>
              </div>

              {/* BOTTOM BAR */}
              <div className="bg-[#f6f6f6] border-t border-[#F2F2F2] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 px-4 py-3">

                {order.review ? (
                  <span className="text-[12px] text-primary cursor-pointer hover:underline">
                    Write a review
                  </span>
                ) : order.status === "Delivered" ? (
                  <>
                    <span className="text-[12px] text-gray-400">
                      How was your food?
                    </span>

                    <div className="flex gap-[2px]">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={
                            star <= order.rating
                              ? "fill-orange-400 text-orange-400"
                              : "text-gray-300"
                          }
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <span className="text-[12px] text-gray-400">
                    Order was cancelled
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* PAGINATION */}
        <div className="flex flex-wrap justify-center mt-6 sm:mt-8 gap-2">
          {["<", "1", "2", "3", "4", "5", "...", "9", ">"].map((p, i) => (
            <button
              key={i}
              className={`w-8 h-8 text-sm rounded-md border flex items-center justify-center ${
                p === "1"
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}