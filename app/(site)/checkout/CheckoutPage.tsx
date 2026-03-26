"use client";

import { useEffect, useState } from "react";
import Tabs from "@/components/checkout/Tabs";
import DeliverySection from "@/components/checkout/DeliverySection";
import PickupSection from "@/components/checkout/PickupSection";
import CartSummarySection from "@/components/checkout/CartSummarySection";
import { useRouter, useSearchParams } from "next/navigation";
import useApi from "@/hooks/useApi";
import { toast } from "sonner";
import { useAuthContext } from "@/context/AuthContext";

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const activeTab = type === "pickup" ? "pickup" : "delivery";

const { user, token } = useAuthContext();
const { get, patch, del, post } = useApi(token);
const [cartItems, setCartItems] = useState<any[]>([]);
const [loadingCart, setLoadingCart] = useState(false);
const router = useRouter();
const customerId = user?.id;


  const fetchCart = async () => {
  try {
    setLoadingCart(true);

    const res = await get(`/v1/cart?customerId=${customerId}`);

    const items = res?.data?.items || [];

  const formatted = items.map((i: any) => ({
  id: i.id, // cart item id
  menuItemId: i.menuItemId, // ✅ IMPORTANT
  quantity: i.quantity,
  name: i.menuItem.name,
  price: Number(i.menuItem.unitPrice),
  desc: i.menuItem.description,
  img: i.menuItem.imageUrl,
}));

    setCartItems(formatted);
  } catch (err) {
    console.error(err);
  } finally {
    setLoadingCart(false);
  }
};
useEffect(() => {
  if (customerId) {
    fetchCart();
  }
}, [customerId]);

  const [selectedAddress, setSelectedAddress] = useState<string | null>("");
  const [note, setNote] = useState("");
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("card");
const [placingOrder, setPlacingOrder] = useState(false);
  const [pickupDate, setPickupDate] = useState<number | null>(null);
  const [pickupTime, setPickupTime] = useState<string | null>(null);
// ✅ PREFILL CUSTOMER FROM AUTH USER
useEffect(() => {
  if (!user) return;

  setCustomer((prev) => ({
    ...prev,
    name: `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim(),
    phone: user.profile?.phone || "",
    email: user.email || "",
  }));
}, [user]);
  // ✅ CART UPDATE
  const updateQuantity = async (id: string, type: "inc" | "dec") => {
  const item = cartItems.find((i) => i.id === id);
  if (!item) return;

  const newQty = type === "inc"
    ? item.quantity + 1
    : Math.max(1, item.quantity - 1);

  try {
    await patch(`/v1/cart/items/${id}?customerId=${customerId}`, {
      quantity: newQty,
    });

    setCartItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, quantity: newQty } : i
      )
    );
  } catch (err) {
    console.error(err);
    toast.error("Failed to update quantity");
  }
};


const deleteItem = async (id: string) => {
  try {
    await del(`/v1/cart/items/${id}?customerId=${customerId}`);
    toast.success("Item removed");

    setCartItems((prev) => prev.filter((i) => i.id !== id));
  } catch (err) {
    toast.error("Failed to remove item");
  }
};

const clearCart = async () => {
  try {
    await del(`/v1/cart?customerId=${customerId}`);
    setCartItems([]);
    // toast.success("Cart cleared");
  } catch (err) {
    toast.error("Failed to clear cart");
  }
};

const setOrderType = async () => {
  try {
    const res = await patch(`/v1/cart/order-type?customerId=${customerId}`, {
      orderType: activeTab === "pickup" ? "TAKEAWAY" : "DELIVERY",
    });

    if (!res || res.error) {
      toast.error(res?.error || "Failed to set order type");
      return false;
    }

    return true;
  } catch (err) {
    console.error(err);
    toast.error("Failed to set order type");
    return false;
  }
};

const setCartAddress = async () => {
  if (activeTab !== "delivery") return true; // ✅ no-op but success

  try {
    const res = await patch(`/v1/cart/address?customerId=${customerId}`, {
      deliveryAddressId: selectedAddress,
    });

    if (!res || res.error) {
      toast.error(res?.error || "Failed to set address");
      return false;
    }

    return true;
  } catch (err) {
    console.error(err);
    toast.error("Failed to set address");
    return false;
  }
};

// ✅ BUILD ORDER TIME (handles pickup + delivery)
const getOrderTime = () => {
  if (activeTab === "delivery") {
    return new Date().toISOString();
  }

  if (!pickupDate || !pickupTime) return null;

  try {
    const date = new Date(pickupDate);

    // ✅ HANDLE ASAP
    if (pickupTime === "ASAP") {
      return new Date().toISOString();
    }

    // ✅ Parse "7:00 AM" / "1:00 PM"
    const [time, modifier] = pickupTime.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (modifier === "PM" && hours !== 12) {
      hours += 12;
    }
    if (modifier === "AM" && hours === 12) {
      hours = 0;
    }

    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    date.setMilliseconds(0);

    return date.toISOString();
  } catch (err) {
    console.error("Invalid pickup date/time", err);
    return null;
  }
};

const handlePlaceOrder = async () => {
  try {
    setPlacingOrder(true);

    if (!cartItems.length) {
      return toast.error("Cart is empty");
    }

    if (activeTab === "delivery" && !selectedAddress) {
      return toast.error("Please select address");
    }
    // ✅ pickup validation
if (activeTab === "pickup" && (!pickupDate || !pickupTime)) {
  return toast.error("Please select pickup date and time");
}

    // ✅ 1. set order type
    await setOrderType();

    // ✅ 2. set address (if delivery)
    await setCartAddress();

    // ✅ 3. checkout
  const orderTime = getOrderTime();

if (!orderTime) {
  return toast.error("Invalid order time");
}

// ✅ 3. checkout
const res = await post(`/v1/cart/checkout?customerId=${customerId}`, {
  orderTime,
  paymentMethod: paymentMethod === "card" ? "COD" : "COD",
  customerNote: note,
});

    if (!res || res.error) {
      toast.error(res?.error || "Checkout failed");
      return;
    }

    const orderId = res?.data?.id;

    toast.success("Order placed successfully");

    // ✅ clear cart
    await clearCart();

    // ✅ redirect
    router.push(`/order?success=true&orderId=${orderId}`);

  } catch (err) {
    console.error(err);
    toast.error("Order failed");
  } finally {
    setPlacingOrder(false);
  }
};
  
  return (
    <div className="max-w-[1400px] mx-auto mt-[63px] mb-[113px] px-4 md:px-30">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

        <div className="lg:col-span-7 space-y-[38px]">
          <Tabs activeTab={activeTab} />

          {activeTab === "delivery" ? (
            <DeliverySection
              selectedAddress={selectedAddress}
              setSelectedAddress={setSelectedAddress}
              note={note}
              setNote={setNote}
              customer={customer}
              setCustomer={setCustomer}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
            />
          ) : (
            <PickupSection
              selectedAddress={selectedAddress}
              setSelectedAddress={setSelectedAddress}
              note={note}
              setNote={setNote}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              pickupDate={pickupDate}
              setPickupDate={setPickupDate}
              pickupTime={pickupTime}
              setPickupTime={setPickupTime}
            />
          )}
        </div>

        <div className="lg:col-span-5">
         <CartSummarySection
  cartItems={cartItems}
  updateQuantity={updateQuantity}
  deleteItem={deleteItem}
  clearCart={clearCart}
  onPlaceOrder={handlePlaceOrder}
   placingOrder={placingOrder}
/>
        </div>

      </div>
    </div>
  );
}