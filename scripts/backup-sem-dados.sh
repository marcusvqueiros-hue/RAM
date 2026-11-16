#!/usr/bin/env bash
# Envia uma cópia SANEADA do projeto para o repositório de backup (público):
#   - remove do histórico os arquivos com dados pessoais (seed.sql e o gerador do seed);
#   - troca o e-mail dos commits pelo e-mail "noreply" do GitHub;
#   - confere se não restou nenhum nome de técnico antes de enviar.
# O repositório principal (origin, privado) NÃO é alterado. Uso: bash scripts/backup-sem-dados.sh
set -euo pipefail

BACKUP_URL="https://github.com/marcusvqueiros-hue/RAM.git"
CONTA_BACKUP="marcusvqueiros-hue"
CONTA_ORIGINAL="$(gh api user --jq .login 2>/dev/null || echo CGB-ENERGIA)"
RAIZ="$(git rev-parse --show-toplevel)"
# Nomes a vetar: os técnicos do seed (lidos na hora, nada fica gravado aqui) + extras do arquivo local ".backup-proibidos" (não versionado).
PROIBIDOS="$( { sed -n "s/^  ('\([^']*\)', \(true\|false\))[,;]*$/\1/p" "$RAIZ/supabase/seed.sql"; cat "$RAIZ/.backup-proibidos" 2>/dev/null; } | sed '/^$/d' | paste -sd'|' -)"
[ -n "$PROIBIDOS" ] || { echo "ERRO: lista de nomes vazia; envio cancelado." >&2; exit 1; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"; gh auth switch -u "$CONTA_ORIGINAL" >/dev/null 2>&1 || true' EXIT

gh auth switch -u "$CONTA_BACKUP" >/dev/null
ID="$(gh api user --jq .id)"
EMAIL="${ID}+${CONTA_BACKUP}@users.noreply.github.com"

git clone -q --no-local --branch main "$RAIZ" "$TMP/repo"
cd "$TMP/repo"

export FILTER_BRANCH_SQUELCH_WARNING=1
# remove os arquivos de dados e apaga qualquer nome vetado que tenha restado em versões antigas destes dois arquivos
git filter-branch -f \
  --tree-filter "rm -f supabase/seed.sql scripts/gerar_seed.py; for f in src/lib/usuario.ts scripts/backup-sem-dados.sh; do [ -f \$f ] && sed -i -E 's/$PROIBIDOS/[removido]/g' \$f; done; true" \
  --env-filter "
    export GIT_AUTHOR_EMAIL='$EMAIL' GIT_COMMITTER_EMAIL='$EMAIL'
    export GIT_AUTHOR_NAME='Marcus Vinicius Silva Queiros' GIT_COMMITTER_NAME='Marcus Vinicius Silva Queiros'
  " -- main >/dev/null 2>&1

# descarta tudo que ainda aponte para o histórico original (origin e cópias de segurança do filter-branch)
git remote remove origin
git for-each-ref --format='%(refname)' refs/original | xargs -r -n1 git update-ref -d
git reflog expire --expire=now --all
git gc -q --prune=now

cat > supabase/SEED.md <<'EOF'
# Seed removido deste backup

O arquivo `seed.sql` (histórico de 2024–2026 por técnico) e o gerador `scripts/gerar_seed.py` contêm
dados pessoais e **não são publicados aqui**. Eles existem no repositório principal (privado).
EOF
git add supabase/SEED.md
git -c user.name="Marcus Vinicius Silva Queiros" -c user.email="$EMAIL" commit -q -m "docs: explica a ausência do seed neste backup"

# conferência: nenhum nome pode aparecer em nenhum commit (conteúdo, autoria ou mensagem)
ACHADOS="$(for c in $(git rev-list --all); do git grep -lIE "$PROIBIDOS" "$c" || true; done)"
if [ -n "$ACHADOS" ]; then
  echo "ERRO: dados pessoais no conteúdo do histórico (arquivos abaixo). Envio cancelado." >&2
  echo "$ACHADOS" | sed "s/^[0-9a-f]*:/  /" | sort -u >&2
  exit 1
fi
ACHADOS="$(git log --all --format='%an %ae %s%n%b' | grep -E "$PROIBIDOS|gmail.com" || true)"
if [ -n "$ACHADOS" ]; then
  echo "ERRO: dados pessoais em autoria/mensagens. Envio cancelado." >&2
  exit 1
fi

[ -z "${DRY_RUN:-}" ] || { echo "DRY_RUN: verificação passou; nada foi enviado."; exit 0; }
git remote add backup "$BACKUP_URL"
git -c credential.helper= -c credential.helper='!gh auth git-credential' push --force backup main
echo "Backup enviado para $BACKUP_URL"
