---
titulo: "Modelo de Ameaca e Limites Tecnicos"
descricao: "Entenda ate onde vai a destruicao de metadados e quais cuidados de seguranca operacional (OPSEC) continuam sob sua responsabilidade."
---

# Modelo de Ameaca e Limites Tecnicos

Uma ferramenta de seguranca so e eficaz quando o operador compreende exatamente o que ela faz e o que permanece visivel no conteudo do arquivo.

---

## 1. O Que o `anula-rastro` Garante?

* Remocao total de estruturas de metadados invisiveis (EXIF, IPTC, XMP, ID3, comentarios de cabecalho, tags de autor, coordenadas GPS e historico de revisoes).
* Limpeza de arquivos aninhados (um documento Word que contem uma fotografia suja colada dentro dele tera tanto o documento quanto a fotografia interna limpos).
* Bloqueio de arquivos corrompidos: se um arquivo estiver malformado e nao puder ser reconstruido com 100% de certeza, o motor aborta a operacao para nao entregar um arquivo parcialmente sujo.

---

## 2. O Que a Limpeza de Metadados NAO Esconde?

Mesmo apos um arquivo ficar tecnicamente esteril no nivel binario, o **conteudo visivel ou sonoro** continua intacto. Mantenha atencao aos seguintes pontos:

1. **Elementos Visuais nas Fotografias:** Reflexos em vidros, placas de rua, fachadas, posicao do sol ou numeros de serie visiveis nas pecas fotografadas.
2. **Micro-pontos de Impressoras Coloridas (Machine Identification Codes):** Impressoras a laser coloridas imprimem pontos amarelos quase invisiveis no papel contendo o numero de serie da impressora e a data. Nunca imprima e escaneie um documento se buscar anonimato; gere e limpe o PDF de forma 100% digital.
3. **Voz e Estilometria:** Em gravacoes de audio, o timbre da voz e ruidos de fundo continuam audiveis. Em textos, o estilo de escrita e termos regionais continuam presentes no texto visivel.

---

## 3. Regra de Ouro Operacional

1. Passe o arquivo pelo `anula-rastro`.
2. Inspecione o arquivo `.cleaned` gerado com `mat2 -s` para confirmar `[+] No metadata found`.
3. Abra o arquivo final e revise visualmente o conteudo antes de publicar.