"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Tabs from "@/components/pages/Checkout/components/Tabs";
import { DeliverySection } from "@/components/pages/Checkout/components/DeliverySection";
import { PickupSection } from "@/components/pages/Checkout/components/PickupSection";
import { CartSummarySection } from "@/components/pages/Checkout/components/CartSummarySection";
import { useRouter, useSearchParams } from "next/navigation";
import { useCheckout } from "@/hooks/useCheckout";
import { useCart } from "@/hooks/useCart";
import useReservations from "@/hooks/useReservations";
import { toast } from "sonner";
import { useAuthContext } from "@/hooks/useAuth";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useAuth } from "@/hooks/useAuth";
import type { ApiRecord, BackendErrorState, CartItem } from "@/components/pages/Checkout/utils/checkout-normalizers";
import { asRecord, getBackendErrorCode, getBackendErrorMessage, getBackendErrorMeta, hasBackendError, normalizeCartItem, normalizeCartQuote, normalizeCartResponse, recalculateCartItemQuantity, toNumber } from "@/components/pages/Checkout/utils/checkout-normalizers";
import type { BranchRecord } from "@/types/branch-selector";
import { useTranslations } from "next-intl";
import { normalizeCheckoutTipAmount, type CheckoutAddressValues } from "@/validations/checkout";

const emptyGuestDeliveryAddress: CheckoutAddressValues = {
  street: "",
  postalCode: "",
  city: "",
  state: "",
  country: "",
  area: "",
  lat: "",
  lng: "",
  isDefault: false,
};

type GuestPrivacyPolicy = {
  title: string;
  content: string;
  policyLink: string;
};

const isGuestUser = (user: ReturnType<typeof useAuthContext>["user"]) =>
  user?.isGuest === true || String(user?.role || "").toUpperCase() === "GUEST";

const getCheckoutRestaurantId = (user: ReturnType<typeof useAuthContext>["user"]) =>
  user?.restaurantId || user?.branch?.restaurantId || user?.tenantId || "";

const normalizeGuestPrivacyPolicy = (value: unknown, restaurantId: string): GuestPrivacyPolicy => {
  const record = asRecord(value);
  const title = typeof record.title === "string" && record.title.trim()
    ? record.title.trim()
    : "Privacy Policy";
  const content = typeof record.content === "string" ? record.content.trim() : "";
  const policyLink = typeof record.policyLink === "string" && record.policyLink.trim()
    ? record.policyLink.trim()
    : `/api/v1/public-content/privacy-policy?restaurantId=${encodeURIComponent(restaurantId)}`;

  return {
    title,
    content,
    policyLink,
  };
};

const trimAddress = (address: CheckoutAddressValues) => ({
  street: address.street.trim(),
  area: address.area.trim(),
  postalCode: address.postalCode.trim(),
  city: address.city.trim(),
  state: address.state.trim(),
  country: address.country.trim(),
  lat: address.lat.trim(),
  lng: address.lng.trim(),
});

const getGuestDeliveryAddressPayload = (address: CheckoutAddressValues) => {
  const trimmed = trimAddress(address);

  return {
    street: trimmed.street,
    area: trimmed.area,
    postalCode: trimmed.postalCode,
    city: trimmed.city,
    state: trimmed.state,
    country: trimmed.country,
    lat: trimmed.lat,
    lng: trimmed.lng,
  };
};

const hasGuestDeliveryAddress = (address: CheckoutAddressValues) => {
  const trimmed = trimAddress(address);

  return Boolean(trimmed.street && trimmed.postalCode && trimmed.city && trimmed.country);
};

const getGuestContactPayload = (
  customer: { name: string; phone: string; email: string },
  privacyPolicyAccepted: boolean
) => {
  return {
    email: customer.email.trim(),
    phone: customer.phone.trim(),
    privacyPolicyAccepted,
  };
};

const hasGuestContact = (customer: { name: string; phone: string; email: string }) => {
  return Boolean(customer.email.trim() && customer.phone.trim());
};

function CheckoutPageContent() {
  const t = useTranslations("checkout");
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const { user, token } = useAuthContext();
  const preferredCheckoutType = user?.selectedOrderType === "TAKEAWAY" ? "pickup" : "delivery";
  const activeTab = type === "pickup" || type === "delivery" ? type : preferredCheckoutType;
  const isGuest = isGuestUser(user);
  const restaurantId = getCheckoutRestaurantId(user);

  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [applyingTip, setApplyingTip] = useState(false);

  const { get, patch, del, post, checkoutCustomerCart } = useCheckout(token);
  const { updateCustomerCart, quoteCustomerCart } = useCart(token);
  const { fetchReservationBranch } = useReservations(token);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartQuote, setCartQuote] = useState<ApiRecord | null>(null);
  const [appliedTipAmount, setAppliedTipAmount] = useState(0);
  const [loadingCart, setLoadingCart] = useState(true);
  const [backendError, setBackendError] = useState<BackendErrorState | null>(
    null
  );

  const router = useRouter();
  const customerId = user?.id;

  const reportBackendError = (context: string, res: unknown, fallback: string) => {
    const meta = getBackendErrorMeta(res);
    const message = getBackendErrorMessage(res, fallback);

    setBackendError({
      context,
      message,
      code: getBackendErrorCode(res),
      timestamp: typeof meta?.timestamp === "string" ? meta.timestamp : undefined,
    });

    toast.error(message);
  };

  const clearBackendError = () => {
    setBackendError(null);
  };

  const applyTipToCurrentQuote = (tipAmount: number) => {
    setCartQuote((currentQuote) => {
      if (!currentQuote) return currentQuote;

      return {
        ...currentQuote,
        tipAmount,
      };
    });
  };

  const [stripePayment, setStripePayment] = useState<{ open: boolean; clientSecret: string; publishableKey: string; paymentId: string; orderId: string | number }>({
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
          t("toast.failedFetchCart"),
          res,
          t("toast.failedFetchCart")
        );
        return;
      }

      const { items, quote } = normalizeCartResponse(res);
      const formatted = items.map((item) => normalizeCartItem(item));

      setCartItems(formatted);
      setCartQuote(quote);
      setAppliedTipAmount((previousTipAmount) =>
        quote ? Math.max(0, toNumber(quote.tipAmount, 0)) : previousTipAmount
      );
      clearBackendError();
    } catch (err) {
      reportBackendError(
        t("toast.failedFetchCart"),
        err,
        err instanceof Error ? err.message : t("toast.failedFetchCart")
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
      setAppliedTipAmount(0);
      setLoadingCart(false);
    }
  }, [customerId]);

  const [selectedAddress, setSelectedAddress] = useState<string | null>("");
  const [guestDeliveryAddress, setGuestDeliveryAddress] =
    useState<CheckoutAddressValues>(emptyGuestDeliveryAddress);
  const [note, setNote] = useState("");
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false);
  const [guestPrivacyPolicy, setGuestPrivacyPolicy] =
    useState<GuestPrivacyPolicy | null>(null);
  const [privacyPolicyLoading, setPrivacyPolicyLoading] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("card");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [pickupTime, setPickupTime] = useState<string | null>(null);
  const [pickupBranch, setPickupBranch] = useState<BranchRecord | null>(null);
  const [scheduledDeliveryValue, setScheduledDeliveryValue] = useState("");

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

  useEffect(() => {
    if (!isGuest) {
      setGuestPrivacyPolicy(null);
      setPrivacyPolicyAccepted(false);
      return;
    }

    if (!restaurantId) return;

    let isMounted = true;

    const loadGuestPrivacyPolicy = async () => {
      try {
        setPrivacyPolicyLoading(true);

        const res = await get(
          `/v1/public-content/privacy-policy?restaurantId=${encodeURIComponent(restaurantId)}`
        );

        if (!isMounted) return;

        if (hasBackendError(res)) {
          setGuestPrivacyPolicy(
            normalizeGuestPrivacyPolicy(undefined, restaurantId)
          );
          return;
        }

        setGuestPrivacyPolicy(normalizeGuestPrivacyPolicy(res?.data, restaurantId));
      } catch (error) {
        if (!isMounted) return;
        setGuestPrivacyPolicy(normalizeGuestPrivacyPolicy(undefined, restaurantId));
      } finally {
        if (isMounted) {
          setPrivacyPolicyLoading(false);
        }
      }
    };

    void loadGuestPrivacyPolicy();

    return () => {
      isMounted = false;
    };
  }, [get, isGuest, restaurantId]);

  useEffect(() => {
    if (!isGuest || activeTab !== "delivery" || !customerId) return;
    if (!hasGuestDeliveryAddress(guestDeliveryAddress)) return;

    const quoteTimer = window.setTimeout(async () => {
      const res = await quoteCustomerCart({
        customerId,
        payload: {
          orderType: "DELIVERY",
          guestDeliveryAddress: getGuestDeliveryAddressPayload(guestDeliveryAddress),
        },
      });

      if (!hasBackendError(res)) {
        const { quote } = normalizeCartResponse(res);
        const quoteData = quote ?? normalizeCartQuote(asRecord(res?.data));

        if (quoteData) {
          setCartQuote(quoteData);
        }
      }
    }, 450);

    return () => window.clearTimeout(quoteTimer);
  }, [activeTab, customerId, guestDeliveryAddress, isGuest, quoteCustomerCart]);

  useEffect(() => {
    const loadPickupBranch = async () => {
      if (activeTab !== "pickup") return;

      const branchId = user?.branchId || user?.branch?.id;

      if (!branchId) {
        setPickupBranch(null);
        return;
      }

      try {
        const { branch } = await fetchReservationBranch({ branchId: String(branchId) });

        setPickupBranch(branch);
      } catch (error) {
        setPickupBranch((user?.branch || null) as BranchRecord | null);
      }
    };

    void loadPickupBranch();
  }, [activeTab, fetchReservationBranch, user?.branch, user?.branchId]);

  const updateQuantity = async (id: string, type: "inc" | "dec") => {
    const currentItem = cartItems.find((item) => String(item.id) === id);
    if (!currentItem) return;

    const currentQty = Math.max(1, toNumber(currentItem.quantity, 1));

    const newQty =
      type === "inc" ? currentQty + 1 : Math.max(1, currentQty - 1);

    if (newQty === currentQty) return;

    const previousCartItems = cartItems;

    setCartItems((prev) =>
      prev.map((item) => {
        if (String(item.id) !== id) return item;

        return recalculateCartItemQuantity(item, newQty);
      })
    );

    try {
      const isDealRow = String(currentItem.type || "").toUpperCase() === "DEAL";
      const dealId = typeof currentItem.dealId === "string" ? currentItem.dealId : "";
      const endpoint = isDealRow && dealId
        ? `/v1/cart/deals/${dealId}?customerId=${customerId}`
        : `/v1/cart/items/${id}?customerId=${customerId}`;
      const res = await patch(endpoint, {
        quantity: newQty,
      });

      if (hasBackendError(res)) {
        setCartItems(previousCartItems);
        reportBackendError(
          t("toast.failedUpdateQuantity"),
          res,
          t("toast.failedUpdateQuantity")
        );
        return;
      }

      await fetchCart();
    } catch (err) {
      setCartItems(previousCartItems);
      reportBackendError(
        t("toast.failedUpdateQuantity"),
        err,
        err instanceof Error ? err.message : t("toast.failedUpdateQuantity")
      );
    }
  };

  const deleteItem = async (id: string) => {
    const previousCartItems = cartItems;
    const currentItem = cartItems.find((item) => String(item.id) === id);
    const isDealRow = String(currentItem?.type || "").toUpperCase() === "DEAL";
    const dealId = typeof currentItem?.dealId === "string" ? currentItem.dealId : "";

    try {
      setCartItems((prev) => prev.filter((item) => String(item.id) !== id));

      const endpoint = isDealRow && dealId
        ? `/v1/cart/deals/${dealId}?customerId=${customerId}`
        : `/v1/cart/items/${id}?customerId=${customerId}`;
      const res = await del(endpoint);

      if (hasBackendError(res)) {
        setCartItems(previousCartItems);
        reportBackendError(
          t("toast.failedRemoveItem"),
          res,
          t("toast.failedRemoveItem")
        );
        return;
      }

      await fetchCart();
      toast.success(t("toast.itemRemoved"));
    } catch (err) {
      setCartItems(previousCartItems);
      reportBackendError(
        t("toast.failedRemoveItem"),
        err,
        err instanceof Error ? err.message : t("toast.failedRemoveItem")
      );
    }
  };

  const clearCart = async () => {
    const previousCartItems = cartItems;
    const previousCartQuote = cartQuote;
    const previousAppliedTipAmount = appliedTipAmount;

    try {
      setCartItems([]);
      setCartQuote(null);
      setAppliedTipAmount(0);

      const res = await del(`/v1/cart?customerId=${customerId}`);

      if (hasBackendError(res)) {
        setCartItems(previousCartItems);
        setCartQuote(previousCartQuote);
        setAppliedTipAmount(previousAppliedTipAmount);
        reportBackendError(
          t("toast.failedClearCart"),
          res,
          t("toast.failedClearCart")
        );
        return false;
      }

      clearBackendError();
      return true;
    } catch (err) {
      setCartItems(previousCartItems);
      setCartQuote(previousCartQuote);
      setAppliedTipAmount(previousAppliedTipAmount);
      reportBackendError(
        t("toast.failedClearCart"),
        err,
        err instanceof Error ? err.message : t("toast.failedClearCart")
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
          t("toast.failedSetOrderType"),
          res,
          t("toast.failedSetOrderType")
        );
        return false;
      }

      clearBackendError();
      return true;
    } catch (err) {
      reportBackendError(
        t("toast.failedSetOrderType"),
        err,
        err instanceof Error ? err.message : t("toast.failedSetOrderType")
      );
      return false;
    }
  };

  const setCartAddress = async () => {
    if (activeTab !== "delivery") return true;
    if (isGuest) return true;

    try {
      const res = await patch(`/v1/cart/address?customerId=${customerId}`, {
        deliveryAddressId: selectedAddress,
      });

      if (hasBackendError(res)) {
        reportBackendError(
          t("toast.failedSetAddress"),
          res,
          t("toast.failedSetAddress")
        );
        return false;
      }

      clearBackendError();
      return true;
    } catch (err) {
      reportBackendError(
        t("toast.failedSetAddress"),
        err,
        err instanceof Error ? err.message : t("toast.failedSetAddress")
      );
      return false;
    }
  };

  const getOrderTime = () => {
    if (!pickupDate || !pickupTime) return null;

    try {
      const date = new Date(pickupDate);

      if (pickupTime === "ASAP") {
        return new Date().toISOString();
      }

      const [time, modifier] = pickupTime.includes(" ")
        ? pickupTime.split(" ")
        : [pickupTime, ""];
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
      return null;
    }
  };

  const getScheduledDeliveryAt = () => {
    if (activeTab === "pickup") {
      return getOrderTime();
    }

    const trimmedValue = scheduledDeliveryValue.trim();

    if (!trimmedValue) return undefined;

    const scheduledDate = new Date(trimmedValue);

    if (Number.isNaN(scheduledDate.getTime())) return null;

    return scheduledDate.toISOString();
  };

  const setCartSchedule = async (scheduledDeliveryAt?: string | null) => {
    if (!customerId || scheduledDeliveryAt === undefined) return true;

    try {
      const res = await updateCustomerCart({
        customerId,
        payload: {
          scheduledDeliveryAt,
        },
      });

      if (hasBackendError(res)) {
        reportBackendError(
          t("toast.failedSetSchedule"),
          res,
          t("toast.failedSetSchedule")
        );
        return false;
      }

      clearBackendError();
      return true;
    } catch (err) {
      reportBackendError(
        t("toast.failedSetSchedule"),
        err,
        err instanceof Error ? err.message : t("toast.failedSetSchedule")
      );
      return false;
    }
  };

  const applyTip = async (tipAmount: number) => {
    if (!customerId) return;

    const normalizedTip = normalizeCheckoutTipAmount(tipAmount);

    if (normalizedTip === null) return;

    try {
      setApplyingTip(true);

      const res = await updateCustomerCart({
        customerId,
        payload: {
          tipAmount: normalizedTip,
        },
      });

      if (hasBackendError(res)) {
        reportBackendError(
          t("toast.failedSetTip"),
          res,
          t("toast.failedSetTip")
        );
        return;
      }

      await fetchCart();
      setAppliedTipAmount(normalizedTip);
      applyTipToCurrentQuote(normalizedTip);
      clearBackendError();
      toast.success(
        normalizedTip > 0 ? t("toast.tipApplied") : t("toast.tipRemoved")
      );
    } catch (err) {
      reportBackendError(
        t("toast.failedSetTip"),
        err,
        err instanceof Error ? err.message : t("toast.failedSetTip")
      );
    } finally {
      setApplyingTip(false);
    }
  };

  const handlePlaceOrder = async () => {
    try {
      setPlacingOrder(true);

      if (!cartItems.length) {
        toast.error(t("toast.cartEmpty"));
        return;
      }

      if (!customerId) {
        toast.error(t("toast.checkoutFailed"));
        return;
      }

      if (isGuest && !hasGuestContact(customer)) {
        toast.error(t("toast.enterGuestContact"));
        return;
      }

      if (isGuest && !privacyPolicyAccepted) {
        toast.error(t("toast.acceptGuestPrivacyPolicy"));
        return;
      }

      if (activeTab === "delivery" && isGuest && !hasGuestDeliveryAddress(guestDeliveryAddress)) {
        toast.error(t("toast.enterGuestDeliveryAddress"));
        return;
      }

      if (activeTab === "delivery" && !isGuest && !selectedAddress) {
        toast.error(t("toast.selectAddress"));
        return;
      }

      if (activeTab === "pickup" && (!pickupDate || !pickupTime)) {
        toast.error(t("toast.selectPickupDateTime"));
        return;
      }

      const orderTypeUpdated = await setOrderType();
      if (!orderTypeUpdated) return;

      const addressUpdated = await setCartAddress();
      if (!addressUpdated) return;

      const scheduledDeliveryAt = getScheduledDeliveryAt();

      if (scheduledDeliveryAt === null) {
        toast.error(
          activeTab === "delivery"
            ? t("toast.invalidScheduledDelivery")
            : t("toast.invalidOrderTime")
        );
        return;
      }

      const scheduleUpdated = await setCartSchedule(scheduledDeliveryAt);
      if (!scheduleUpdated) return;

      const checkoutTipAmount = Math.max(
        0,
        toNumber(cartQuote?.tipAmount, appliedTipAmount)
      );

      const res = await checkoutCustomerCart({
        customerId,
        payload: {
          ...(scheduledDeliveryAt ? { scheduledDeliveryAt } : {}),
          ...(checkoutTipAmount > 0 ? { tipAmount: checkoutTipAmount } : {}),
          ...(isGuest
            ? { guestContact: getGuestContactPayload(customer, privacyPolicyAccepted) }
            : {}),
          ...(isGuest && activeTab === "delivery"
            ? { guestDeliveryAddress: getGuestDeliveryAddressPayload(guestDeliveryAddress) }
            : {}),
          paymentMethod:
            paymentMethod === "card"
              ? "STRIPE"
              : paymentMethod === "wallet"
                ? "WALLET"
                : "COD",
          customerNote: note,
        },
      });

      if (hasBackendError(res)) {
        reportBackendError(
          t("toast.checkoutFailed"),
          res,
          t("toast.checkoutFailed")
        );
        return;
      }

      const orderData = asRecord(res?.data);
      const orderId = typeof orderData.id === "string" || typeof orderData.id === "number" ? orderData.id : "";

      if (!orderId) {
        reportBackendError(
          t("toast.invalidOrderResponse"),
          res,
          t("toast.invalidOrderResponse")
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
            t("toast.failedInitiatePayment"),
            attemptRes,
            t("toast.failedInitiatePayment")
          );
          return;
        }

        const payment = asRecord(attemptRes?.data);
        const providerData = asRecord(payment.providerData);

        setStripePayment({
          open: true,
          clientSecret: typeof providerData.clientSecret === "string" ? providerData.clientSecret : "",
          publishableKey: typeof providerData.publishableKey === "string" ? providerData.publishableKey : "",
          paymentId: typeof payment.id === "string" ? payment.id : String(payment.id ?? ""),
          orderId,
        });

        return;
      }

      if (paymentMethod === "wallet") {
        toast.success(t("toast.paidUsingWallet"));

        await clearCart();
        router.push(`/order?success=true&orderId=${orderId}`);
        return;
      }

      toast.success(t("toast.orderPlaced"));

      await clearCart();
      router.push(`/order?success=true&orderId=${orderId}`);
    } catch (err) {
      reportBackendError(
        t("toast.orderFailed"),
        err,
        err instanceof Error ? err.message : t("toast.orderFailed")
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
      toast.error(t("toast.enterCouponCode"));
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
          t("toast.invalidCoupon"),
          res,
          t("toast.invalidCoupon")
        );
        return;
      }

      const couponData = asRecord(res?.data);
      const discount = toNumber(couponData.discountAmount, 0);

      setCouponDiscount(discount);
      clearBackendError();
      toast.success(t("toast.couponApplied"));
    } catch (err) {
      setCouponDiscount(0);
      reportBackendError(
        t("toast.couponValidationFailed"),
        err,
        err instanceof Error ? err.message : t("toast.couponValidationFailed")
      );
    } finally {
      setValidatingCoupon(false);
    }
  };

  return (
    <div className="mx-auto mb-[113px] mt-[63px] max-w-[1400px] px-4 md:px-30">
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
              isGuest={isGuest}
              privacyPolicyAccepted={privacyPolicyAccepted}
              setPrivacyPolicyAccepted={setPrivacyPolicyAccepted}
              privacyPolicy={guestPrivacyPolicy}
              privacyPolicyLoading={privacyPolicyLoading}
              guestDeliveryAddress={guestDeliveryAddress}
              setGuestDeliveryAddress={setGuestDeliveryAddress}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              scheduledDeliveryValue={scheduledDeliveryValue}
              setScheduledDeliveryValue={setScheduledDeliveryValue}
            />
          ) : (
            <PickupSection
              selectedAddress={selectedAddress}
              setSelectedAddress={setSelectedAddress}
              note={note}
              setNote={setNote}
              customer={customer}
              setCustomer={setCustomer}
              isGuest={isGuest}
              privacyPolicyAccepted={privacyPolicyAccepted}
              setPrivacyPolicyAccepted={setPrivacyPolicyAccepted}
              privacyPolicy={guestPrivacyPolicy}
              privacyPolicyLoading={privacyPolicyLoading}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              pickupDate={pickupDate}
              setPickupDate={setPickupDate}
              pickupTime={pickupTime}
              setPickupTime={setPickupTime}
              selectedBranch={pickupBranch}
            />
          )}
        </div>

        <div className="lg:col-span-5">
          <CartSummarySection
            cartItems={cartItems}
            quote={cartQuote}
            appliedTipAmount={appliedTipAmount}
            updateQuantity={updateQuantity}
            deleteItem={deleteItem}
            clearCart={clearCart}
            backendError={backendError}
            checkoutType={activeTab}
            onPlaceOrder={handlePlaceOrder}
            placingOrder={placingOrder || loadingCart}
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            onApplyCoupon={validateCoupon}
            couponDiscount={couponDiscount}
            validatingCoupon={validatingCoupon}
            loadingCart={loadingCart}
            onApplyTip={applyTip}
            applyingTip={applyingTip}
          />
        </div>
      </div>

      {stripePayment.open && stripePromise && stripePayment.clientSecret ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-[400px] overflow-auto rounded-2xl bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">{t("completePayment")}</h2>

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
  const t = useTranslations("checkout");
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const { token } = useAuth();
  const { post } = useCheckout(token);

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

        toast.error(error.message || t("toast.paymentFailed"));
        onFail();
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        await post(`/v1/payments/${paymentId}/mark-paid`, {
          providerRef: paymentIntent.id,
          providerData: paymentIntent,
          note: "Stripe success",
        });

        toast.success(t("toast.paymentSuccessful"));
        onSuccess();
        return;
      }

      toast.error(t("toast.paymentNotCompleted"));
    } catch (err) {
      toast.error(t("toast.paymentFailed"));
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
        {loading ? t("processing") : t("payNow")}
      </button>
    </div>
  );
};

export function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F8F8]" />}>
      <CheckoutPageContent />
    </Suspense>
  );
}
