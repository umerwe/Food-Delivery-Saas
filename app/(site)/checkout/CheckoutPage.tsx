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
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useAuth } from "@/hooks/useAuth";





const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getSelectedModifierTotal = (cartItem: any) => {
  const selectedModifiers = Array.isArray(cartItem?.modifiers)
    ? cartItem.modifiers
    : [];

  const modifierGroups = Array.isArray(cartItem?.menuItem?.modifierGroups)
    ? cartItem.menuItem.modifierGroups
    : [];

  const modifierPriceMap = new Map<string, number>();

  modifierGroups.forEach((group: any) => {
    const modifiers = Array.isArray(group?.modifiers) ? group.modifiers : [];

    modifiers.forEach((modifier: any) => {
      if (!modifier?.id) return;
      modifierPriceMap.set(String(modifier.id), toNumber(modifier.priceDelta, 0));
    });
  });

  return selectedModifiers.reduce((acc: number, selected: any) => {
    const modifierId = String(selected?.modifierId || "");
    const quantity = toNumber(selected?.quantity, 1);

    return acc + toNumber(modifierPriceMap.get(modifierId), 0) * quantity;
  }, 0);
};

const getCartItemUnitPrice = (cartItem: any) => {
  const resolvedItemPrice = toNumber(
    cartItem?.unitPrice ??
      cartItem?.price ??
      cartItem?.menuItem?.unitPrice ??
      cartItem?.menuItem?.selectedVariation?.price ??
      0,
    0
  );

  return resolvedItemPrice + getSelectedModifierTotal(cartItem);
};



export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const activeTab = type === "pickup" ? "pickup" : "delivery";
const [couponCode, setCouponCode] = useState("");
const [couponDiscount, setCouponDiscount] = useState(0);
const [validatingCoupon, setValidatingCoupon] = useState(false);
const { user, token } = useAuthContext();
const { get, patch, del, post } = useApi(token);
const [cartItems, setCartItems] = useState<any[]>([]);
const [loadingCart, setLoadingCart] = useState(false);
const router = useRouter();
const customerId = user?.id;
const [stripePayment, setStripePayment] = useState<any>({
  open: false,
  clientSecret: "",
  publishableKey: "",
  paymentId: "",
  orderId: "",
});

  const fetchCart = async () => {
  try {
    setLoadingCart(true);

    const res = await get(`/v1/cart?customerId=${customerId}`);

    const items = res?.data?.items || [];

 const formatted = items.map((i: any) => {
  const quantity = toNumber(i.quantity, 1);
  const unitPrice = getCartItemUnitPrice(i);

  return {
    id: i.id,
    menuItemId: i.menuItemId,
    quantity,
    name: i.menuItem?.name || "Untitled Item",
    price: unitPrice,
    unitPrice,
    lineTotal: unitPrice * quantity,
    desc: i.menuItem?.description || "",
    img: i.menuItem?.imageUrl || "",
    selectedVariationName: i.menuItem?.selectedVariation?.name || "",
  };
});

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
  paymentMethod:
    paymentMethod === "card"
      ? "STRIPE"
      : paymentMethod === "wallet"
      ? "WALLET"
      : "COD",
  customerNote: note,
});

    if (!res || res.error) {
      toast.error(res?.error || "Checkout failed");
      return;
    }

    const orderId = res?.data?.id;

if (!orderId) {
  return toast.error("Invalid order response");
}

// ✅ COD → direct success
if (paymentMethod === "card") {
  // STRIPE FLOW

  const attemptRes = await post(
    `/v1/payments/orders/${orderId}/attempts`,
    {
      paymentMethod: "STRIPE",
      currency: "USD",
      note: "Order payment",
    }
  );

  if (!attemptRes?.success) {
    return toast.error("Failed to initiate payment");
  }

  const payment = attemptRes?.data;

  // 🔥 open stripe modal (we’ll build below)
  setStripePayment({
    open: true,
    clientSecret: payment?.providerData?.clientSecret,
    publishableKey: payment?.providerData?.publishableKey,
    paymentId: payment?.id,
    orderId,
  });

  return;
}

// ✅ WALLET (optional)
if (paymentMethod === "wallet") {
  toast.success("Paid using wallet");

  await clearCart();
  router.push(`/order?success=true&orderId=${orderId}`);
  return;
}

// ✅ COD
toast.success("Order placed successfully");

await clearCart();
router.push(`/order?success=true&orderId=${orderId}`);

  } catch (err) {
    console.error(err);
    toast.error("Order failed");
  } finally {
    setPlacingOrder(false);
  }
};

const subtotal = cartItems.reduce(
  (acc, item) => acc + Number(item.lineTotal ?? item.price * item.quantity),
  0
);

const menuItemIds = cartItems.map((i) => i.menuItemId);

const validateCoupon = async () => {
  if (!couponCode) {
    return toast.error("Enter coupon code");
  }

  try {
    setValidatingCoupon(true);

    const res = await post(`/v1/coupons/validate`, {
      code: couponCode,
      branchId: user?.branchId || user?.restaurantId, // adjust based on your model
      subtotal,
      menuItemIds,
      categoryIds: [], // optional for now
      customerId,
    });

    if (!res || res.error) {
      setCouponDiscount(0);
      return toast.error(res?.error || "Invalid coupon");
    }

    // ⚠️ adjust based on API response structure
    const discount = res?.data?.discountAmount || 0;

    setCouponDiscount(discount);

    toast.success("Coupon applied");
  } catch (err) {
    console.error(err);
    toast.error("Coupon validation failed");
  } finally {
    setValidatingCoupon(false);
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

     couponCode={couponCode}
  setCouponCode={setCouponCode}
  onApplyCoupon={validateCoupon}
  couponDiscount={couponDiscount}
  validatingCoupon={validatingCoupon}

/>
        </div>

      </div>

      {stripePayment.open && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 ">
    <div className="bg-white rounded-2xl p-6 w-[400px] max-h-[90vh] overflow-auto">
      <h2 className="text-lg font-semibold mb-4">
        Complete Payment
      </h2>

      <Elements
        stripe={loadStripe(stripePayment.publishableKey)}
        options={{ clientSecret: stripePayment.clientSecret }}
      >
        <OrderStripeCheckout
          clientSecret={stripePayment.clientSecret}
          paymentId={stripePayment.paymentId}
          onSuccess={async () => {
            setStripePayment({ open: false });

            await clearCart();
            router.push(
              `/order?success=true&orderId=${stripePayment.orderId}`
            );
          }}
          onFail={() => {
            setStripePayment({ open: false });
          }}
        />
      </Elements>
    </div>
  </div>
)}

    </div>
  );
}








const OrderStripeCheckout = ({
  clientSecret,
  paymentId,
  onSuccess,
  onFail,
}: any) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const {token} = useAuth();
  const { post } = useApi(token);

  const handlePay = async () => {
    if (!stripe || !elements) return;

    setLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      await post(`/v1/payments/${paymentId}/fail`, {
        note: error.message,
      });

      toast.error(error.message || "Payment failed");
      setLoading(false);
      onFail();
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      await post(`/v1/payments/${paymentId}/mark-paid`, {
        providerRef: paymentIntent.id,
        providerData: paymentIntent,
        note: "Stripe success",
      });

      toast.success("Payment successful");
      onSuccess();
    }

    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <PaymentElement />

      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full h-11 rounded-xl text-white"
        style={{ background: "var(--primary)" }}
      >
        {loading ? "Processing..." : "Pay Now"}
      </button>
    </div>
  );
};