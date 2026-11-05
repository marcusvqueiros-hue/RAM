export function Creditos({ className = "" }: { className?: string }) {
  return (
    <p className={`text-center text-xs text-muted ${className}`}>
      Desenvolvedor: <strong className="font-semibold">Marcus Vinicius Silva Queiros</strong>
    </p>
  );
}
