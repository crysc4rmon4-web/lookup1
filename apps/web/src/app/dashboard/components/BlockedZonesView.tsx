"use client";

import { MapPin, Plus, ShieldCheck, Trash2 } from "lucide-react";

import type { RadarBlockedZone } from "@lookup/services";

type BlockedZonesViewProps = {
  zones: RadarBlockedZone[];
  loading: boolean;
  saving: boolean;
  canAddZone: boolean;
  maxZones: number;
  onAdd: () => void;
  onDelete: (zoneId: string) => void;
};

export function BlockedZonesView({
  zones,
  loading,
  saving,
  canAddZone,
  maxZones,
  onAdd,
  onDelete,
}: BlockedZonesViewProps) {
  return (
    <section className="rounded-[2rem] border border-[#ECEFF5] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#5D5FEF]">
          <ShieldCheck size={21} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-base font-black text-slate-900">
            Zonas bloqueadas
          </h3>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Protege lugares donde no quieres que el radar permanezca activo
            automáticamente.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
        <p className="text-sm leading-6 text-slate-600">
          Puedes añadir hasta{" "}
          <span className="font-black text-slate-900">{maxZones} zonas</span>,
          por ejemplo tu casa, trabajo u otro lugar privado. Cuando entres en
          una zona bloqueada, LookUp apagará automáticamente el radar. Al salir,
          podrás volver a activarlo manualmente.
        </p>
      </div>

      {loading ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center">
          <p className="text-sm font-semibold text-slate-500">
            Cargando zonas...
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <MapPin size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-slate-900">
                  {zone.name}
                </p>

                <p className="mt-1 truncate text-xs leading-5 text-slate-500">
                  {zone.address}
                </p>

                <p className="mt-1 text-[11px] font-semibold text-slate-400">
                  Radio de protección: {zone.radius_meters} m
                </p>
              </div>

              <button
                type="button"
                onClick={() => onDelete(zone.id)}
                disabled={saving}
                aria-label={`Eliminar zona ${zone.name}`}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}

          {zones.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-6 text-center">
              <MapPin size={22} className="mx-auto text-slate-300" />

              <p className="mt-3 text-sm font-black text-slate-700">
                No tienes zonas bloqueadas
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Si no configuras ninguna, el radar funcionará normalmente.
              </p>
            </div>
          )}

          {canAddZone && (
            <button
              type="button"
              onClick={onAdd}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#C9CCFF] bg-[#F8F8FF] px-4 py-3 text-sm font-black text-[#5D5FEF] transition hover:border-[#5D5FEF] hover:bg-[#F2F2FF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={17} />
              Añadir zona
            </button>
          )}

          {!canAddZone && (
            <p className="px-2 text-center text-xs font-semibold text-slate-400">
              Has alcanzado el máximo de {maxZones} zonas.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
