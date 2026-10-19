"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Check, Car, Sparkles, Droplets, Zap, ChevronRight, ChevronLeft, MapPin, Phone, Mail, Clock, Globe, ChevronDown, Truck, Navigation, Star } from "lucide-react";
import { services, getServicesByCategory, calculateTotal, Service } from "@/lib/services";
import { getTranslation, Locale, locales } from "@/lib/i18n";
import Image from "next/image";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

type Category = "full" | "interior" | "exterior" | "additional" | null;

interface CategoryOption {
  id: Category;
  icon: React.ReactNode;
  titleKey: string;
  descKey: string;
  color: string;
  image: string;
}

interface LocationData {
  address: string;
  lat: number | null;
  lng: number | null;
}

// Pexels images for car detailing
const HERO_IMAGE = "https://images.pexels.com/photos/3354648/pexels-photo-3354648.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop";
const CATEGORY_IMAGES = {
  full: "https://images.pexels.com/photos/6873088/pexels-photo-6873088.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop",
  interior: "https://images.pexels.com/photos/1426718/pexels-photo-1426718.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop",
  exterior: "https://images.pexels.com/photos/6873126/pexels-photo-6873126.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop",
  additional: "https://images.pexels.com/photos/3807319/pexels-photo-3807319.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop",
};

const categories: CategoryOption[] = [
  {
    id: "full",
    icon: <Sparkles className="w-8 h-8" />,
    titleKey: "wizard.fullDetail",
    descKey: "wizard.fullDetailDesc",
    color: "from-orange-500/90 to-orange-600/90",
    image: CATEGORY_IMAGES.full,
  },
  {
    id: "interior",
    icon: <Car className="w-8 h-8" />,
    titleKey: "wizard.interior",
    descKey: "wizard.interiorDesc",
    color: "from-blue-500/90 to-blue-600/90",
    image: CATEGORY_IMAGES.interior,
  },
  {
    id: "exterior",
    icon: <Droplets className="w-8 h-8" />,
    titleKey: "wizard.exterior",
    descKey: "wizard.exteriorDesc",
    color: "from-green-500/90 to-green-600/90",
    image: CATEGORY_IMAGES.exterior,
  },
  {
    id: "additional",
    icon: <Zap className="w-8 h-8" />,
    titleKey: "wizard.quickService",
    descKey: "wizard.quickServiceDesc",
    color: "from-purple-500/90 to-purple-600/90",
    image: CATEGORY_IMAGES.additional,
  },
];

export default function Home() {
  const [locale, setLocale] = useState<Locale>("lv");
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<Category>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [wantsPickup, setWantsPickup] = useState(false);
  const [wantsDelivery, setWantsDelivery] = useState(false);
  const [sameAsPickup, setSameAsPickup] = useState(true);
  const [pickupLocation, setPickupLocation] = useState<LocationData>({ address: "", lat: null, lng: null });
  const [dropoffLocation, setDropoffLocation] = useState<LocationData>({ address: "", lat: null, lng: null });
  const [pickupTime, setPickupTime] = useState("");
  const [dropoffTime, setDropoffTime] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
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
  const [mapsLoaded, setMapsLoaded] = useState(false);

  const pickupInputRef = useRef<HTMLInputElement>(null);
  const dropoffInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pickupAutocompleteRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dropoffAutocompleteRef = useRef<any>(null);

  const t = (key: string) => getTranslation(locale, key);

  // Load Google Maps script
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    if (typeof window !== "undefined" && !win.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;
      win.initGoogleMaps = () => {
        setMapsLoaded(true);
      };
      document.head.appendChild(script);
    } else if (win.google) {
      setMapsLoaded(true);
    }
  }, []);

  // Initialize autocomplete when maps loaded and step 2 is active
  const initAutocomplete = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    if (!mapsLoaded || !win.google) return;

    if (pickupInputRef.current && !pickupAutocompleteRef.current) {
      pickupAutocompleteRef.current = new win.google.maps.places.Autocomplete(pickupInputRef.current, {
        types: ["address"],
        componentRestrictions: { country: "lv" },
      });
      pickupAutocompleteRef.current.addListener("place_changed", () => {
        const place = pickupAutocompleteRef.current?.getPlace();
        if (place?.geometry?.location) {
          setPickupLocation({
            address: place.formatted_address || "",
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          });
        }
      });
    }

    if (dropoffInputRef.current && !dropoffAutocompleteRef.current) {
      dropoffAutocompleteRef.current = new win.google.maps.places.Autocomplete(dropoffInputRef.current, {
        types: ["address"],
        componentRestrictions: { country: "lv" },
      });
      dropoffAutocompleteRef.current.addListener("place_changed", () => {
        const place = dropoffAutocompleteRef.current?.getPlace();
        if (place?.geometry?.location) {
          setDropoffLocation({
            address: place.formatted_address || "",
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          });
        }
      });
    }
  }, [mapsLoaded]);

  useEffect(() => {
    if (step === 2 && (wantsPickup || wantsDelivery)) {
      const timeout = setTimeout(initAutocomplete, 100);
      return () => clearTimeout(timeout);
    }
  }, [step, wantsPickup, wantsDelivery, mapsLoaded, initAutocomplete]);

  useEffect(() => {
    if (sameAsPickup) {
      setDropoffLocation(pickupLocation);
    }
  }, [sameAsPickup, pickupLocation]);

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
        if (selectedServices.length === 0) return false;
        if (wantsPickup && (!pickupLocation.address || !pickupTime)) return false;
        if (wantsDelivery && !sameAsPickup && !dropoffLocation.address) return false;
        if (wantsDelivery && !dropoffTime) return false;
        return true;
      case 3:
        return selectedDate && contactInfo.name && contactInfo.email && contactInfo.phone;
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
          pickupTime,
          dropoffTime,
          pickupLocation: wantsPickup ? pickupLocation : null,
          dropoffLocation: wantsDelivery ? (sameAsPickup ? pickupLocation : dropoffLocation) : null,
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

  const getMapUrl = () => {
    if (wantsPickup && pickupLocation.lat && pickupLocation.lng) {
      if (wantsDelivery && !sameAsPickup && dropoffLocation.lat && dropoffLocation.lng) {
        return `https://www.google.com/maps/embed/v1/directions?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&origin=${pickupLocation.lat},${pickupLocation.lng}&destination=${dropoffLocation.lat},${dropoffLocation.lng}&mode=driving`;
      }
      return `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${pickupLocation.lat},${pickupLocation.lng}&zoom=15`;
    }
    return `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=Riga,Latvia&zoom=12`;
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header with Hero */}
      <header className="relative">
        {/* Hero Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src={HERO_IMAGE}
            alt="Car Detailing"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
        </div>

        {/* Header Content */}
        <div className="relative z-10 text-white">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button onClick={() => { setStep(1); setSelectedCategory(null); }} className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
                <Car className="w-8 h-8" />
                <h1 className="text-xl font-bold">{t("header.title")}</h1>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all text-sm backdrop-blur-sm"
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

          {/* Hero Text - only on step 1 */}
          {step === 1 && (
            <div className="max-w-2xl mx-auto px-4 py-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t("services.title")}
              </h2>
              <p className="text-white/80 text-lg mb-6">
                {t("header.subtitle")}
              </p>
              <div className="flex items-center justify-center gap-1 text-yellow-400">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
                <span className="text-white ml-2 text-sm">5.0 (128 reviews)</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b sticky top-0 z-20">
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
                  className="relative rounded-2xl overflow-hidden transition-all hover:scale-105 hover:shadow-xl group h-48"
                >
                  {/* Background Image */}
                  <Image
                    src={cat.image}
                    alt={t(cat.titleKey)}
                    fill
                    className="object-cover transition-transform group-hover:scale-110"
                  />
                  {/* Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${cat.color}`} />
                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center justify-center text-center h-full text-white p-4">
                    {cat.icon}
                    <h3 className="font-bold text-lg mt-2">{t(cat.titleKey)}</h3>
                    <p className="text-white/80 text-sm mt-1">{t(cat.descKey)}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Features */}
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <Sparkles className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">Premium Quality</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <Droplets className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">Eco-Friendly</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">Guaranteed</p>
              </div>
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

              {/* Pickup Toggle */}
              <label className="flex items-center justify-between p-3 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-primary-300 transition-all mb-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={wantsPickup}
                    onChange={(e) => {
                      setWantsPickup(e.target.checked);
                      if (!e.target.checked) {
                        setPickupLocation({ address: "", lat: null, lng: null });
                        setPickupTime("");
                      }
                    }}
                    className="w-5 h-5 text-primary-500 rounded"
                  />
                  <span className="text-gray-700">{t("services.pickup")}</span>
                </div>
                <span className="font-bold text-primary-600">EUR 20</span>
              </label>

              {/* Pickup Location & Time */}
              {wantsPickup && (
                <div className="ml-8 mb-4 space-y-3 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {t("wizard.pickupLocation")}
                    </label>
                    <input
                      ref={pickupInputRef}
                      type="text"
                      placeholder={t("wizard.enterAddress")}
                      value={pickupLocation.address}
                      onChange={(e) => setPickupLocation({ ...pickupLocation, address: e.target.value })}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {t("wizard.pickupTime")}
                    </label>
                    <select
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">{t("booking.selectTime")}</option>
                      <option value="09:00">09:00</option>
                      <option value="10:00">10:00</option>
                      <option value="11:00">11:00</option>
                      <option value="12:00">12:00</option>
                      <option value="13:00">13:00</option>
                      <option value="14:00">14:00</option>
                      <option value="15:00">15:00</option>
                      <option value="16:00">16:00</option>
                      <option value="17:00">17:00</option>
                      <option value="18:00">18:00</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Delivery Toggle */}
              <label className="flex items-center justify-between p-3 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-primary-300 transition-all">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={wantsDelivery}
                    onChange={(e) => {
                      setWantsDelivery(e.target.checked);
                      if (!e.target.checked) {
                        setDropoffLocation({ address: "", lat: null, lng: null });
                        setDropoffTime("");
                        setSameAsPickup(true);
                      }
                    }}
                    className="w-5 h-5 text-primary-500 rounded"
                  />
                  <span className="text-gray-700">{t("items.delivery")}</span>
                </div>
                <span className="font-bold text-primary-600">EUR 20</span>
              </label>

              {/* Delivery Location & Time */}
              {wantsDelivery && (
                <div className="ml-8 mt-3 space-y-3 p-4 bg-gray-50 rounded-lg">
                  {wantsPickup && (
                    <div className="flex gap-4 mb-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="dropoffType"
                          checked={sameAsPickup}
                          onChange={() => setSameAsPickup(true)}
                          className="w-4 h-4 text-primary-500"
                        />
                        <span className="text-sm text-gray-700">{t("wizard.sameAsPickup")}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="dropoffType"
                          checked={!sameAsPickup}
                          onChange={() => setSameAsPickup(false)}
                          className="w-4 h-4 text-primary-500"
                        />
                        <span className="text-sm text-gray-700">{t("wizard.differentLocation")}</span>
                      </label>
                    </div>
                  )}

                  {(!wantsPickup || !sameAsPickup) && (
                    <div>
                      <label className="block text-sm text-gray-600 mb-1 flex items-center gap-1">
                        <Navigation className="w-3 h-3" />
                        {t("wizard.dropoffLocation")}
                      </label>
                      <input
                        ref={dropoffInputRef}
                        type="text"
                        placeholder={t("wizard.enterAddress")}
                        value={dropoffLocation.address}
                        onChange={(e) => setDropoffLocation({ ...dropoffLocation, address: e.target.value })}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm text-gray-600 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {t("wizard.dropoffTime")}
                    </label>
                    <select
                      value={dropoffTime}
                      onChange={(e) => setDropoffTime(e.target.value)}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">{t("booking.selectTime")}</option>
                      <option value="12:00">12:00</option>
                      <option value="13:00">13:00</option>
                      <option value="14:00">14:00</option>
                      <option value="15:00">15:00</option>
                      <option value="16:00">16:00</option>
                      <option value="17:00">17:00</option>
                      <option value="18:00">18:00</option>
                      <option value="19:00">19:00</option>
                      <option value="20:00">20:00</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Map Preview */}
              {(wantsPickup || wantsDelivery) && (
                <div className="mt-4 rounded-xl overflow-hidden h-48 border">
                  <iframe
                    src={getMapUrl()}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}
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
                    <span className="text-gray-600">{t("items.delivery")}</span>
                    <span className="font-medium">EUR 20</span>
                  </div>
                )}
              </div>
            </div>

            {(wantsPickup || wantsDelivery) && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3">{t("wizard.pickupDelivery")}</h3>
                <div className="space-y-3 text-sm">
                  {wantsPickup && (
                    <div className="flex items-start gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-gray-700">{t("summary.pickupFrom")}:</span>
                        <p>{pickupLocation.address || "—"}</p>
                        <p className="text-primary-600">{pickupTime}</p>
                      </div>
                    </div>
                  )}
                  {wantsDelivery && (
                    <div className="flex items-start gap-2 text-gray-600">
                      <Navigation className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-gray-700">{t("summary.dropoffTo")}:</span>
                        <p>{sameAsPickup ? pickupLocation.address : dropoffLocation.address || "—"}</p>
                        <p className="text-primary-600">{dropoffTime}</p>
                      </div>
                    </div>
                  )}
                </div>

                {pickupLocation.lat && (
                  <div className="mt-3 rounded-lg overflow-hidden h-32">
                    <iframe
                      src={getMapUrl()}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3">{t("wizard.appointmentDetails")}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4 text-primary-500" />
                  <span>{selectedDate}</span>
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
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-30">
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

      {/* Footer with Pexels attribution */}
      <footer className="bg-gray-800 text-gray-400 py-6 mt-8">
        <div className="max-w-2xl mx-auto px-4 text-center text-sm">
          <p>{t("footer.copyright")}</p>
          <p className="mt-2 text-xs text-gray-500">
            Photos by <a href="https://www.pexels.com" className="text-gray-400 hover:text-white" target="_blank" rel="noopener noreferrer">Pexels</a>
          </p>
        </div>
      </footer>
    </main>
  );
}
