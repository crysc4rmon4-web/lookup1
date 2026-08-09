"use client";

import {
  MapPin,
  Navigation,
  Search,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import type {
  RadarBlockedZone,
} from "@lookup/services";

import {
  geocodeAddress,
  type GeocodedAddress,
} from "../../../services/location/geocode-address";

type BlockedZoneFormProps = {
  zone?: RadarBlockedZone | null;
  saving?: boolean;
  onSubmit: (
    data: BlockedZoneFormData,
  ) => void | Promise<void>;
  onCancel: () => void;
};

export type BlockedZoneFormData = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
};

const DEFAULT_RADIUS = 100;

export function BlockedZoneForm({
  zone,
  saving = false,
  onSubmit,
  onCancel,
}: BlockedZoneFormProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const [latitude, setLatitude] =
    useState<number | null>(null);

  const [longitude, setLongitude] =
    useState<number | null>(null);

  const [radiusMeters, setRadiusMeters] =
    useState(DEFAULT_RADIUS);

  const [locationLoading, setLocationLoading] =
    useState(false);

  const [geocodingLoading, setGeocodingLoading] =
    useState(false);

  const [locationError, setLocationError] =
    useState<string | null>(null);

  const [formError, setFormError] =
    useState<string | null>(null);

  const [locationSource, setLocationSource] =
    useState<
      "address" | "current" | null
    >(null);

  useEffect(() => {
    if (zone) {
      setName(zone.name);
      setAddress(zone.address);
      setLatitude(zone.latitude);
      setLongitude(zone.longitude);
      setRadiusMeters(zone.radius_meters);
      setLocationError(null);
      setFormError(null);
      setLocationSource("address");

      return;
    }

    setName("");
    setAddress("");
    setLatitude(null);
    setLongitude(null);
    setRadiusMeters(DEFAULT_RADIUS);
    setLocationError(null);
    setFormError(null);
    setLocationSource(null);
  }, [zone]);

  function handleAddressChange(
    value: string,
  ) {
    setAddress(value);

    /*
     * La dirección ha cambiado.
     * Las coordenadas anteriores ya no se consideran
     * fiables hasta volver a localizar la dirección.
     */
    setLatitude(null);
    setLongitude(null);
    setLocationSource(null);

    setLocationError(null);
    setFormError(null);
  }

  async function handleGeocodeAddress() {
    const cleanAddress =
      address.trim();

    if (!cleanAddress) {
      setLocationError(
        "Introduce una dirección antes de localizarla.",
      );

      return;
    }

    setGeocodingLoading(true);
    setLocationError(null);
    setFormError(null);

    try {
      const result: GeocodedAddress =
        await geocodeAddress(
          cleanAddress,
        );

      setAddress(result.address);
      setLatitude(result.latitude);
      setLongitude(result.longitude);
      setLocationSource("address");
    } catch (error) {
      console.error(
        "❌ Error geocodificando dirección",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "No se pudo localizar la dirección.";

      setLatitude(null);
      setLongitude(null);
      setLocationSource(null);
      setLocationError(message);
    } finally {
      setGeocodingLoading(false);
    }
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationError(
        "Tu navegador no permite obtener la ubicación.",
      );

      return;
    }

    setLocationLoading(true);
    setLocationError(null);
    setFormError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(
          position.coords.latitude,
        );

        setLongitude(
          position.coords.longitude,
        );

        setLocationSource("current");
        setLocationLoading(false);
      },
      (error) => {
        console.error(
          "❌ Error obteniendo ubicación para zona bloqueada",
          error,
        );

        setLocationLoading(false);

        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {
          setLocationError(
            "Necesitamos permiso de ubicación para usar tu posición actual.",
          );

          return;
        }

        if (
          error.code ===
          error.TIMEOUT
        ) {
          setLocationError(
            "No hemos podido obtener tu ubicación a tiempo. Inténtalo de nuevo.",
          );

          return;
        }

        setLocationError(
          "No hemos podido obtener tu ubicación.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setFormError(null);
    setLocationError(null);

    const cleanName =
      name.trim();

    const cleanAddress =
      address.trim();

    if (!cleanName) {
      setFormError(
        "Indica un nombre para esta zona.",
      );

      return;
    }

    if (!cleanAddress) {
      setFormError(
        "Indica la dirección de la zona.",
      );

      return;
    }

    if (
      latitude === null ||
      longitude === null
    ) {
      setFormError(
        "Localiza la dirección o utiliza tu ubicación actual antes de guardar.",
      );

      return;
    }

    if (
      radiusMeters < 50 ||
      radiusMeters > 500
    ) {
      setFormError(
        "El radio debe estar entre 50 y 500 metros.",
      );

      return;
    }

    await onSubmit({
      name: cleanName,
      address: cleanAddress,
      latitude,
      longitude,
      radiusMeters,
    });
  }

  const isEditing =
    Boolean(zone);

  const isLocationBusy =
    locationLoading ||
    geocodingLoading;

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-end
        justify-center
        bg-slate-950/40
        p-0
        sm:items-center
        sm:p-4
      "
      role="dialog"
      aria-modal="true"
      aria-labelledby="blocked-zone-form-title"
    >
      <div
        className="
          w-full
          max-w-lg
          overflow-hidden
          rounded-t-[30px]
          bg-white
          shadow-2xl
          sm:rounded-[30px]
        "
      >
        <div className="flex items-center justify-between border-b border-[#EEF0F5] px-5 py-4 sm:px-6">
          <div>
            <h2
              id="blocked-zone-form-title"
              className="text-lg font-black text-slate-900"
            >
              {isEditing
                ? "Editar zona"
                : "Nueva zona bloqueada"}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              El radar se apagará automáticamente
              cuando estés aquí.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={
              saving ||
              isLocationBusy
            }
            aria-label="Cerrar"
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              bg-slate-100
              text-slate-500
              transition-colors
              hover:bg-slate-200
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <X size={17} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="max-h-[80vh] overflow-y-auto px-5 py-5 sm:px-6"
        >
          <div className="space-y-5">
            <div>
              <label
                htmlFor="blocked-zone-name"
                className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500"
              >
                Nombre
              </label>

              <input
                id="blocked-zone-name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value,
                  )
                }
                placeholder="Casa, trabajo..."
                maxLength={60}
                autoComplete="off"
                disabled={
                  saving ||
                  isLocationBusy
                }
                className="
                  w-full
                  rounded-2xl
                  border
                  border-[#E5E8F0]
                  bg-white
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  text-slate-900
                  outline-none
                  transition
                  placeholder:text-slate-300
                  focus:border-[#5D5FEF]
                  focus:ring-4
                  focus:ring-[#5D5FEF]/10
                  disabled:bg-slate-50
                "
              />
            </div>

            <div>
              <label
                htmlFor="blocked-zone-address"
                className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500"
              >
                Dirección
              </label>

              <div className="relative">
                <MapPin
                  size={16}
                  className="
                    pointer-events-none
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                  "
                  aria-hidden="true"
                />

                <input
                  id="blocked-zone-address"
                  type="text"
                  value={address}
                  onChange={(event) =>
                    handleAddressChange(
                      event.target.value,
                    )
                  }
                  placeholder="Escribe la dirección exacta"
                  maxLength={255}
                  autoComplete="street-address"
                  disabled={
                    saving ||
                    isLocationBusy
                  }
                  className="
                    w-full
                    rounded-2xl
                    border
                    border-[#E5E8F0]
                    bg-white
                    py-3
                    pl-11
                    pr-4
                    text-sm
                    font-semibold
                    text-slate-900
                    outline-none
                    transition
                    placeholder:text-slate-300
                    focus:border-[#5D5FEF]
                    focus:ring-4
                    focus:ring-[#5D5FEF]/10
                    disabled:bg-slate-50
                  "
                />
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                Introduce una dirección concreta
                para localizar el punto exacto.
              </p>

              <button
                type="button"
                onClick={() =>
                  void handleGeocodeAddress()
                }
                disabled={
                  saving ||
                  isLocationBusy ||
                  !address.trim()
                }
                className="
                  mt-3
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-[#EEF2FF]
                  px-3
                  py-2
                  text-xs
                  font-black
                  text-[#5D5FEF]
                  transition
                  hover:bg-[#E5E7FF]
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <Search size={13} />

                {geocodingLoading
                  ? "Localizando..."
                  : "Localizar dirección"}
              </button>
            </div>

            <div
              className="
                rounded-2xl
                border
                border-[#E8EBF2]
                bg-[#FAFBFD]
                p-4
              "
            >
              <div className="flex items-start gap-3">
                <div
                  className="
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-[#EEF2FF]
                    text-[#5D5FEF]
                  "
                  aria-hidden="true"
                >
                  <Navigation size={16} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-slate-800">
                    Ubicación exacta
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Necesitamos las coordenadas
                    del lugar para detectar cuándo
                    entras en la zona.
                  </p>

                  <button
                    type="button"
                    onClick={
                      handleUseCurrentLocation
                    }
                    disabled={
                      saving ||
                      isLocationBusy
                    }
                    className="
                      mt-3
                      inline-flex
                      items-center
                      gap-2
                      rounded-xl
                      bg-white
                      px-3
                      py-2
                      text-xs
                      font-black
                      text-[#5D5FEF]
                      shadow-sm
                      ring-1
                      ring-[#E3E6F2]
                      transition
                      hover:bg-[#F7F7FF]
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    <Navigation size={13} />

                    {locationLoading
                      ? "Obteniendo ubicación..."
                      : "Usar mi ubicación actual"}
                  </button>
                </div>
              </div>

              {latitude !== null &&
                longitude !== null && (
                  <div
                    className="
                      mt-3
                      rounded-xl
                      bg-emerald-50
                      px-3
                      py-2
                      text-xs
                      font-semibold
                      text-emerald-700
                    "
                  >
                    {locationSource ===
                    "current"
                      ? "Ubicación actual seleccionada correctamente."
                      : "Dirección localizada correctamente."}
                  </div>
                )}

              {locationError && (
                <p
                  className="
                    mt-3
                    text-xs
                    font-semibold
                    leading-5
                    text-red-500
                  "
                  role="alert"
                >
                  {locationError}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="blocked-zone-radius"
                  className="text-xs font-black uppercase tracking-[0.12em] text-slate-500"
                >
                  Radio de seguridad
                </label>

                <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-black text-[#5D5FEF]">
                  {radiusMeters} m
                </span>
              </div>

              <input
                id="blocked-zone-radius"
                type="range"
                min={50}
                max={500}
                step={10}
                value={radiusMeters}
                onChange={(event) =>
                  setRadiusMeters(
                    Number(
                      event.target.value,
                    ),
                  )
                }
                disabled={
                  saving ||
                  isLocationBusy
                }
                className="
                  mt-4
                  w-full
                  accent-[#5D5FEF]
                  disabled:opacity-50
                "
              />

              <div className="mt-1 flex justify-between text-[10px] font-bold text-slate-400">
                <span>50 m</span>
                <span>500 m</span>
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                Recomendación: 100 m suele ser
                un buen equilibrio para una zona
                como casa o trabajo.
              </p>
            </div>

            {formError && (
              <div
                className="
                  rounded-2xl
                  bg-red-50
                  px-4
                  py-3
                  text-xs
                  font-semibold
                  leading-5
                  text-red-600
                "
                role="alert"
              >
                {formError}
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3 border-t border-[#EEF0F5] pt-5">
            <button
              type="button"
              onClick={onCancel}
              disabled={
                saving ||
                isLocationBusy
              }
              className="
                flex-1
                rounded-2xl
                border
                border-[#E3E6EE]
                px-4
                py-3
                text-sm
                font-black
                text-slate-600
                transition
                hover:bg-slate-50
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                isLocationBusy
              }
              className="
                flex-1
                rounded-2xl
                bg-[#5D5FEF]
                px-4
                py-3
                text-sm
                font-black
                text-white
                shadow-sm
                transition
                hover:bg-[#5153E6]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {saving
                ? "Guardando..."
                : isEditing
                  ? "Guardar cambios"
                  : "Añadir zona"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}