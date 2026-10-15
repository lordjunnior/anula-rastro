---
titulo: "Limpeza de Audio, Video, Compactados e Torrents"
descricao: "Como remover rastros de gravacao em arquivos MP4, MP3, FLAC, pacotes ZIP/TAR e arquivos .torrent."
---

# Limpeza de Audio, Video, Compactados e Torrents

Metadados nao existem apenas em fotos e textos. Gravacoes de voz, videos de camera ou drone, pacotes `.zip` e arquivos `.torrent` carregam identificadores profundos sobre a maquina onde foram gerados.

---

## 1. Higienizacao de Videos e Audios

Cameras e celulares gravam coordenadas de GPS, data da captura, modelo do aparelho e assinatura do codificador diretamente nos cabecalhos do container de video e nas tags de audio.

Para esterilizar um video ou gravacao de voz:

```bash
mat2 gravacao-drone.mp4
mat2 audio-reuniao.mp3
```

O motor aciona o `FFmpeg` e o `Mutagen` com parametros de purga total, copiando apenas os fluxos de audio e video puros para um novo container limpo, sem perda de qualidade.

---

## 2. Limpeza de Arquivos `.torrent`

Quando voce cria um arquivo `.torrent` para compartilhar dados, o programa insere automaticamente o nome e a versao do seu cliente, a data exata da criacao e comentarios internos.

Ao passar o arquivo pelo motor:

```bash
mat2 pacote-dados.torrent
```

O analisador reconstroi o dicionario mantendo estritamente as chaves obrigatorias de funcionamento (`announce`, `announce-list` e `info`), erradicando a assinatura do software criador e o carimbo de tempo.

---

## 3. Limpeza Recursiva de Arquivos Compactados (`.zip`, `.tar.gz`, `.tar.xz`)

Criar um arquivo `.zip` com arquivos limpos dentro nao basta: o proprio `.zip` guarda a data de modificacao de cada item e as permissoes de usuario do seu sistema operacional.

Ao executar a limpeza sobre um pacote compactado:

```bash
mat2 pacote-entrega.zip
```

O sistema extrai todos os itens em memoria, limpa individualmente cada documento ou imagem la dentro, zera os carimbos de data/hora para um valor neutro e gera o pacote `.cleaned.zip` totalmente limpo.