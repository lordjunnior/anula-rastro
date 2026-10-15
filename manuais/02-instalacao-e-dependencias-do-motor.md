---
titulo: "Instalacao e Dependencias do Motor"
descricao: "Guia pratico para instalar o motor de limpeza e suas bibliotecas nativas em sistemas Linux, Windows (WSL) e Contentores."
---

# Instalação e Dependências do Motor

Como o sistema reconstrói ficheiros complexos (como PDFs, documentos Office e vídeos MP4) do zero, ele apoia-se em bibliotecas de renderização nativas do sistema operativo.

---

## 1. Dependências Essenciais de Sistema

Para que todos os formatos de ficheiro sejam suportados na sua totalidade, o ambiente precisa de contar com os seguintes pacotes base:

* **Python 3.9+** e **PyGObject**: Núcleo de execução do motor.
* **Cairo (`pycairo`) e Poppler (`gir1.2-poppler-0.18`)**: Motores gráficos obrigatórios para desmontar e reconstruir páginas de ficheiros PDF e vetores SVG sem deixar metadados.
* **GDK-Pixbuf (`gir1.2-gdkpixbuf-2.0`)**: Utilizado para recodificar matrizes de píxeis de imagens (PNG, JPG, TIFF, etc.).
* **FFmpeg**: Necessário para limpar fluxos de áudio e vídeo em contentores multimédia (MP4, AVI, MP3).
* **Mutagen**: Biblioteca de manipulação limpa de contentores de áudio (FLAC, OGG).

---

## 2. Instalação Rápida em Distribuições Linux

### Sistemas Baseados em Debian / Ubuntu / Mint / Tails
Abra o terminal e instale o pacote diretamente dos repositórios oficiais ou prepare as dependências completas:

```bash
sudo apt update
sudo apt install mat2 ffmpeg libimage-exiftool-perl python3-gi python3-gi-cairo gir1.2-poppler-0.18 gir1.2-gdkpixbuf-2.0 python3-mutagen