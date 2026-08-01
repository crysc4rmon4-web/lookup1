export default function TermsPage() {
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
                        Términos y Condiciones de Uso
                    </h1>

                    <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-500">
                        Estos términos regulan el acceso y uso de la plataforma LookUp.
                        Al crear una cuenta aceptas las condiciones descritas en este
                        documento y nuestra Política de Privacidad.
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
                            1. Aceptación de los términos
                        </h2>

                        <p className="mt-5">
                            Al crear una cuenta en LookUp confirmas que has leído,
                            comprendido y aceptado íntegramente estos Términos y Condiciones.
                            Si no estás de acuerdo con cualquiera de ellos, no deberás utilizar
                            la plataforma.
                        </p>

                    </section>

                    <section>

                        <h2 className="text-3xl font-black text-slate-900">
                            2. Requisitos de uso
                        </h2>

                        <ul className="mt-5 list-disc space-y-3 pl-7">

                            <li>Tener al menos 18 años cuando la legislación aplicable así lo exija.</li>

                            <li>Proporcionar información veraz y actualizada.</li>

                            <li>No crear cuentas falsas o suplantar la identidad de terceros.</li>

                            <li>Mantener la confidencialidad de las credenciales de acceso.</li>

                        </ul>

                    </section>

                    <section>

                        <h2 className="text-3xl font-black text-slate-900">
                            3. Conducta permitida
                        </h2>

                        <p className="mt-5">
                            LookUp está diseñado para facilitar conexiones reales entre
                            personas. El usuario se compromete a utilizar la plataforma de
                            forma responsable, respetuosa y conforme a la legislación vigente.
                        </p>

                    </section>

                    <section>

                        <h2 className="text-3xl font-black text-slate-900">
                            4. Conductas prohibidas
                        </h2>

                        <ul className="mt-5 list-disc space-y-3 pl-7">

                            <li>Acosar, amenazar o intimidar a otros usuarios.</li>

                            <li>Publicar contenido ilegal, ofensivo o discriminatorio.</li>

                            <li>Compartir malware o realizar actividades fraudulentas.</li>

                            <li>Automatizar el uso de la plataforma sin autorización.</li>

                            <li>Intentar acceder a sistemas o información sin permiso.</li>

                        </ul>

                    </section>

                    <section>

                        <h2 className="text-3xl font-black text-slate-900">
                            5. Contenido del usuario
                        </h2>

                        <p className="mt-5">
                            Cada usuario conserva la propiedad del contenido que publica,
                            pero concede a LookUp una licencia limitada para almacenarlo,
                            procesarlo y mostrarlo exclusivamente con el fin de prestar el
                            servicio.
                        </p>

                    </section>

                    <section>

                        <h2 className="text-3xl font-black text-slate-900">
                            6. Suspensión de cuentas
                        </h2>

                        <p className="mt-5">
                            LookUp podrá suspender temporal o definitivamente cuentas que
                            incumplan estos términos o representen un riesgo para la comunidad
                            o para la seguridad de la plataforma.
                        </p>

                    </section>

                    <section>

                        <h2 className="text-3xl font-black text-slate-900">
                            7. Limitación de responsabilidad
                        </h2>

                        <p className="mt-5">
                            LookUp actúa como plataforma tecnológica y no garantiza la
                            veracidad del contenido publicado por los usuarios ni responde por
                            las interacciones que estos mantengan fuera de la aplicación.
                        </p>

                    </section>

                    <section>

                        <h2 className="text-3xl font-black text-slate-900">
                            8. Modificaciones
                        </h2>

                        <p className="mt-5">
                            Estos términos podrán actualizarse para adaptarse a cambios
                            legales, técnicos o funcionales. Cuando existan modificaciones
                            relevantes se informará a los usuarios mediante la propia
                            plataforma.
                        </p>

                    </section>

                    <section>

                        <h2 className="text-3xl font-black text-slate-900">
                            9. Legislación aplicable
                        </h2>

                        <p className="mt-5">
                            Estos términos se interpretarán conforme a la legislación española
                            y, en su caso, al Reglamento General de Protección de Datos (RGPD)
                            y demás normativa europea aplicable.
                        </p>

                    </section>

                </div>

            </section>

        </main>
    );
}