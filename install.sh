#!/bin/bash

# Define paths
UUID="gnome-window-limiter@sobeitnow0.github.com"
TARGET_DIR="$HOME/.local/share/gnome-shell/extensions/$UUID"
SRC_DIR="$(dirname "$(realpath "$0")")"

echo "=== Instalador da Extensão GNOME Window Limiter ==="
echo "Pasta de Origem: $SRC_DIR"
echo "Pasta de Destino: $TARGET_DIR"

# Create the target directory if it doesn't exist
mkdir -p "$TARGET_DIR"

# Copy extension files to the GNOME Shell extension directory
echo "Copiando arquivos para o diretório de extensões do GNOME..."
cp -r "$SRC_DIR/metadata.json" "$TARGET_DIR/"
cp -r "$SRC_DIR/extension.js" "$TARGET_DIR/"
cp -r "$SRC_DIR/prefs.js" "$TARGET_DIR/"
mkdir -p "$TARGET_DIR/schemas"
cp "$SRC_DIR/schemas/"*.xml "$TARGET_DIR/schemas/"

# Compile GSettings schemas in the target directory
echo "Compilando schemas GSettings..."
glib-compile-schemas "$TARGET_DIR/schemas/"

# Copy logo if it exists
if [ -f "$SRC_DIR/logo.png" ]; then
    cp "$SRC_DIR/logo.png" "$TARGET_DIR/"
fi

echo "Instalação concluída com sucesso!"
echo "--------------------------------------------------"
echo "Para ativar a extensão:"
echo "1. No Wayland: Reinicie a sessão (Sair / Entrar) ou abra o aplicativo 'Extensões' (gnome-extensions-app)."
echo "2. No X11: Pressione Alt + F2, digite 'r' e pressione Enter para reiniciar o GNOME Shell."
echo "3. Para habilitar via terminal, execute:"
echo "   gnome-extensions enable $UUID"
echo "4. Para abrir a tela de configurações, execute:"
echo "   gnome-extensions prefs $UUID"
echo "--------------------------------------------------"
