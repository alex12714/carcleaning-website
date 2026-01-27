"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Check, Car, Sparkles, Droplets, Zap, ChevronRight, ChevronLeft, MapPin, Phone, Mail, Clock, Globe, ChevronDown, Truck } from "lucide-react";
import { services, getServicesByCategory, calculateTotal, Service } from "@/lib/services";
import { getTranslation, Locale, locales } from "@/lib/i18n";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

type Category = "full" | "interior" | "exterior" | "additional" | null;

interface CategoryOption {
  id: Category;
  icon: React.ReactNode;
  titleKey: string;
  descKey: string;
  color: string;
}

const categories: CategoryOption[] = [
  {
    id: "full",
    icon: <Sparkles className="w-10 h-10" />,
    titleKey: "wizard.fullDetail",
    descKey: "wizard.fullDetailDesc",
    color: "from-orange-500 to-orange-600",
  },
  {
    id: "interior",
    icon: <Car className="w-10 h-10" />,
    titleKey: "wizard.interior",
    descKey: "wizard.interiorDesc",
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "exterior",
    icon: <Droplets className="w-10 h-10" />,
    titleKey: "wizard.exterior",
    descKey: "wizard.exteriorDesc",
    color: "from-green-500 to-green-600",
  },
  {
    id: "additional",
    icon: <Zap className="w-10 h-10" />,
    titleKey: "wizard.quickService",
    descKey: "wizard.quickServiceDesc",
    color: "from-purple-500 to-purple-600",
  },
];

export default function Home() {
  const [locale, setLocale] = useState<Locale>("en");
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<Category>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [wantsPickup, setWantsPickup] = useState(false);
  const [wantsDelivery, setWantsDelivery] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [contactInfo, setContactInfo] = useState({
    name: "",
    email: "",
    phone: "",
    carModel: "",
    licensePlate: "",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const t = (key: string) => getTranslation(locale, key);

  const totalSteps = 4;

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) => {
      if (serviceId === "fullCar") {
        if (prev.includes("fullCar")) {
          return prev.filter((id) => id !== "fullCar");
        }
        const interiorIds = getServicesByCategory("interior").map((s) => s.id);
        return [...prev.filter((id) => !interiorIds.includes(id)), "fullCar"];
      }

      if (prev.includes("fullCar")) {
        const interiorIds = getServicesByCategory("interior").map((s) => s.id);
        if (interiorIds.includes(serviceId)) {
          return prev;
        }
      }

      return prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId];
    });
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    if (category === "full") {
      setSelectedServices(["fullCar"]);
    } else {
      setSelectedServices([]);
    }
    setStep(2);
  };

  const getTotal = () => {
    let total = calculateTotal(selectedServices);
    if (wantsPickup) total += 20;
    if (wantsDelivery) total += 20;
    return total;
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return selectedCategory !== null;
      case 2:
        return selectedServices.length > 0;
      case 3:
        return selectedDate && selectedTime && contactInfo.name && contactInfo.email && contactInfo.phone;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleCheckout = async () => {
    if (selectedServices.length === 0) {
      alert(t("summary.noServices"));
      return;
    }

    setIsLoading(true);

    try {
      const allServices = [...selectedServices];
      if (wantsPickup) allServices.push("pickup");
      if (wantsDelivery) allServices.push("delivery");

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          services: allServices,
          date: selectedDate,
          time: selectedTime,
          contact: contactInfo,
          locale,
          total: getTotal(),
        }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;

      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const ServiceCard = ({ service }: { service: Service }) => {
    const isSelected = selectedServices.includes(service.id);
    const isFullCarSelected = selectedServices.includes("fullCar");
    const isInterior = service.category === "interior";
    const isDisabled = isInterior && isFullCarSelected && service.id !== "fullCar";

    return (
      <button
        onClick={() => !isDisabled && toggleService(service.id)}
        disabled={isDisabled}
        className={`p-4 rounded-xl border-2 transition-all text-left ${
          isSelected
            ? "border-primary-500 bg-primary-50"
            : "border-gray-200 bg-white hover:border-primary-300"
        } ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                isSelected
                  ? "bg-primary-500 border-primary-500"
                  : "border-gray-300"
              }`}
            >
              {isSelected && <Check className="w-4 h-4 text-white" />}
            </div>
            <span className="font-medium text-gray-800">{t(service.nameKey)}</span>
          </div>
          <span className="font-bold text-primary-600">EUR {service.price}</span>
        </div>
      </button>
    );
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="w-8 h-8" />
              <h1 className="text-xl font-bold">{t("header.title")}</h1>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all text-sm"
              >
                <Globe className="w-4 h-4" />
                <span>{locales.find((l) => l.code === locale)?.flag}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showLangDropdown && (
                <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg overflow-hidden z-50">
                  {locales.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLocale(l.code);
                        setShowLangDropdown(false);
                      }}
                      className={`flex items-center gap-3 px-4 py-2 w-full hover:bg-gray-50 transition-colors ${
                        locale === l.code ? "bg-primary-50" : ""
                      }`}
                    >
                      <span className="text-lg">{l.flag}</span>
                      <span className="text-gray-700 text-sm">{l.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex items-center ${s < 4 ? "flex-1" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    s <= step
                      ? "bg-primary-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {s < step ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded ${
                      s < step ? "bg-primary-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{t("wizard.step1")}</span>
            <span>{t("wizard.step2")}</span>
            <span>{t("wizard.step3")}</span>
            <span>{t("wizard.step4")}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Step 1: Category Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
              {t("wizard.whatDoYouNeed")}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`p-6 rounded-2xl bg-gradient-to-br ${cat.color} text-white transition-all hover:scale-105 hover:shadow-lg`}
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    {cat.icon}
                    <div>
                      <h3 className="font-bold text-lg">{t(cat.titleKey)}</h3>
                      <p className="text-white/80 text-sm mt-1">{t(cat.descKey)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Service Selection */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
              {t("wizard.selectServices")}
            </h2>
            <p className="text-gray-500 text-center mb-6">
              {t("wizard.selectServicesDesc")}
            </p>

            <div className="space-y-3">
              {selectedCategory === "full" ? (
                <>
                  {getServicesByCategory("full").map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-500 mb-3">{t("wizard.addExtras")}</p>
                    {getServicesByCategory("exterior").map((service) => (
                      <ServiceCard key={service.id} service={service} />
                    ))}
                  </div>
                </>
              ) : (
                getServicesByCategory(selectedCategory || "interior").map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))
              )}
            </div>

            {/* Pickup/Delivery Options */}
            <div className="pt-4 border-t mt-6">
              <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                {t("wizard.pickupDelivery")}
              </p>
              <div className="space-y-2">
                <label className="flex items-center justify-between p-3 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-primary-300 transition-all">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={wantsPickup}
                      onChange={(e) => setWantsPickup(e.target.checked)}
                      className="w-5 h-5 text-primary-500 rounded"
                    />
                    <span className="text-gray-700">{t("services.pickup")}</span>
                  </div>
                  <span className="font-bold text-primary-600">EUR 20</span>
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-primary-300 transition-all">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={wantsDelivery}
                      onChange={(e) => setWantsDelivery(e.target.checked)}
                      className="w-5 h-5 text-primary-500 rounded"
                    />
                    <span className="text-gray-700">{t("services.delivery")}</span>
                  </div>
                  <span className="font-bold text-primary-600">EUR 20</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Booking Details */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
              {t("wizard.bookingDetails")}
            </h2>
            <p className="text-gray-500 text-center mb-6">
              {t("wizard.bookingDetailsDesc")}
            </p>

            <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
              <h3 className="font-semibold text-gray-800">{t("booking.title")}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">{t("booking.selectDate")}</label>
                  <input
                    type="date"
                    min={getMinDate()}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">{t("booking.selectTime")}</label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">{t("booking.selectTime")}</option>
                    <option value="morning">{t("booking.morning")}</option>
                    <option value="afternoon">{t("booking.afternoon")}</option>
                    <option value="evening">{t("booking.evening")}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
              <h3 className="font-semibold text-gray-800">{t("contact.title")}</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder={t("contact.name") + " *"}
                  value={contactInfo.name}
                  onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="email"
                    placeholder={t("contact.email") + " *"}
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                  <input
                    type="tel"
                    placeholder={t("contact.phone") + " *"}
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder={t("contact.carModel")}
                    value={contactInfo.carModel}
                    onChange={(e) => setContactInfo({ ...contactInfo, carModel: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <input
                    type="text"
                    placeholder={t("contact.licensePlate")}
                    value={contactInfo.licensePlate}
                    onChange={(e) => setContactInfo({ ...contactInfo, licensePlate: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <textarea
                  placeholder={t("contact.notesPlaceholder")}
                  value={contactInfo.notes}
                  onChange={(e) => setContactInfo({ ...contactInfo, notes: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={2}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Summary & Checkout */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
              {t("wizard.reviewOrder")}
            </h2>
            <p className="text-gray-500 text-center mb-6">
              {t("wizard.reviewOrderDesc")}
            </p>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3">{t("summary.selectedServices")}</h3>
              <div className="space-y-2">
                {selectedServices.map((id) => {
                  const service = services.find((s) => s.id === id);
                  if (!service) return null;
                  return (
                    <div key={id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{t(service.nameKey)}</span>
                      <span className="font-medium">EUR {service.price}</span>
                    </div>
                  );
                })}
                {wantsPickup && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t("services.pickup")}</span>
                    <span className="font-medium">EUR 20</span>
                  </div>
                )}
                {wantsDelivery && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t("services.delivery")}</span>
                    <span className="font-medium">EUR 20</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3">{t("wizard.appointmentDetails")}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4 text-primary-500" />
                  <span>{selectedDate} - {t(`booking.${selectedTime}`)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4 text-primary-500" />
                  <span>{contactInfo.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4 text-primary-500" />
                  <span>{contactInfo.phone}</span>
                </div>
                {contactInfo.carModel && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Car className="w-4 h-4 text-primary-500" />
                    <span>{contactInfo.carModel} {contactInfo.licensePlate && `(${contactInfo.licensePlate})`}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3">{t("location.title")}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 text-primary-500 mt-0.5" />
                  <span>{t("location.address")}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4 text-primary-500" />
                  <a href="tel:+37122532304" className="text-primary-600 hover:underline">
                    +371 22532304
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      {step > 1 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600">{t("summary.total")}</span>
              <span className="text-2xl font-bold text-primary-600">EUR {getTotal()}</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 px-4 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                {t("wizard.back")}
              </button>
              {step < 4 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="flex-1 py-3 px-4 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {t("wizard.next")}
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? t("wizard.processing") : t("summary.checkout")}
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Spacer for fixed bottom nav */}
      {step > 1 && <div className="h-32" />}
    </main>
  );
}
