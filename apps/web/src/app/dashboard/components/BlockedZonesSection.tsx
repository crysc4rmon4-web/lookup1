"use client";

import {
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import type {
  RadarBlockedZone,
} from "@lookup/services";

type BlockedZonesSectionProps = {
  zones: RadarBlockedZone[];
  loading: boolean;
  saving: boolean;
  canAddZone: boolean;
  maxZones: number;
  onAdd: () => void;
  onEdit: (
    zone: RadarBlockedZone,
  ) => void;
  onDelete: (
    zone: RadarBlockedZone,
  ) => void;
};

export function BlockedZonesSection({
  zones,
  loading,
  saving,
  canAddZone,
  maxZones,
  onAdd,
  onEdit,
  onDelete,
}: BlockedZonesSectionProps) {
  return (
    <section
      aria-labelledby="blocked-zones-title"
      className="
        rounded-[2rem]
        border
        border-[#ECEFF5]
        bg-white
        p-5
        shadow-sm
      "
    >
      <div className="flex items-start gap-4">
        <div
          className="
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-2xl
            bg-[#EEF2FF]
            text-[#5D5FEF]
          "
          aria-hidden="true"
        >
          <MapPin size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                id="blocked-zones-title"
                className="
                  text-base
                  font-black
                  text-slate-900
                "
              >
                Zonas bloqueadas
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  leading-5
                  text-slate-500
                "
              >
                Evita que tu radar permanezca activo
                accidentalmente en lugares privados.
              </p>
            </div>

            <span
              className="
                shrink-0
                rounded-full
                bg-slate-100
                px-2.5
                py-1
                text-[10px]
                font-black
                text-slate-500
              "
            >
              {zones.length}/{maxZones}
            </span>
          </div>
        </div>
      </div>

      <div
        className="
          mt-4
          rounded-2xl
          border
          border-[#EEF1F7]
          bg-[#FAFBFD]
          px-4
          py-3
        "
      >
        <p
          className="
            text-xs
            leading-5
            text-slate-500
          "
        >
          Si entras en una de estas zonas con el radar
          activo, LookUp lo apagará automáticamente.
          Al salir, tendrás que volver a activarlo
          manualmente.
        </p>
      </div>

      <div className="mt-4">
        {loading ? (
          <div
            className="
              rounded-2xl
              border
              border-dashed
              border-[#E5E8F0]
              px-4
              py-6
              text-center
            "
          >
            <p
              className="
                text-sm
                font-semibold
                text-slate-400
              "
            >
              Cargando zonas...
            </p>
          </div>
        ) : zones.length === 0 ? (
          <div
            className="
              rounded-2xl
              border
              border-dashed
              border-[#DDE2EC]
              bg-white
              px-5
              py-6
              text-center
            "
          >
            <div
              className="
                mx-auto
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-full
                bg-[#F3F4F8]
                text-slate-400
              "
              aria-hidden="true"
            >
              <MapPin size={18} />
            </div>

            <p
              className="
                mt-3
                text-sm
                font-black
                text-slate-700
              "
            >
              No tienes zonas bloqueadas
            </p>

            <p
              className="
                mx-auto
                mt-1
                max-w-xs
                text-xs
                leading-5
                text-slate-400
              "
            >
              Puedes añadir hasta {maxZones} lugares
              donde quieras que el radar se desactive
              automáticamente.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {zones.map((zone) => (
              <article
                key={zone.id}
                className="
                  rounded-2xl
                  border
                  border-[#ECEFF5]
                  bg-white
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
                    <MapPin size={16} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3
                      className="
                        truncate
                        text-sm
                        font-black
                        text-slate-900
                      "
                    >
                      {zone.name}
                    </h3>

                    <p
                      className="
                        mt-1
                        break-words
                        text-xs
                        leading-5
                        text-slate-500
                      "
                    >
                      {zone.address}
                    </p>

                    <p
                      className="
                        mt-2
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.12em]
                        text-slate-400
                      "
                    >
                      Radio de seguridad ·{" "}
                      {zone.radius_meters} m
                    </p>
                  </div>

                  <div
                    className="
                      flex
                      shrink-0
                      items-center
                      gap-1
                    "
                  >
                    <button
                      type="button"
                      onClick={() =>
                        onEdit(zone)
                      }
                      disabled={saving}
                      aria-label={`Editar ${zone.name}`}
                      title={`Editar ${zone.name}`}
                      className="
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-xl
                        text-slate-400
                        transition-colors
                        hover:bg-[#EEF2FF]
                        hover:text-[#5D5FEF]
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onDelete(zone)
                      }
                      disabled={saving}
                      aria-label={`Eliminar ${zone.name}`}
                      title={`Eliminar ${zone.name}`}
                      className="
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-xl
                        text-slate-400
                        transition-colors
                        hover:bg-red-50
                        hover:text-red-500
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onAdd}
        disabled={
          !canAddZone ||
          loading ||
          saving
        }
        className="
          mt-4
          flex
          w-full
          items-center
          justify-center
          gap-2
          rounded-2xl
          border
          border-dashed
          border-[#C9CDFC]
          bg-[#FAFAFF]
          px-4
          py-3
          text-xs
          font-black
          text-[#5D5FEF]
          transition-all
          hover:border-[#5D5FEF]
          hover:bg-[#F3F3FF]
          disabled:cursor-not-allowed
          disabled:border-slate-200
          disabled:bg-slate-50
          disabled:text-slate-400
        "
      >
        <Plus size={15} />

        {canAddZone
          ? "Añadir zona bloqueada"
          : `Límite alcanzado · ${maxZones}/${maxZones}`}
      </button>
    </section>
  );
}