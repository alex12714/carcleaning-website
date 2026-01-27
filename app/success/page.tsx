"use client";

import { Suspense } from "react";
import { CheckCircle, Car, Calendar, Phone, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

function SuccessContent() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Booking Confirmed!
        </h1>
        <p className="text-gray-600 mb-6">
          Thank you for your booking. We have received your payment and will contact you shortly to confirm your appointment details.
        </p>

        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-3">
          <div className="flex items-center gap-3 text-gray-600">
            <Car className="w-5 h-5 text-orange-600" />
            <span>Your car will be serviced as requested</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <Calendar className="w-5 h-5 text-orange-600" />
            <span>We will confirm your appointment time</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <Mail className="w-5 h-5 text-orange-600" />
            <span>Check your email for confirmation</span>
          </div>
        </div>

        <div className="border-t pt-6 space-y-3">
          <p className="text-sm text-gray-500">Questions? Contact us:</p>
          <div className="flex justify-center gap-4">
            <a href="tel:+37122532304" className="flex items-center gap-2 text-orange-600 hover:underline">
              <Phone className="w-4 h-4" />
              +371 22532304
            </a>
            <a href="mailto:segarsj179@gmail.com" className="flex items-center gap-2 text-orange-600 hover:underline">
              <Mail className="w-4 h-4" />
              Email
            </a>
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 mt-6 text-orange-600 hover:text-orange-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
