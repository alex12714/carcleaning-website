import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { services, calculateTotal } from "@/lib/services";
import { getTranslation, Locale } from "@/lib/i18n";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { services: selectedServiceIds, date, time, contact, locale, total } = body;

    const t = (key: string) => getTranslation(locale as Locale || "en", key);

    // Build line items
    const lineItems = selectedServiceIds.map((id: string) => {
      const service = services.find((s) => s.id === id);
      if (!service) return null;
      return {
        price_data: {
          currency: "eur",
          product_data: {
            name: t(service.nameKey),
          },
          unit_amount: service.price * 100, // Stripe uses cents
        },
        quantity: 1,
      };
    }).filter(Boolean);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems as Stripe.Checkout.SessionCreateParams.LineItem[],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}`,
      customer_email: contact.email,
      metadata: {
        customerName: contact.name,
        customerPhone: contact.phone,
        carModel: contact.carModel,
        licensePlate: contact.licensePlate,
        appointmentDate: date,
        appointmentTime: time,
        notes: contact.notes,
        locale: locale,
        selectedServices: selectedServiceIds.join(","),
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
