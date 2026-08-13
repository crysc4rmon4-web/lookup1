"use client";

import {
  Building2,
  CheckCircle2,
  Globe2,
  Loader2,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

import { SOCIAL_PLATFORMS } from "@lookup/config";

import { SocialIcon } from "@/components/ui/SocialIcon";

import { Navigation } from "../../components/Navigation";
import { ProgressBar } from "../../components/ProgressBar";
import { StepPhoto } from "../../components/StepPhoto";
import { StepSocials } from "../../components/StepSocials";
import { StepTerms } from "../../components/StepTerms";

import { BUSINESS_SECTORS } from "../constants";

import type { BusinessOnboardingData, BusinessOnboardingStep } from "../types";

type Props = {
  step: BusinessOnboardingStep;

  stepIndex: number;
  totalSteps: number;
  progress: number;

  data: BusinessOnboardingData;

  loading: boolean;
  canContinue: boolean;

  update: (values: Partial<BusinessOnboardingData>) => void;

  onAvatar: (file: File) => void;
  onVerifyLocation: () => void;

  onBack: () => void;
  onNext: () => void;
};

const INPUT_CLASS_NAME = `
  mt-2
  w-full
  rounded-2xl
  border
  border-[#E5E7EB]
  bg-[#FAFAFC]
  px-5
  py-4
  text-[15px]
  font-semibold
  text-slate-800
  outline-none
  transition-all
  placeholder:text-slate-400
  focus:border-[#5D5FEF]
  focus:bg-white
  focus:shadow-[0_0_0_4px_rgba(93,95,239,0.08)]
`;

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-black text-slate-800">
      {children}
    </label>
  );
}

function StepBusinessDetails({
  data,
  update,
}: {
  data: BusinessOnboardingData;
  update: (values: Partial<BusinessOnboardingData>) => void;
}) {
  return (
    <section>
      <p className="text-xs font-black uppercase tracking-[0.3em] text-[#5D5FEF]">
        DATOS DE LA EMPRESA
      </p>

      <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
        Cuéntanos sobre tu negocio
      </h2>

      <p className="mt-4 text-sm leading-6 text-slate-500">
        Esta información nos ayudará a construir el perfil público de tu
        empresa.
      </p>

      <div className="mt-9 space-y-6">
        <div>
          <FieldLabel>Razón social</FieldLabel>

          <input
            type="text"
            value={data.legalName}
            onChange={(event) =>
              update({
                legalName: event.target.value,
              })
            }
            placeholder="Ej. Carmona Servicios S.L."
            autoComplete="organization"
            className={INPUT_CLASS_NAME}
          />
        </div>

        <div>
          <FieldLabel>Nombre comercial</FieldLabel>

          <input
            type="text"
            value={data.tradeName}
            onChange={(event) =>
              update({
                tradeName: event.target.value,
              })
            }
            placeholder="Ej. Carmona Studio"
            className={INPUT_CLASS_NAME}
          />
        </div>

        <div>
          <FieldLabel>NIF / CIF</FieldLabel>

          <input
            type="text"
            value={data.taxId}
            onChange={(event) =>
              update({
                taxId: event.target.value.toUpperCase(),
              })
            }
            placeholder="Ej. B12345678"
            autoCapitalize="characters"
            className={INPUT_CLASS_NAME}
          />
        </div>

        <div>
          <FieldLabel>Sector</FieldLabel>

          <select
            value={data.sector}
            onChange={(event) =>
              update({
                sector: event.target.value,
              })
            }
            className={INPUT_CLASS_NAME}
          >
            <option value="">Selecciona un sector</option>

            {BUSINESS_SECTORS.map((sector) => (
              <option key={sector.id} value={sector.label}>
                {sector.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between gap-4">
            <FieldLabel>Sobre tu negocio</FieldLabel>

            <span className="text-xs font-semibold text-slate-400">
              {data.bio.length}/500
            </span>
          </div>

          <textarea
            value={data.bio}
            onChange={(event) =>
              update({
                bio: event.target.value.slice(0, 500),
              })
            }
            placeholder="Cuenta brevemente qué hace tu negocio, qué ofrece y qué lo hace especial."
            rows={5}
            maxLength={500}
            className={`${INPUT_CLASS_NAME} resize-none leading-6`}
          />

          <p className="mt-2 text-xs leading-5 text-slate-400">
            Mínimo 20 caracteres. Esta descripción aparecerá en tu perfil
            público.
          </p>
        </div>
      </div>
    </section>
  );
}

function StepBusinessLocation({
  data,
  update,
  loading,
  onVerifyLocation,
}: {
  data: BusinessOnboardingData;
  update: (values: Partial<BusinessOnboardingData>) => void;
  loading: boolean;
  onVerifyLocation: () => void;
}) {
  function invalidateLocation(values: Partial<BusinessOnboardingData>) {
    update({
      ...values,
      latitude: null,
      longitude: null,
      verifiedAddress: "",
    });
  }

  const isVerified = data.latitude !== null && data.longitude !== null;

  return (
    <section>
      <p className="text-xs font-black uppercase tracking-[0.3em] text-[#5D5FEF]">
        UBICACIÓN
      </p>

      <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
        ¿Dónde está tu negocio?
      </h2>

      <p className="mt-4 text-sm leading-6 text-slate-500">
        Verificaremos la dirección para ubicar correctamente tu negocio en
        LookUp.
      </p>

      <div className="mt-9 space-y-6">
        <div>
          <FieldLabel>Dirección</FieldLabel>

          <input
            type="text"
            value={data.address}
            onChange={(event) =>
              invalidateLocation({
                address: event.target.value,
              })
            }
            placeholder="Calle, número, local..."
            autoComplete="street-address"
            className={INPUT_CLASS_NAME}
          />
        </div>

        <div>
          <FieldLabel>Ciudad</FieldLabel>

          <input
            type="text"
            value={data.city}
            onChange={(event) =>
              invalidateLocation({
                city: event.target.value,
              })
            }
            placeholder="Ej. Soria"
            autoComplete="address-level2"
            className={INPUT_CLASS_NAME}
          />
        </div>

        <div>
          <FieldLabel>Provincia</FieldLabel>

          <input
            type="text"
            value={data.province}
            onChange={(event) =>
              invalidateLocation({
                province: event.target.value,
              })
            }
            placeholder="Ej. Soria"
            autoComplete="address-level1"
            className={INPUT_CLASS_NAME}
          />
        </div>

        <div>
          <FieldLabel>Código postal</FieldLabel>

          <input
            type="text"
            value={data.postalCode}
            onChange={(event) =>
              invalidateLocation({
                postalCode: event.target.value,
              })
            }
            placeholder="Ej. 42001"
            autoComplete="postal-code"
            inputMode="numeric"
            className={INPUT_CLASS_NAME}
          />
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={onVerifyLocation}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-[#D8DBFF] bg-[#F5F6FF] px-5 text-sm font-black text-[#5D5FEF] transition hover:bg-[#ECEEFF] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              VERIFICANDO...
            </>
          ) : isVerified ? (
            <>
              <CheckCircle2 size={18} />
              DIRECCIÓN VERIFICADA
            </>
          ) : (
            <>
              <MapPin size={18} />
              VERIFICAR DIRECCIÓN
            </>
          )}
        </button>

        {isVerified && data.verifiedAddress ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={19}
                className="mt-0.5 shrink-0 text-emerald-600"
              />

              <div>
                <p className="text-sm font-black text-emerald-900">
                  Ubicación encontrada
                </p>

                <p className="mt-1 text-xs leading-5 text-emerald-700">
                  {data.verifiedAddress}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function StepBusinessContact({
  data,
  update,
}: {
  data: BusinessOnboardingData;
  update: (values: Partial<BusinessOnboardingData>) => void;
}) {
  return (
    <section>
      <p className="text-xs font-black uppercase tracking-[0.3em] text-[#5D5FEF]">
        CONTACTO
      </p>

      <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
        ¿Cómo pueden encontrarte?
      </h2>

      <p className="mt-4 text-sm leading-6 text-slate-500">
        Añade los canales principales de contacto de tu negocio.
      </p>

      <div className="mt-9 space-y-6">
        <div>
          <FieldLabel>Email de contacto</FieldLabel>

          <input
            type="email"
            value={data.contactEmail}
            onChange={(event) =>
              update({
                contactEmail: event.target.value,
              })
            }
            placeholder="hola@empresa.com"
            autoComplete="email"
            inputMode="email"
            className={INPUT_CLASS_NAME}
          />
        </div>

        <div>
          <FieldLabel>Teléfono de contacto</FieldLabel>

          <input
            type="tel"
            value={data.contactPhone}
            onChange={(event) =>
              update({
                contactPhone: event.target.value,
              })
            }
            placeholder="+34 600 000 000"
            autoComplete="tel"
            inputMode="tel"
            className={INPUT_CLASS_NAME}
          />
        </div>

        <div>
          <FieldLabel>Sitio web</FieldLabel>

          <input
            type="text"
            value={data.website}
            onChange={(event) =>
              update({
                website: event.target.value,
              })
            }
            placeholder="www.empresa.com"
            autoComplete="url"
            inputMode="url"
            className={INPUT_CLASS_NAME}
          />

          <p className="mt-2 text-xs leading-5 text-slate-400">
            Teléfono y web son opcionales.
          </p>
        </div>
      </div>
    </section>
  );
}

function StepBusinessReview({ data }: { data: BusinessOnboardingData }) {
  return (
    <section>
      <p className="text-xs font-black uppercase tracking-[0.3em] text-[#5D5FEF]">
        YA CASI ESTÁS
      </p>

      <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
        Revisa el perfil de tu empresa
      </h2>

      <p className="mt-4 text-sm leading-6 text-slate-500">
        Comprueba que todo esté correcto antes de publicar tu perfil en LookUp.
      </p>

      <div className="mt-9 overflow-hidden rounded-[28px] border border-[#E7E9F2] bg-[#FAFAFC]">
        <div className="p-6">
          <div className="flex items-center gap-4">
            {data.avatarUrl ? (
              <div
                role="img"
                aria-label={`Foto de ${data.tradeName}`}
                className="h-16 w-16 shrink-0 rounded-[22px] bg-cover bg-center bg-no-repeat shadow-sm"
                style={{
                  backgroundImage: `url("${data.avatarUrl}")`,
                }}
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-[#EEF2FF] text-[#5D5FEF]">
                <Building2 size={29} strokeWidth={2} />
              </div>
            )}

            <div className="min-w-0">
              <h3 className="truncate text-xl font-black text-slate-950">
                {data.tradeName}
              </h3>

              <p className="mt-1 text-sm font-semibold text-[#5D5FEF]">
                {data.sector}
              </p>

              <p className="mt-1 text-xs text-slate-400">{data.legalName}</p>
            </div>
          </div>

          <p className="mt-6 text-sm leading-6 text-slate-600">{data.bio}</p>

          <div className="mt-7 space-y-4">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-[#5D5FEF]" />

              <p className="text-sm leading-6 text-slate-600">
                {data.address}, {data.postalCode} {data.city}, {data.province}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Mail size={18} className="shrink-0 text-[#5D5FEF]" />

              <p className="truncate text-sm text-slate-600">
                {data.contactEmail}
              </p>
            </div>

            {data.contactPhone ? (
              <div className="flex items-center gap-3">
                <Phone size={18} className="shrink-0 text-[#5D5FEF]" />

                <p className="text-sm text-slate-600">{data.contactPhone}</p>
              </div>
            ) : null}

            {data.website ? (
              <div className="flex items-center gap-3">
                <Globe2 size={18} className="shrink-0 text-[#5D5FEF]" />

                <p className="truncate text-sm text-slate-600">
                  {data.website}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {data.socialLinks.filter((link) => link.url.trim()).length > 0 ? (
          <div className="border-t border-[#E7E9F2] bg-white px-6 py-5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
              Redes sociales
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              {data.socialLinks
                .filter((link) => link.url.trim())
                .map((link) => {
                  const platform = SOCIAL_PLATFORMS.find(
                    (item) => item.id === link.platform,
                  );

                  return (
                    <div
                      key={link.platform}
                      className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#5D5FEF]"
                      title={platform?.name ?? link.platform}
                    >
                      <SocialIcon platform={link.platform} size={19} />
                    </div>
                  );
                })}
            </div>
          </div>
        ) : null}
      </div>

      <p className="mt-5 text-center text-xs leading-5 text-slate-400">
        Puedes volver atrás para modificar cualquier información.
      </p>
    </section>
  );
}

export function BusinessOnboardingForm({
  step,
  stepIndex,
  totalSteps,
  progress,
  data,
  loading,
  canContinue,
  update,
  onAvatar,
  onVerifyLocation,
  onBack,
  onNext,
}: Props) {
  return (
    <main className="min-h-screen bg-[#F7F8FC] px-5 py-8 sm:px-6 sm:py-10">
      <section className="mx-auto w-full max-w-[430px]">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">
          LOOKUP
        </p>

        <h1 className="mt-2 text-4xl font-black italic text-[#5D5FEF]">
          Perfil de empresa
        </h1>

        <p className="mt-3 text-sm text-slate-500">
          Paso {stepIndex + 1} de {totalSteps}
        </p>

        <div className="mt-6">
          <ProgressBar progress={progress} />
        </div>

        <div className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm sm:mt-10 sm:p-8">
          {step === "details" && (
            <StepBusinessDetails data={data} update={update} />
          )}

          {step === "photo" && (
            <StepPhoto
              avatarUrl={data.avatarUrl}
              onSelect={onAvatar}
              title="Foto de tu negocio"
              description="Añade tu logotipo o una imagen que permita reconocer tu negocio fácilmente en LookUp."
              optionalLabel="OPCIONAL · PUEDES AÑADIRLA MÁS ADELANTE"
            />
          )}

          {step === "location" && (
            <StepBusinessLocation
              data={data}
              update={update}
              loading={loading}
              onVerifyLocation={onVerifyLocation}
            />
          )}

          {step === "contact" && (
            <StepBusinessContact data={data} update={update} />
          )}

          {step === "socials" && (
            <StepSocials
              links={data.socialLinks}
              onChange={(socialLinks) =>
                update({
                  socialLinks,
                })
              }
            />
          )}

          {step === "review" && <StepBusinessReview data={data} />}

          {step === "terms" && (
            <StepTerms
              accepted={data.acceptedTerms}
              onChange={(acceptedTerms) =>
                update({
                  acceptedTerms,
                })
              }
            />
          )}
        </div>

        <Navigation
          canGoBack={stepIndex > 0 && !loading}
          canContinue={canContinue && !loading}
          isLastStep={stepIndex === totalSteps - 1}
          onBack={onBack}
          onNext={onNext}
          isEditing={false}
        />
      </section>
    </main>
  );
}