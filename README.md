# anula-rastro

> Protocolo de esterilização de ficheiros e destruição profunda de metadados: elimine impressões digitais ocultas, coordenadas de GPS e identificadores de hardware antes de publicar ou enviar qualquer documento ou mídia.

---

## Proposta

Apagar comentários visíveis ou mudar o nome de um ficheiro não remove a sua história. Câmaras fotográficas, telemóveis, gravadores de áudio e editores de texto inserem dezenas de camadas ocultas de informação (EXIF, XMP, IPTC, revisões XML, números de série de lentes, fuso horário, nome do utilizador do computador e coordenadas de satélite) dentro da estrutura binária do ficheiro.

O projeto **anula-rastro** documenta a implementação e operação de um motor de limpeza profunda baseado em reconstrução total de ficheiros:

* **Destruição por reconstrução (Lista Branca):** Em vez de procurar metadados conhecidos para apagar (o que deixa passar rastros novos ou proprietários), o sistema extrai apenas os dados visuais ou sonoros essenciais e constrói um ficheiro novo e estéril do zero.
* **Cobertura universal de formatos:** Esterilização completa para imagens (JPG, PNG, HEIC, AVIF, WEBP), documentos (PDF, DOCX, XLSX, ODT), áudio/vídeo (MP3, FLAC, OGG, MP4, AVI), ficheiros compactados e ficheiros `.torrent`.
* **Operação 100% local e offline:** Nenhum ficheiro é enviado para serviços de limpeza na internet. Todo o processamento ocorre na memória da sua própria estação de trabalho.
* **Preservação do original:** Gera automaticamente uma cópia higienizada para envio externo, mantendo o ficheiro bruto intacto no seu arquivo privado se desejar.

---

## Estrutura do Repositório

```text
anula-rastro/
├── README.md
├── LICENSE
└── manuais/
    ├── 01-anatomia-dos-metadados-e-riscos.md
    ├── 02-instalacao-e-dependencias-do-motor.md
    ├── 03-esterilizacao-de-imagens-e-documentos.md
    ├── 04-limpeza-de-audio-video-e-torrents.md
    ├── 05-automacao-em-lote-e-fluxo-grafico.md
    └── 06-modelo-de-ameaca-e-limites-tecnicos.md