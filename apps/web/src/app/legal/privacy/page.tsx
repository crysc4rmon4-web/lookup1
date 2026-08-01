export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-[#F7F8FC]">

            <section className="mx-auto max-w-4xl px-6 py-16">

                <a
                    href="/onboarding"
                    className="
            inline-flex
            items-center
            gap-2
            rounded-2xl
            border
            border-slate-200
            bg-white
            px-5
            py-3
            text-sm
            font-semibold
            text-slate-600
            shadow-sm
            transition-all
            hover:border-[#5D5FEF]
            hover:text-[#5D5FEF]
          "
                >
                    ← Volver al registro
                </a>

                <div className="mt-10">

                    <p className="text-xs font-black uppercase tracking-[0.35em] text-[#5D5FEF]">
                        LOOKUP LEGAL
                    </p>

                    <h1 className="mt-4 text-5xl font-black leading-tight text-slate-900">
                        Política de Privacidad
                    </h1>

                    <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-500">
                        En LookUp respetamos tu privacidad y protegemos tus datos personales
                        conforme al Reglamento General de Protección de Datos (RGPD), la
                        Ley Orgánica 3/2018 (LOPDGDD) y la normativa europea aplicable.
                    </p>

                    <div className="mt-8 inline-flex rounded-2xl bg-[#EEF0FF] px-5 py-3">

                        <span className="text-sm font-semibold text-[#5D5FEF]">
                            Última actualización · Enero 2027
                        </span>

                    </div>

                </div>

                <div className="mt-16 space-y-14 text-[17px] leading-9 text-slate-700">
          <section>

            <h2 className="text-3xl font-black text-slate-900">
              1. Información que recopilamos
            </h2>

            <p className="mt-5">
              Para prestar correctamente el servicio podremos recopilar la
              información que el usuario decida proporcionar durante el registro
              y utilización de LookUp.
            </p>

            <ul className="mt-5 list-disc space-y-3 pl-7">

              <li>Nombre visible.</li>
              <li>Nombre de usuario.</li>
              <li>Fotografía de perfil.</li>
              <li>Biografía.</li>
              <li>Intereses.</li>
              <li>Redes sociales añadidas voluntariamente.</li>
              <li>Ubicación cuando el usuario otorgue permiso.</li>

            </ul>

          </section>

          <section>

            <h2 className="text-3xl font-black text-slate-900">
              2. Finalidad del tratamiento
            </h2>

            <p className="mt-5">
              Los datos personales únicamente serán utilizados para prestar los
              servicios ofrecidos por LookUp, mejorar la experiencia del usuario,
              garantizar la seguridad de la plataforma y cumplir con las
              obligaciones legales aplicables.
            </p>

          </section>

          <section>

            <h2 className="text-3xl font-black text-slate-900">
              3. Geolocalización
            </h2>

            <p className="mt-5">
              La ubicación solo será utilizada cuando el usuario conceda el
              permiso correspondiente. Esta información permite mostrar personas
              y eventos cercanos utilizando el radar de LookUp.
            </p>

          </section>

          <section>

            <h2 className="text-3xl font-black text-slate-900">
              4. Conservación de los datos
            </h2>

            <p className="mt-5">
              Conservaremos la información únicamente durante el tiempo
              necesario para prestar el servicio o mientras exista una obligación
              legal que así lo requiera.
            </p>

          </section>

          <section>

            <h2 className="text-3xl font-black text-slate-900">
              5. Compartición de información
            </h2>

            <p className="mt-5">
              LookUp no vende datos personales. Solo podrán compartirse con
              proveedores tecnológicos necesarios para el funcionamiento del
              servicio o cuando exista una obligación legal.
            </p>

          </section>

          <section>

            <h2 className="text-3xl font-black text-slate-900">
              6. Seguridad
            </h2>

            <p className="mt-5">
              Aplicamos medidas técnicas y organizativas razonables para proteger
              la información frente a accesos no autorizados, pérdidas,
              modificaciones o destrucción.
            </p>

          </section>

          <section>

            <h2 className="text-3xl font-black text-slate-900">
              7. Derechos del usuario
            </h2>

            <p className="mt-5">
              En cualquier momento podrás ejercer tus derechos de acceso,
              rectificación, supresión, oposición, limitación del tratamiento y
              portabilidad de los datos conforme al Reglamento General de
              Protección de Datos (RGPD).
            </p>

          </section>

          <section>

            <h2 className="text-3xl font-black text-slate-900">
              8. Cookies
            </h2>

            <p className="mt-5">
              LookUp podrá utilizar cookies o tecnologías similares para mejorar
              la navegación, recordar preferencias y analizar el funcionamiento
              de la plataforma cuando resulte necesario.
            </p>

          </section>

          <section>

            <h2 className="text-3xl font-black text-slate-900">
              9. Cambios en esta política
            </h2>

            <p className="mt-5">
              Esta Política de Privacidad podrá actualizarse para adaptarse a
              cambios legales o a nuevas funcionalidades. Cuando los cambios sean
              relevantes se informará a los usuarios antes de su entrada en
              vigor.
            </p>

          </section>

          <section>

            <h2 className="text-3xl font-black text-slate-900">
              10. Contacto
            </h2>

            <p className="mt-5">
              Si tienes cualquier duda sobre esta Política de Privacidad o
              deseas ejercer alguno de tus derechos podrás contactar con el
              equipo de LookUp a través de los canales oficiales de soporte de la
              aplicación.
            </p>

          </section>

        </div>

      </section>

    </main>
  );
}