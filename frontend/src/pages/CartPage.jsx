import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import AppShell from "../components/AppShell";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

import {
  buildWhatsAppUrl,
  generateOrderNumberFallback,
} from "../components/cart/cartUtils";
import CartStepEmpty from "../components/cart/CartStepEmpty";
import CartStepSuccess from "../components/cart/CartStepSuccess";
import CartStepItemList from "../components/cart/CartStepItemList";
import CartStepPaymentUpload from "../components/cart/CartStepPaymentUpload";

export default function CartPage() {
  const {
    items,
    removeItem,
    clearCart,
    totalPrice,
    formattedTotal,
    itemCount,
  } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [activeEvent, setActiveEvent] = useState(null);
  const [orderNumber, setOrderNumber] = useState(generateOrderNumberFallback());

  // Checkout flow state
  const [checkoutStep, setCheckoutStep] = useState("cart"); // 'cart' | 'uploading' | 'success'
  const [finalOrderNumber, setFinalOrderNumber] = useState(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [purchasedTotal, setPurchasedTotal] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function loadInitialData() {
      try {
        const userEventId = currentUser?.eventId || "";
        const [eventRes, orderRes] = await Promise.all([
          api.getActiveEvent(userEventId),
          api.getNextOrderNumber(userEventId),
        ]);
        if (isMounted) {
          if (eventRes.success && eventRes.event)
            setActiveEvent(eventRes.event);
          if (orderRes.success && orderRes.orderNumber)
            setOrderNumber(orderRes.orderNumber);
        }
      } catch (err) {
        console.error("Failed to load cart initial data:", err);
      }
    }
    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.eventId]);

  const whatsappUrl = useMemo(
    () =>
      buildWhatsAppUrl({
        orderNumber: finalOrderNumber || orderNumber,
        userName: currentUser?.name ?? "Peserta",
        bibNumber: currentUser?.bibNumber ?? null,
        items: purchasedItems.length > 0 ? purchasedItems : items,
        total: purchasedTotal > 0 ? purchasedTotal : totalPrice,
        waNumber: activeEvent?.whatsappNumber,
      }),
    [
      finalOrderNumber,
      orderNumber,
      currentUser,
      items,
      totalPrice,
      purchasedItems,
      purchasedTotal,
      activeEvent,
    ],
  );

  // Step 1 -> Step 2
  const handleCheckout = () => {
    setCheckoutStep("uploading");
  };

  // Step 2 submit
  const handleUploadProofSubmit = async (proofFile) => {
    setIsSubmitting(true);
    setCheckoutError("");

    try {
      // 1. Buat record transaksi
      const photoIds = items.map((i) => i.id);
      const txRes = await api.createTransaction({
        orderNumber,
        totalAmount: totalPrice,
        photoIds,
      });

      if (!txRes.success || !txRes.transaction) {
        setCheckoutError(
          txRes.message || "Gagal membuat transaksi. Coba lagi.",
        );
        return;
      }

      const txId = txRes.transaction.id;
      const txOrderNumber = txRes.transaction.order_number || orderNumber;
      setFinalOrderNumber(txOrderNumber);

      // 2. Upload bukti pembayaran
      const proofRes = await api.uploadPaymentProof(txId, proofFile);
      if (proofRes.success) {
        setPurchasedItems([...items]);
        setPurchasedTotal(totalPrice);
        clearCart();
        setCheckoutStep("success");
      } else {
        setCheckoutError(
          proofRes.message || "Gagal upload bukti pembayaran. Coba lagi.",
        );
      }
    } catch (err) {
      console.error("Submit order error:", err);
      setCheckoutError(err.message || "Terjadi kesalahan koneksi. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Empty Cart View
  if (itemCount === 0 && checkoutStep === "cart") {
    return (
      <AppShell>
        <CartStepEmpty />
      </AppShell>
    );
  }

  // Success View
  if (checkoutStep === "success") {
    return (
      <AppShell>
        <CartStepSuccess
          finalOrderNumber={finalOrderNumber}
          orderNumber={orderNumber}
          whatsappUrl={whatsappUrl}
        />
      </AppShell>
    );
  }

  // Main Cart / Upload View
  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-lg mx-auto px-4 pb-12"
      >
        {/* Header */}
        <div className="py-6 flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                checkoutStep === "uploading"
                  ? setCheckoutStep("cart")
                  : navigate(-1)
              }
              id="cart-back-btn"
              className="text-xs text-[#4B5563] hover:text-[#111827] px-0 h-auto mb-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span>
                {checkoutStep === "uploading"
                  ? "Kembali ke Keranjang"
                  : "Kembali"}
              </span>
            </Button>
            <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
              {checkoutStep === "uploading"
                ? "Upload Bukti Pembayaran"
                : "Keranjang Foto"}
            </h1>
          </div>
          <Badge
            variant="secondary"
            className="font-bib text-xs bg-[#F3F4F6] text-[#4B5563] px-3 py-1 rounded-full"
          >
            {itemCount} foto
          </Badge>
        </div>

        {/* Nomor Order Card */}
        <Card className="bg-[#F9FAFB] border-[#E5E7EB] rounded-2xl px-4 py-3.5 mb-4 flex flex-row items-center gap-3.5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-[#9CA3AF] font-bib uppercase tracking-widest font-bold">
              Nomor Order Transaksi
            </p>
            <p className="font-bib text-sm text-[#111827] font-bold tracking-wide">
              {finalOrderNumber || orderNumber}
            </p>
          </div>
        </Card>

        {/* STEP 1: CART ITEMS */}
        {checkoutStep === "cart" && (
          <CartStepItemList
            items={items}
            itemCount={itemCount}
            totalPrice={totalPrice}
            formattedTotal={formattedTotal}
            activeEvent={activeEvent}
            checkoutError={checkoutError}
            removeItem={removeItem}
            clearCart={clearCart}
            onCheckout={handleCheckout}
          />
        )}

        {/* STEP 2: UPLOAD PROOF */}
        {checkoutStep === "uploading" && (
          <CartStepPaymentUpload
            formattedTotal={formattedTotal}
            itemCount={itemCount}
            isSubmitting={isSubmitting}
            checkoutError={checkoutError}
            onUploadProof={handleUploadProofSubmit}
          />
        )}
      </motion.div>
    </AppShell>
  );
}
