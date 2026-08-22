"use client";

import {
  Bookmark,
  LoaderCircle,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useAuth,
} from "@/components/auth-provider";

import {
  getEventFavoriteState,
  removeEventFavorite,
  saveEventFavorite,
  type EventFavoriteState,
} from "@/services/events/event-favorite";

type EventFavoriteButtonProps = {
  eventId: string;

  creatorProfileId:
    string;

  initialIsFavorite?:
    boolean | undefined;

  initialCanFavorite?:
    boolean | undefined;

  onChange?: ((
    isFavorite: boolean,
  ) => void) | undefined;

  className?:
    string | undefined;
};

export function EventFavoriteButton({
  eventId,
  creatorProfileId,
  initialIsFavorite,
  initialCanFavorite,
  onChange,
  className = "",
}: EventFavoriteButtonProps) {
  const {
    session,
  } =
    useAuth();

  const [
    isFavorite,
    setIsFavorite,
  ] =
    useState(
      initialIsFavorite ??
        false,
    );

  const [
    canFavorite,
    setCanFavorite,
  ] =
    useState(
      initialCanFavorite ??
        false,
    );

  const [
    reason,
    setReason,
  ] =
    useState<
      EventFavoriteState["reason"]
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(
      initialIsFavorite ===
        undefined ||
        initialCanFavorite ===
          undefined,
    );

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  /*
   * Si la card ya conoce el estado del favorito,
   * sincronizamos el estado local sin hacer
   * una petición adicional.
   */
  useEffect(() => {
    if (
      initialIsFavorite !==
      undefined
    ) {
      setIsFavorite(
        initialIsFavorite,
      );
    }

    if (
      initialCanFavorite !==
      undefined
    ) {
      setCanFavorite(
        initialCanFavorite,
      );
    }

    if (
      initialIsFavorite !==
        undefined &&
      initialCanFavorite !==
        undefined
    ) {
      setLoading(
        false,
      );
    }
  }, [
    initialCanFavorite,
    initialIsFavorite,
  ]);

  /*
   * Cuando el estado no viene precargado
   * (por ejemplo, en /events/[id]),
   * consultamos el favorito actual.
   */
  useEffect(() => {
    if (
      initialIsFavorite !==
        undefined &&
      initialCanFavorite !==
        undefined
    ) {
      return;
    }

    const accessToken =
      session
        ?.access_token
        ?.trim();

    if (!accessToken) {
      setLoading(
        false,
      );

      return;
    }

    /*
     * Conservamos un string ya validado
     * para evitar perder el narrowing
     * dentro de la función async.
     */
    const validAccessToken =
      accessToken;

    let cancelled =
      false;

    async function loadState() {
      setLoading(
        true,
      );

      setError(
        null,
      );

      try {
        const result =
          await getEventFavoriteState(
            validAccessToken,
            eventId,
          );

        if (
          cancelled
        ) {
          return;
        }

        setIsFavorite(
          result.isFavorite,
        );

        setCanFavorite(
          result.canFavorite,
        );

        setReason(
          result.reason,
        );
      } catch (
        loadError
      ) {
        if (
          cancelled
        ) {
          return;
        }

        setError(
          loadError instanceof
            Error
            ? loadError.message
            : "No se pudo comprobar Guardados.",
        );
      } finally {
        if (
          !cancelled
        ) {
          setLoading(
            false,
          );
        }
      }
    }

    void loadState();

    return () => {
      cancelled =
        true;
    };
  }, [
    eventId,
    initialCanFavorite,
    initialIsFavorite,
    session
      ?.access_token,
  ]);

  const isOwner =
    session?.user.id ===
    creatorProfileId;

  async function toggleFavorite() {
    const accessToken =
      session
        ?.access_token
        ?.trim();

    if (
      !accessToken ||
      loading
    ) {
      return;
    }

    /*
     * Siempre permitimos quitar un favorito
     * ya existente.
     *
     * Para crear uno nuevo respetamos
     * canFavorite.
     */
    if (
      !isFavorite &&
      !canFavorite
    ) {
      return;
    }

    setLoading(
      true,
    );

    setError(
      null,
    );

    try {
      if (
        isFavorite
      ) {
        await removeEventFavorite(
          accessToken,
          eventId,
        );

        setIsFavorite(
          false,
        );

        onChange?.(
          false,
        );

        return;
      }

      await saveEventFavorite(
        accessToken,
        eventId,
      );

      setIsFavorite(
        true,
      );

      onChange?.(
        true,
      );
    } catch (
      toggleError
    ) {
      setError(
        toggleError instanceof
          Error
          ? toggleError.message
          : "No se pudo actualizar Guardados.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }

  const disabled =
    loading ||
    (
      !isFavorite &&
      !canFavorite
    );

  const label =
    loading
      ? "Actualizando"
      : isFavorite
        ? "Guardado"
        : isOwner
          ? "Tu evento"
          : reason ===
              "ended"
            ? "Finalizado"
            : "Guardar";

  return (
    <div>
      <button
        type="button"
        onClick={() =>
          void toggleFavorite()
        }
        disabled={
          disabled
        }
        aria-pressed={
          isFavorite
        }
        className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition ${
          isFavorite
            ? "border-[#5D5FEF]/20 bg-[#F0F0FF] text-[#5052D9]"
            : "border-slate-200 bg-white text-slate-600 hover:border-[#5D5FEF]/30 hover:bg-[#F8F8FF] hover:text-[#5D5FEF]"
        } disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        {loading ? (
          <LoaderCircle
            size={17}
            className="animate-spin"
          />
        ) : (
          <Bookmark
            size={17}
            fill={
              isFavorite
                ? "currentColor"
                : "none"
            }
          />
        )}

        {
          label
        }
      </button>

      {error ? (
        <p className="mt-1 text-xs font-semibold text-rose-600">
          {
            error
          }
        </p>
      ) : null}
    </div>
  );
}