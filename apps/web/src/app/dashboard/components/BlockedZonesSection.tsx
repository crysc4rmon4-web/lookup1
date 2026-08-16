"use client";

import {
  MapPin,
  Pencil,
  Plus,
  ShieldCheck,
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
      aria-labelledby="private-zones-title"
      className="
        overflow-hidden
        rounded-[28px]
        border
        border-rose-100
        bg-gradient-to-br
        from-white
        via-white
        to-rose-50/70
        shadow-sm
      "
    >
      {/* =====================================================
          CABECERA
          ===================================================== */}

      <div className="p-5">
        <div
          className="
            flex
            items-start
            gap-4
          "
        >
          <div
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-2xl
              bg-rose-50
              text-rose-500
              ring-1
              ring-rose-100
            "
            aria-hidden="true"
          >
            <ShieldCheck
              size={20}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div
              className="
                flex
                items-start
                justify-between
                gap-3
              "
            >
              <div>
                <p
                  className="
                    text-[9px]
                    font-black
                    uppercase
                    tracking-[0.18em]
                    text-rose-400
                  "
                >
                  PROTECCIÓN
                </p>

                <h2
                  id="private-zones-title"
                  className="
                    mt-1
                    text-base
                    font-black
                    text-slate-900
                  "
                >
                  Zonas privadas
                </h2>

                <p
                  className="
                    mt-1.5
                    text-xs
                    leading-5
                    text-slate-500
                  "
                >
                  Protege lugares donde
                  no quieres aparecer en
                  el Radar.
                </p>
              </div>

              <span
                className="
                  shrink-0
                  rounded-full
                  bg-rose-50
                  px-2.5
                  py-1
                  text-[10px]
                  font-black
                  text-rose-500
                  ring-1
                  ring-rose-100
                "
              >
                {zones.length}/
                {maxZones}
              </span>
            </div>
          </div>
        </div>

        <div
          className="
            mt-4
            rounded-2xl
            border
            border-rose-100/80
            bg-white/80
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
            Al entrar en una zona
            privada con el Radar activo,
            LookUp desactiva tu presencia
            automáticamente. Para volver
            a aparecer tendrás que
            activarlo manualmente.
          </p>
        </div>
      </div>

      {/* =====================================================
          LISTADO
          ===================================================== */}

      <div className="px-5 pb-5">
        {loading ? (
          <div
            className="
              rounded-2xl
              border
              border-dashed
              border-rose-100
              bg-white/70
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
              Cargando zonas
              privadas...
            </p>
          </div>
        ) : zones.length ===
          0 ? (
          <div
            className="
              rounded-2xl
              border
              border-dashed
              border-rose-100
              bg-white/80
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
                bg-rose-50
                text-rose-400
              "
            >
              <MapPin
                size={18}
              />
            </div>

            <p
              className="
                mt-3
                text-sm
                font-black
                text-slate-700
              "
            >
              Todavía no tienes
              zonas privadas
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
              Puedes proteger hasta{" "}
              {maxZones} lugares como
              casa, trabajo o cualquier
              ubicación sensible.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {zones.map(
              (zone) => (
                <article
                  key={zone.id}
                  className="
                    rounded-2xl
                    border
                    border-rose-100
                    bg-white
                    p-4
                    shadow-[0_6px_18px_rgba(120,40,60,0.035)]
                  "
                >
                  <div
                    className="
                      flex
                      items-start
                      gap-3
                    "
                  >
                    <div
                      className="
                        flex
                        h-9
                        w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-rose-50
                        text-rose-500
                      "
                    >
                      <MapPin
                        size={16}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div
                        className="
                          flex
                          flex-wrap
                          items-center
                          gap-2
                        "
                      >
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

                        <span
                          className="
                            rounded-full
                            bg-rose-50
                            px-2
                            py-0.5
                            text-[8px]
                            font-black
                            uppercase
                            tracking-[0.1em]
                            text-rose-400
                          "
                        >
                          Protegida
                        </span>
                      </div>

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
                        Protección ·{" "}
                        {
                          zone.radius_meters
                        }{" "}
                        m
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
                          onEdit(
                            zone,
                          )
                        }
                        disabled={
                          saving
                        }
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
                        <Pencil
                          size={15}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onDelete(
                            zone,
                          )
                        }
                        disabled={
                          saving
                        }
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
                        <Trash2
                          size={15}
                        />
                      </button>
                    </div>
                  </div>
                </article>
              ),
            )}
          </div>
        )}

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
            border-rose-200
            bg-white/80
            px-4
            py-3
            text-xs
            font-black
            text-rose-500
            transition-all
            hover:border-rose-300
            hover:bg-rose-50
            disabled:cursor-not-allowed
            disabled:border-slate-200
            disabled:bg-slate-50
            disabled:text-slate-400
          "
        >
          <Plus size={15} />

          {canAddZone
            ? "Añadir zona privada"
            : `Límite alcanzado · ${maxZones}/${maxZones}`}
        </button>
      </div>
    </section>
  );
}