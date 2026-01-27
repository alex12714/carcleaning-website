"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Check, Car, MapPin, Phone, Mail, Clock, ChevronDown, Globe, Sparkles, Droplets, Shield } from "lucide-react";
import { services, getServicesByCategory, calculateTotal, Service } from "@/lib/services";
import { getTranslation, Locale, locales } from "@/lib/i18n";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

export default function Home() {
  const [locale, setLocale] = useState<Locale>("en");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
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

  const handleCheckout = async () => {
    if (selectedServices.length === 0) {
      alert(t("summary.noServices"));
      return;
    }

    if (!selectedDate || !selectedTime || !contactInfo.name || !contactInfo.email || !contactInfo.phone) {
      alert("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          services: selectedServices,
          date: selectedDate,
          time: selectedTime,
          contact: contactInfo,
          locale,
          total: calculateTotal(selectedServices),
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

  const ServiceCard = ({ service, disabled = false }: { service: Service; disabled?: boolean }) => {
    const isSelected = selectedServices.includes(service.id);
    const isFullCarSelected = selectedServices.includes("fullCar");
    const isInterior = service.category === "interior";
    const isDisabled = disabled || (isInterior && isFullCarSelected && service.id !== "fullCar");

    return (
      <button
        onClick={() => !isDisabled && toggleService(service.id)}
        disabled={isDisabled}
        className={`service-card flex items-center justify-between w-full text-left ${
          isSelected ? "selected" : ""
        } ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
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
          <div>
            <p className="font-medium text-gray-800">{t(service.nameKey)}</p>
            {service.popular && (
              <span className="text-xs text-primary-600 font-medium">Popular</span>
            )}
          </div>
        </div>
        <span className="font-bold text-primary-600">EUR {service.price}</span>
      </button>
    );
  };

  const mapsUrl = "https://www.google.com/maps/embed/v1/place?key=" + (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "") + "&q=Brivibas+iela+40,+Riga,+Latvia&zoom=15";

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Car className="w-10 h-10" />
              <div>
                <h1 className="text-2xl font-bold">{t("header.title")}</h1>
                <p className="text-primary-100 text-sm">{t("header.subtitle")}</p>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all"
              >
                <Globe className="w-4 h-4" />
                <span>{locales.find((l) => l.code === locale)?.flag}</span>
                <ChevronDown className="w-4 h-4" />
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
                      className={`flex items-center gap-3 px-4 py-3 w-full hover:bg-gray-50 transition-colors ${
                        locale === l.code ? "bg-primary-50" : ""
                      }`}
                    >
                      <span className="text-xl">{l.flag}</span>
                      <span className="text-gray-700">{l.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-b from-primary-700 to-primary-600 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            {t("services.title")}
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            {t("services.fullCarDesc")}
          </p>
          <div className="flex justify-center gap-8 text-center">
            <div className="flex flex-col items-center">
              <Sparkles className="w-8 h-8 mb-2" />
              <span className="text-sm">Premium Quality</span>
            </div>
            <div className="flex flex-col items-center">
              <Droplets className="w-8 h-8 mb-2" />
              <span className="text-sm">Eco-Friendly</span>
            </div>
            <div className="flex flex-col items-center">
              <Shield className="w-8 h-8 mb-2" />
              <span className="text-sm">Guaranteed</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Car className="w-6 h-6 text-primary-600" />
                <h3 className="section-title mb-0">{t("services.fullCar")}</h3>
              </div>
              <p className="text-gray-600 mb-4">{t("services.fullCarDesc")}</p>
              {getServicesByCategory("full").map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </section>

            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="section-title">{t("services.interior")}</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {getServicesByCategory("interior").map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="section-title">{t("services.exterior")}</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {getServicesByCategory("exterior").map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="section-title">{t("services.additional")}</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {getServicesByCategory("additional").map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="section-title">{t("services.delivery")}</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {getServicesByCategory("delivery").map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="section-title">{t("booking.title")}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("booking.selectDate")}
                  </label>
                  <input
                    type="date"
                    min={getMinDate()}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("booking.selectTime")}
                  </label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="input-field"
                  >
                    <option value="">{t("booking.selectTime")}</option>
                    <option value="morning">{t("booking.morning")}</option>
                    <option value="afternoon">{t("booking.afternoon")}</option>
                    <option value="evening">{t("booking.evening")}</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="section-title">{t("contact.title")}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder={t("contact.name")}
                  value={contactInfo.name}
                  onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
                  className="input-field"
                  required
                />
                <input
                  type="email"
                  placeholder={t("contact.email")}
                  value={contactInfo.email}
                  onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                  className="input-field"
                  required
                />
                <input
                  type="tel"
                  placeholder={t("contact.phone")}
                  value={contactInfo.phone}
                  onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                  className="input-field"
                  required
                />
                <input
                  type="text"
                  placeholder={t("contact.carModel")}
                  value={contactInfo.carModel}
                  onChange={(e) => setContactInfo({ ...contactInfo, carModel: e.target.value })}
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder={t("contact.licensePlate")}
                  value={contactInfo.licensePlate}
                  onChange={(e) => setContactInfo({ ...contactInfo, licensePlate: e.target.value })}
                  className="input-field"
                />
                <textarea
                  placeholder={t("contact.notesPlaceholder")}
                  value={contactInfo.notes}
                  onChange={(e) => setContactInfo({ ...contactInfo, notes: e.target.value })}
                  className="input-field md:col-span-2"
                  rows={3}
                />
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-4">
              <h3 className="section-title">{t("summary.title")}</h3>

              {selectedServices.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t("summary.noServices")}</p>
              ) : (
                <div className="space-y-3 mb-6">
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
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>{t("summary.total")}</span>
                      <span className="text-primary-600">EUR {calculateTotal(selectedServices)}</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={selectedServices.length === 0 || isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? "Processing..." : t("summary.checkout")}
              </button>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="section-title">{t("location.title")}</h3>

              <div className="rounded-xl overflow-hidden mb-4 h-48">
                <iframe
                  src={mapsUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary-600 mt-0.5" />
                  <span className="text-gray-600">{t("location.address")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary-600" />
                  <span className="text-gray-600">{t("location.hours")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary-600" />
                  <a href="tel:+37122532304" className="text-primary-600 hover:underline">
                    {t("location.phone")}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary-600" />
                  <a href="mailto:segarsj179@gmail.com" className="text-primary-600 hover:underline">
                    {t("location.email")}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-gray-800 text-gray-400 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>{t("footer.copyright")}</p>
        </div>
      </footer>
    </main>
  );
}
