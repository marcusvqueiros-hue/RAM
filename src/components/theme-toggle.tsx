"use client";

import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  function alternar() {
    const atual = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const novo = atual === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = novo;
    try {
      localStorage.setItem("ram-tema", novo);
    } catch {
      /* armazenamento indisponível: o tema vale só nesta sessão */
    }
  }
  return (
    <button
      type="button"
      onClick={alternar}
      className="grid size-10 place-items-center rounded-xl border border-line text-muted transition-colors hover:text-fg"
      aria-label="Alternar tema claro/escuro"
      title="Alternar tema"
    >
      <Moon size={18} className="dark:hidden" aria-hidden />
      <Sun size={18} className="hidden dark:block" aria-hidden />
    </button>
  );
}
