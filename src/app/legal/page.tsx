import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/lib/brand";

export const metadata = { title: `Privacidad · ${APP_NAME}` };

/**
 * BORRADOR. Hay que completar los datos marcados como [PENDIENTE] y que lo
 * revise alguien que sepa de protección de datos antes de publicar la app.
 */
export default function LegalPage() {
  return (
    <article className="pb-6">
      <Link href="/perfil" className="icon-btn -ml-2 mb-4" aria-label="Volver">
        <ArrowLeft size={22} />
      </Link>

      <h1 className="font-display text-lg leading-tight font-bold">Privacidad y condiciones</h1>
      <p className="mt-2 text-sm text-muted">Borrador pendiente de revisión. Última actualización: 22/09/2026.</p>

      <Section title="Quién responde de tus datos">
        <p>[PENDIENTE: nombre o razón social, NIF y dirección] · Contacto: [PENDIENTE: correo de contacto].</p>
      </Section>

      <Section title="Qué se guarda y dónde">
        <p>
          Tu nevera, tu lista de la compra, tus recetas guardadas y tus preferencias (dieta, alergias, gustos) se
          guardan <strong>en tu propio dispositivo</strong>, en el almacenamiento del navegador. No se suben a ningún
          servidor de {APP_NAME} ni hay cuentas de usuario en esta versión. Si borras los datos del navegador o
          desinstalas la app, se pierden.
        </p>
      </Section>

      <Section title="Qué pasa con las fotos">
        <p>
          Cuando escaneas, la foto se reduce en tu móvil y se envía a nuestro servidor solo para reenviarla a la API de
          Anthropic (Claude), que identifica los alimentos. {APP_NAME} <strong>no almacena las fotos</strong>: se
          procesan y se descartan.
        </p>
        <p>
          Anthropic trata esos datos como encargado del tratamiento según sus propias condiciones y políticas de
          conservación. [PENDIENTE: enlazar la política vigente de Anthropic y confirmar plazos de conservación antes de
          publicar.]
        </p>
        <p>
          Al pedir recetas se envía la lista de alimentos de tu nevera y tus preferencias (incluidas alergias, que son
          datos de salud). No envíes fotos con información personal que no quieras que salga del móvil.
        </p>
      </Section>

      <Section title="Base legal y finalidad">
        <p>
          Se tratan tus datos para prestarte el servicio que pides (identificar alimentos y proponer recetas), sobre la
          base de la ejecución de ese servicio y de tu consentimiento al usar la app. No se usan para publicidad ni se
          venden a terceros.
        </p>
      </Section>

      <Section title="Tus derechos">
        <p>
          Puedes borrar todos tus datos en cualquier momento desde <strong>Perfil → Borrar todos mis datos</strong>.
          Como no guardamos datos en servidores, no hay nada que rectificar o exportar por nuestra parte. Para cualquier
          consulta sobre protección de datos: [PENDIENTE: correo]. También puedes reclamar ante la Agencia Española de
          Protección de Datos.
        </p>
      </Section>

      <Section title="Recetas y seguridad alimentaria">
        <p>
          Las recetas y las fechas de caducidad las genera una inteligencia artificial y{" "}
          <strong>pueden contener errores</strong>. Son orientativas: haz caso siempre a la etiqueta del producto, a su
          aspecto y a tu criterio. Si tienes alergias, comprueba tú los ingredientes; {APP_NAME} no se hace responsable
          de lo que cocines.
        </p>
      </Section>

      <Section title="Menores">
        <p>La app no está dirigida a menores de 14 años.</p>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 font-semibold">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted">{children}</div>
    </section>
  );
}
