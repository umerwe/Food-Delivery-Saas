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

// ✅ SET ORDER TYPE
const setOrderType = async () => {
  try {
    await patch(`/v1/cart/order-type?customerId=${customerId}`, {
      orderType: activeTab === "pickup" ? "PICKUP" : "DELIVERY",
    });
  } catch (err) {
    console.error(err);
    throw new Error("Failed to set order type");
  }
};

// ✅ SET ADDRESS (only for delivery)
const setCartAddress = async () => {
  if (activeTab !== "delivery") return;

  try {
    await patch(`/v1/cart/address?customerId=${customerId}`, {
      deliveryAddressId: selectedAddress,
    });
  } catch (err) {
    console.error(err);
    throw new Error("Failed to set address");
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

    // ✅ 1. set order type
    await setOrderType();

    // ✅ 2. set address (if delivery)
    await setCartAddress();

    // ✅ 3. checkout
    const res = await post(`/v1/cart/checkout?customerId=${customerId}`, {
      orderTime: new Date().toISOString(),
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
    <div className="max-w-[1400px] mx-auto mt-[63px] mb-[113px] px-4">
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