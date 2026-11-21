"use client";

import { useState } from "react";
import { toast } from "sonner";

async function redirectToUrl(endpoint: string) {
  const response = await fetch(endpoint, { method: "POST" });
  const data = await response.json();
  if (!response.ok || !data.url) {
    toast.error(data.error ?? "Não foi possível continuar.");
    return;
  }
  window.location.href = data.url;
}

export function UpgradeButton() {
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await redirectToUrl("/api/billing/checkout");
        setLoading(false);
      }}
      className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
    >
      {loading ? "Redirecionando…" : "Assinar o plano Pro"}
    </button>
  );
}

export function BuyPackButton({ packId, label }: { packId: string; label: string }) {
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const response = await fetch("/api/billing/checkout-pack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packId }),
        });
        const data = await response.json();
        if (!response.ok || !data.url) {
          toast.error(data.error ?? "Não foi possível continuar.");
          setLoading(false);
          return;
        }
        window.location.href = data.url;
      }}
      className="w-full rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
    >
      {loading ? "Redirecionando…" : label}
    </button>
  );
}

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await redirectToUrl("/api/billing/portal");
        setLoading(false);
      }}
      className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
    >
      {loading ? "Redirecionando…" : "Gerenciar assinatura"}
    </button>
  );
}
