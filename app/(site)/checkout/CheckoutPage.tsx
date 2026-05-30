"use client";

import { useEffect, useMemo, useState } from "react";
import Tabs from "@/components/checkout/Tabs";
import DeliverySection from "@/components/checkout/DeliverySection";
import PickupSection from "@/components/checkout/PickupSection";
import CartSummarySection from "@/components/checkout/CartSummarySection";
import { useRouter, useSearchParams } from "next/navigation";
import useApi from "@/hooks/useApi";
import { toast } from "sonner";
import { useAuthContext } from "@/context/AuthContext";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle, X } from "lucide-react";

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeArray = (value: any): any[] => {
  return Array.isArray(value) ? value : [];
};

type BackendErrorState = {
  context: string;
  message: string;
  code?: string;
  path?: string;
  timestamp?: string;
};

const getBackendErrorMessage = (res: any, fallback = "Something went wrong") => {
  if (!res) return fallback;

  const candidates = [
    res?.message,
    res?.error?.message,
    typeof res?.error === "string" ? res.error : "",
    res?.data?.message,
    res?.data?.error?.message,
    typeof res?.data?.error === "string" ? res.data.error : "",
    res?.response?.data?.message,
    res?.response?.data?.error?.message,
    res?.response?.data?.error,
  ];

  const message = candidates.find((entry) => {
    return typeof entry === "string" && entry.trim();
  });

  return String(message || fallback);
};

const getBackendErrorCode = (res: any) => {
  return (
    res?.error?.code ||
    res?.data?.error?.code ||
    res?.response?.data?.error?.code ||
    ""
  );
};

const getBackendErrorMeta = (res: any) => {
  return res?.meta || res?.data?.meta || res?.response?.data?.meta || {};
};

const hasBackendError = (res: any) => {
  return !res || res?.success === false || Boolean(res?.error);
};

function BackendErrorBanner({
  error,
  onDismiss,
}: {
  error: BackendErrorState | null;
  onDismiss: () => void;
}) {
  if (!error) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-red-100 bg-red-50 shadow-sm -mt-10">
      <div className="flex items-start gap-3 p-4 sm:p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
          <AlertTriangle size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-red-900">
              Backend Error
            </p>

            {error.code ? (
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-red-700 ring-1 ring-red-100">
                {error.code}
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-sm leading-6 text-red-800">
            <span className="font-medium">{error.context}:</span>{" "}
            {error.message}
          </p>

          {error.path || error.timestamp ? (
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-red-700/80">
              {error.path ? (
                <span className="rounded-full bg-white/70 px-2 py-1">
                  {error.path}
                </span>
              ) : null}

              {error.timestamp ? (
                <span className="rounded-full bg-white/70 px-2 py-1">
                  {new Date(error.timestamp).toLocaleString()}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-red-700 transition hover:bg-red-100"
          aria-label="Dismiss backend error"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

const getModifierPriceFromGroups = (cartItem: any, modifierId: string) => {
  const modifierGroups = Array.isArray(cartItem?.menuItem?.modifierGroups)
    ? cartItem.menuItem.modifierGroups
    : [];

  for (const group of modifierGroups) {
    const modifiers = Array.isArray(group?.modifiers) ? group.modifiers : [];

    const modifier = modifiers.find(
      (itemModifier: any) => String(itemModifier?.id || "") === modifierId
    );

    if (modifier) {
      return {
        name: modifier?.name || "Add-on",
        unitPrice: toNumber(modifier?.priceDelta, 0),
      };
    }
  }

  return {
    name: "Add-on",
    unitPrice: 0,
  };
};

const getSelectedModifiers = (cartItem: any) => {
  if (Array.isArray(cartItem?.selectedModifiers)) {
    return cartItem.selectedModifiers.map((modifier: any) => {
      const quantity = Math.max(1, toNumber(modifier?.quantity, 1));
      const unitPrice = toNumber(modifier?.unitPrice, 0);
      const total = toNumber(modifier?.total, unitPrice * quantity);

      return {
        modifierId: modifier?.modifierId,
        name: modifier?.name || "Add-on",
        quantity,
        unitPrice,
        total,
      };
    });
  }

  const rawModifiers = Array.isArray(cartItem?.modifiers)
    ? cartItem.modifiers
    : [];

  return rawModifiers.map((modifier: any) => {
    const modifierId = String(modifier?.modifierId || "");
    const quantity = Math.max(1, toNumber(modifier?.quantity, 1));
    const fallbackModifier = getModifierPriceFromGroups(cartItem, modifierId);
    const unitPrice = fallbackModifier.unitPrice;

    return {
      modifierId,
      name: fallbackModifier.name,
      quantity,
      unitPrice,
      total: unitPrice * quantity,
    };
  });
};

const getSelectedSectionLabel = (slot?: string) => {
  const normalizedSlot = String(slot || "").toUpperCase();

  if (normalizedSlot === "LEFT") return "Left half";
  if (normalizedSlot === "RIGHT") return "Right half";

  return normalizedSlot ? `${normalizedSlot} half` : "Selected half";
};

const getSelectedSections = (cartItem: any) => {
  const rawSelectedSections = normalizeArray(cartItem?.selectedSections);
  const rawSections = normalizeArray(cartItem?.sections);
  const allowedFlavors = normalizeArray(cartItem?.menuItem?.splitPizza?.allowedFlavors);

  const selectedSectionBySlot = rawSelectedSections.reduce(
    (acc: Record<string, any>, section: any) => {
      const slot = String(section?.slot || "").toUpperCase();

      if (slot) {
        acc[slot] = section;
      }

      return acc;
    },
    {}
  );

  const resolveMenuItemName = (section: any, selectedSection?: any) => {
    const directName =
      selectedSection?.menuItemName ||
      selectedSection?.menuItem?.name ||
      section?.menuItemName ||
      section?.menuItem?.name;

    if (directName) return directName;

    const menuItemId = section?.menuItemId || selectedSection?.menuItemId;

    if (String(menuItemId || "") === String(cartItem?.menuItem?.id || "")) {
      return cartItem?.menuItem?.name || "Selected pizza";
    }

    const flavor = allowedFlavors.find((item: any) => {
      return String(item?.id || "") === String(menuItemId || "");
    });

    return flavor?.name || "Selected pizza";
  };

  const resolveUnitPrice = (section: any, selectedSection?: any) => {
    return toNumber(
      selectedSection?.unitPrice ??
        selectedSection?.price ??
        section?.unitPrice ??
        section?.price,
      0
    );
  };

  const sourceSections = rawSelectedSections.length ? rawSelectedSections : rawSections;

  return sourceSections
    .map((section: any) => {
      const slot = String(section?.slot || "").toUpperCase();
      const selectedSection = selectedSectionBySlot[slot];
      const menuItemId = section?.menuItemId || selectedSection?.menuItemId;

      return {
        slot,
        label: getSelectedSectionLabel(slot),
        menuItemId,
        menuItemName: resolveMenuItemName(section, selectedSection),
        unitPrice: resolveUnitPrice(section, selectedSection),
      };
    })
    .filter((section: any) => section?.slot || section?.menuItemId);
};

const normalizeCartItem = (item: any) => {
  const quantity = Math.max(1, toNumber(item?.quantity, 1));
  const selectedModifiers = getSelectedModifiers(item);
  const selectedSections = getSelectedSections(item);

  const fallbackModifiersTotal = selectedModifiers.reduce(
    (acc: number, modifier: any) => {
      return acc + toNumber(modifier?.total, 0);
    },
    0
  );

  const highestSplitPizzaHalfPrice = selectedSections.reduce(
    (highestPrice: number, section: any) => {
      return Math.max(highestPrice, toNumber(section?.unitPrice, 0));
    },
    0
  );

  const itemUnitPrice = toNumber(
    item?.unitPrice ??
      (highestSplitPizzaHalfPrice > 0 ? highestSplitPizzaHalfPrice : undefined) ??
      item?.menuItem?.unitPrice ??
      item?.menuItem?.selectedVariation?.price ??
      item?.price,
    0
  );

  const modifiersTotal = toNumber(item?.modifiersTotal, fallbackModifiersTotal);

  const unitPriceWithModifiers = toNumber(
    item?.unitPriceWithModifiers,
    itemUnitPrice + modifiersTotal
  );

  const lineTotal = toNumber(
    item?.lineTotal,
    unitPriceWithModifiers * quantity
  );

  return {
    id: item?.id,
    menuItemId: item?.menuItemId,
    categoryId: item?.menuItem?.category?.id,
    slug: item?.menuItem?.slug,
    quantity,
    name: item?.menuItem?.name || "Untitled Item",
    price: unitPriceWithModifiers,
    unitPrice: itemUnitPrice,
    itemUnitPrice,
    modifiersTotal,
    unitPriceWithModifiers,
    lineTotal,
    desc: item?.menuItem?.description || "",
    img: item?.menuItem?.imageUrl || "",
    selectedVariationName:
      item?.menuItem?.selectedVariation?.displayText ||
      item?.menuItem?.selectedVariation?.name ||
      "",
    selectedVariation: item?.menuItem?.selectedVariation,
    variationId: item?.variationId || item?.menuItem?.selectedVariation?.id,
    selectedModifiers,
    selectedSections,
    sections: selectedSections,
    menuItem: item?.menuItem,
    note: item?.note || "",
    depositAmount: item?.depositAmount ?? item?.menuItem?.depositAmount,
    depositTotal: item?.depositTotal,
    pickupPrice: item?.pickupPrice ?? item?.menuItem?.pickupPrice,
    pickupUnitPrice: item?.pickupUnitPrice,
    takeawayPriceAdjustment: item?.menuItem?.takeawayPriceAdjustment,
    deliveryPriceAdjustment: item?.menuItem?.deliveryPriceAdjustment,
  };
};

const recalculateCartItemQuantity = (item: any, quantity: number) => {
  const safeQuantity = Math.max(1, toNumber(quantity, 1));
  const unitPriceWithModifiers = toNumber(
    item?.unitPriceWithModifiers ?? item?.price,
    0
  );

  const depositUnitAmount = toNumber(item?.depositAmount, 0);
  const depositTotal = depositUnitAmount * safeQuantity;

  return {
    ...item,
    quantity: safeQuantity,
    depositTotal,
    lineTotal: unitPriceWithModifiers * safeQuantity + depositTotal,
  };
};

const normalizeCartResponse = (res: any) => {
  const cart =
    res?.data?.items || res?.data?.quote
      ? res.data
      : res?.data?.data?.items || res?.data?.data?.quote
      ? res.data.data
      : res?.data || {};

  return {
    items: Array.isArray(cart?.items) ? cart.items : [],
    quote: cart?.quote ?? null,
  };
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
  const [cartQuote, setCartQuote] = useState<any | null>(null);
  const [loadingCart, setLoadingCart] = useState(false);
  const [backendError, setBackendError] = useState<BackendErrorState | null>(
    null
  );

  const router = useRouter();
  const customerId = user?.id;

  const reportBackendError = (context: string, res: any, fallback: string) => {
    const meta = getBackendErrorMeta(res);
    const message = getBackendErrorMessage(res, fallback);

    setBackendError({
      context,
      message,
      code: getBackendErrorCode(res),
      path: meta?.path,
      timestamp: meta?.timestamp,
    });

  };

  const clearBackendError = () => {
    setBackendError(null);
  };

  const [stripePayment, setStripePayment] = useState<any>({
    open: false,
    clientSecret: "",
    publishableKey: "",
    paymentId: "",
    orderId: "",
  });

  const stripePromise = useMemo(() => {
    if (!stripePayment.publishableKey) return null;
    return loadStripe(stripePayment.publishableKey);
  }, [stripePayment.publishableKey]);

  const fetchCart = async () => {
    if (!customerId) return;

    try {
      setLoadingCart(true);

      const res = await get(`/v1/cart?customerId=${customerId}`);

      if (hasBackendError(res)) {
        setCartItems([]);
        setCartQuote(null);
        reportBackendError(
          "Backend error while fetching cart",
          res,
          "Failed to fetch cart"
        );
        return;
      }

      const { items, quote } = normalizeCartResponse(res);
      const formatted = items.map((item: any) => normalizeCartItem(item));

      setCartItems(formatted);
      setCartQuote(quote);
      clearBackendError();
    } catch (err: any) {
      console.error(err);
      reportBackendError(
        "Backend error while fetching cart",
        err,
        err?.message || "Failed to fetch cart"
      );
    } finally {
      setLoadingCart(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchCart();
    } else {
      setCartItems([]);
      setCartQuote(null);
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

  useEffect(() => {
    if (!user) return;

    setCustomer((prev) => ({
      ...prev,
      name: `${user.profile?.firstName || ""} ${
        user.profile?.lastName || ""
      }`.trim(),
      phone: user.profile?.phone || "",
      email: user.email || "",
    }));
  }, [user]);

  const updateQuantity = async (id: string, type: "inc" | "dec") => {
    const currentItem = cartItems.find((item) => item.id === id);
    if (!currentItem) return;

    const currentQty = Math.max(1, toNumber(currentItem.quantity, 1));

    const newQty =
      type === "inc" ? currentQty + 1 : Math.max(1, currentQty - 1);

    if (newQty === currentQty) return;

    const previousCartItems = cartItems;

    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        return recalculateCartItemQuantity(item, newQty);
      })
    );

    try {
      const res = await patch(`/v1/cart/items/${id}?customerId=${customerId}`, {
        quantity: newQty,
      });

      if (hasBackendError(res)) {
        setCartItems(previousCartItems);
        reportBackendError(
          "Backend error while updating cart quantity",
          res,
          "Failed to update quantity"
        );
        return;
      }

      await fetchCart();
    } catch (err: any) {
      console.error(err);
      setCartItems(previousCartItems);
      reportBackendError(
        "Backend error while updating cart quantity",
        err,
        err?.message || "Failed to update quantity"
      );
    }
  };

  const deleteItem = async (id: string) => {
    const previousCartItems = cartItems;

    try {
      setCartItems((prev) => prev.filter((item) => item.id !== id));

      const res = await del(`/v1/cart/items/${id}?customerId=${customerId}`);

      if (hasBackendError(res)) {
        setCartItems(previousCartItems);
        reportBackendError(
          "Backend error while removing cart item",
          res,
          "Failed to remove item"
        );
        return;
      }

      await fetchCart();
      toast.success("Item removed");
    } catch (err: any) {
      console.error(err);
      setCartItems(previousCartItems);
      reportBackendError(
        "Backend error while removing cart item",
        err,
        err?.message || "Failed to remove item"
      );
    }
  };

  const clearCart = async () => {
    const previousCartItems = cartItems;
    const previousCartQuote = cartQuote;

    try {
      setCartItems([]);
      setCartQuote(null);

      const res = await del(`/v1/cart?customerId=${customerId}`);

      if (hasBackendError(res)) {
        setCartItems(previousCartItems);
        setCartQuote(previousCartQuote);
        reportBackendError(
          "Backend error while clearing cart",
          res,
          "Failed to clear cart"
        );
        return false;
      }

      clearBackendError();
      return true;
    } catch (err: any) {
      console.error(err);
      setCartItems(previousCartItems);
      setCartQuote(previousCartQuote);
      reportBackendError(
        "Backend error while clearing cart",
        err,
        err?.message || "Failed to clear cart"
      );
      return false;
    }
  };

  const setOrderType = async () => {
    try {
      const res = await patch(`/v1/cart/order-type?customerId=${customerId}`, {
        orderType: activeTab === "pickup" ? "TAKEAWAY" : "DELIVERY",
      });

      if (hasBackendError(res)) {
        reportBackendError(
          "Backend error while setting order type",
          res,
          "Failed to set order type"
        );
        return false;
      }

      clearBackendError();
      return true;
    } catch (err: any) {
      console.error(err);
      reportBackendError(
        "Backend error while setting order type",
        err,
        err?.message || "Failed to set order type"
      );
      return false;
    }
  };

  const setCartAddress = async () => {
    if (activeTab !== "delivery") return true;

    try {
      const res = await patch(`/v1/cart/address?customerId=${customerId}`, {
        deliveryAddressId: selectedAddress,
      });

      if (hasBackendError(res)) {
        reportBackendError(
          "Backend error while setting delivery address",
          res,
          "Failed to set address"
        );
        return false;
      }

      clearBackendError();
      return true;
    } catch (err: any) {
      console.error(err);
      reportBackendError(
        "Backend error while setting delivery address",
        err,
        err?.message || "Failed to set address"
      );
      return false;
    }
  };

  const getOrderTime = () => {
    if (activeTab === "delivery") {
      return new Date().toISOString();
    }

    if (!pickupDate || !pickupTime) return null;

    try {
      const date = new Date(pickupDate);

      if (pickupTime === "ASAP") {
        return new Date().toISOString();
      }

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
        toast.error("Cart is empty");
        return;
      }

      if (activeTab === "delivery" && !selectedAddress) {
        toast.error("Please select address");
        return;
      }

      if (activeTab === "pickup" && (!pickupDate || !pickupTime)) {
        toast.error("Please select pickup date and time");
        return;
      }

      const orderTypeUpdated = await setOrderType();
      if (!orderTypeUpdated) return;

      const addressUpdated = await setCartAddress();
      if (!addressUpdated) return;

      const orderTime = getOrderTime();

      if (!orderTime) {
        toast.error("Invalid order time");
        return;
      }

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

      if (hasBackendError(res)) {
        reportBackendError(
          "Backend error while placing order",
          res,
          "Checkout failed"
        );
        return;
      }

      const orderId = res?.data?.id;

      if (!orderId) {
        reportBackendError(
          "Backend error while placing order",
          res,
          "Invalid order response"
        );
        return;
      }

      clearBackendError();

      if (paymentMethod === "card") {
        const attemptRes = await post(`/v1/payments/orders/${orderId}/attempts`, {
          paymentMethod: "STRIPE",
          currency: "USD",
          note: "Order payment",
        });

        if (hasBackendError(attemptRes) || !attemptRes?.success) {
          reportBackendError(
            "Backend error while initiating payment",
            attemptRes,
            "Failed to initiate payment"
          );
          return;
        }

        const payment = attemptRes?.data;

        setStripePayment({
          open: true,
          clientSecret: payment?.providerData?.clientSecret,
          publishableKey: payment?.providerData?.publishableKey,
          paymentId: payment?.id,
          orderId,
        });

        return;
      }

      if (paymentMethod === "wallet") {
        toast.success("Paid using wallet");

        await clearCart();
        router.push(`/order?success=true&orderId=${orderId}`);
        return;
      }

      toast.success("Order placed successfully");

      await clearCart();
      router.push(`/order?success=true&orderId=${orderId}`);
    } catch (err: any) {
      console.error(err);
      reportBackendError(
        "Backend error while placing order",
        err,
        err?.message || "Order failed"
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  const subtotal = cartItems.reduce((acc, item) => {
    return acc + toNumber(item.lineTotal, item.price * item.quantity);
  }, 0);

  const menuItemIds = cartItems.map((item) => item.menuItemId).filter(Boolean);

  const categoryIds = cartItems
    .map((item) => item.categoryId)
    .filter(Boolean);

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Enter coupon code");
      return;
    }

    try {
      setValidatingCoupon(true);

      const res = await post(`/v1/coupons/validate`, {
        code: couponCode.trim(),
        branchId: user?.branchId || user?.restaurantId,
        subtotal,
        menuItemIds,
        categoryIds,
        customerId,
      });

      if (hasBackendError(res)) {
        setCouponDiscount(0);
        reportBackendError(
          "Backend error while validating coupon",
          res,
          "Invalid coupon"
        );
        return;
      }

      const discount = toNumber(res?.data?.discountAmount, 0);

      setCouponDiscount(discount);
      clearBackendError();
      toast.success("Coupon applied");
    } catch (err: any) {
      console.error(err);
      setCouponDiscount(0);
      reportBackendError(
        "Backend error while validating coupon",
        err,
        err?.message || "Coupon validation failed"
      );
    } finally {
      setValidatingCoupon(false);
    }
  };

  return (
    <div className="mx-auto mb-[113px] mt-[63px] max-w-[1400px] px-4 md:px-30">
      <BackendErrorBanner
        error={backendError}
        onDismiss={() => setBackendError(null)}
      />

      <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
        <div className="space-y-[38px] lg:col-span-7">
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
            quote={cartQuote}
            updateQuantity={updateQuantity}
            deleteItem={deleteItem}
            clearCart={clearCart}
            onPlaceOrder={handlePlaceOrder}
            placingOrder={placingOrder || loadingCart}
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            onApplyCoupon={validateCoupon}
            couponDiscount={couponDiscount}
            validatingCoupon={validatingCoupon}
          />
        </div>
      </div>

      {stripePayment.open && stripePromise && stripePayment.clientSecret ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-[400px] overflow-auto rounded-2xl bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">Complete Payment</h2>

            <Elements
              stripe={stripePromise}
              options={{ clientSecret: stripePayment.clientSecret }}
            >
              <OrderStripeCheckout
                paymentId={stripePayment.paymentId}
                onSuccess={async () => {
                  setStripePayment({
                    open: false,
                    clientSecret: "",
                    publishableKey: "",
                    paymentId: "",
                    orderId: "",
                  });

                  await clearCart();
                  router.push(`/order?success=true&orderId=${stripePayment.orderId}`);
                }}
                onFail={() => {
                  setStripePayment({
                    open: false,
                    clientSecret: "",
                    publishableKey: "",
                    paymentId: "",
                    orderId: "",
                  });
                }}
              />
            </Elements>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const OrderStripeCheckout = ({
  paymentId,
  onSuccess,
  onFail,
}: {
  paymentId: string;
  onSuccess: () => void;
  onFail: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const { token } = useAuth();
  const { post } = useApi(token);

  const handlePay = async () => {
    if (!stripe || !elements) return;

    try {
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
        return;
      }

      toast.error("Payment was not completed");
    } catch (err) {
      console.error(err);
      toast.error("Payment failed");
      onFail();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <PaymentElement />

      <button
        type="button"
        onClick={handlePay}
        disabled={loading || !stripe || !elements}
        className="h-11 w-full rounded-xl text-white disabled:opacity-60"
        style={{ background: "var(--primary)" }}
      >
        {loading ? "Processing..." : "Pay Now"}
      </button>
    </div>
  );
};