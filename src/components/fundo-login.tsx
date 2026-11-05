import Image from "next/image";
import { Creditos } from "./creditos";

const LOSANGOS = [
  { s: 220, x: "6%", y: "12%", d: "0s", t: "18s", o: 0.55 },
  { s: 120, x: "80%", y: "8%", d: "-4s", t: "22s", o: 0.4 },
  { s: 300, x: "84%", y: "62%", d: "-9s", t: "26s", o: 0.35 },
  { s: 90, x: "18%", y: "74%", d: "-2s", t: "16s", o: 0.5 },
  { s: 160, x: "52%", y: "86%", d: "-12s", t: "20s", o: 0.3 },
  { s: 70, x: "62%", y: "10%", d: "-7s", t: "14s", o: 0.45 },
];

/** Fundo animado (tema claro fixo, para a logo CGB transparente ter contraste) + cartão central. */
export function FundoLogin({ children }: { children: React.ReactNode }) {
  return (
    <div className="login-light fundo-animado relative isolate flex flex-1 items-center justify-center overflow-hidden px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {LOSANGOS.map((l, i) => (
          <span
            key={i}
            className="losango"
            style={{
              width: l.s,
              height: l.s,
              left: l.x,
              top: l.y,
              opacity: l.o,
              animationDelay: l.d,
              animationDuration: l.t,
            }}
          />
        ))}
      </div>

      <main className="relative z-10 w-full max-w-md animate-subir">
        <div className="mb-6 flex justify-center">
          <Image src="/logo-cgb.png" alt="CGB" width={900} height={355} priority className="h-auto w-48 drop-shadow-sm sm:w-56" />
        </div>
        <div className="vidro rounded-3xl p-6 sm:p-8">{children}</div>
        <p className="mt-6 text-center text-xs text-muted">RAM · Relatório de Atividades Mensais de Segurança</p>
        <Creditos className="mt-1" />
      </main>
    </div>
  );
}
