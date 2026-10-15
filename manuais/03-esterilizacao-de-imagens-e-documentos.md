---
titulo: "Esterilizacao de Imagens e Documentos"
descricao: "Procedimentos operacionais para limpar fotografias, documentos Office e arquivos PDF na linha de comando."
---

# Esterilizacao de Imagens e Documentos

Este manual detalha a rotina pratica para inspecionar e destruir metadados em fotografias e documentos de escritorio antes de qualquer envio externo.

---

## 1. Inspecao Previa (Ver o Que o Arquivo Esconde)

Antes de limpar um arquivo, voce pode listar todos os metadados comprometedores que ele carrega atualmente usando o parametro `-s` (`--show`):

```bash
mat2 -s contrato.pdf
mat2 -s foto-equipamento.jpg
```

O terminal exibira a lista de propriedades ocultas encontradas (autor, criador, software gerador, datas de modificacao e coordenadas GPS).

---

## 2. Esterilizacao Padrao (Criacao de Copia Limpa)

Por padrao, a ferramenta nunca destroi o seu arquivo original por acidente. Ao executar o comando de limpeza em um arquivo, ela cria uma copia nova com o sufixo `.cleaned`:

```bash
mat2 foto-equipamento.jpg
```

* **Arquivo original (mantido intacto):** `foto-equipamento.jpg`
* **Arquivo esterilizado (pronto para envio):** `foto-equipamento.cleaned.jpg`

Para confirmar que o novo arquivo ficou 100% esteril, rode a inspecao nele:

```bash
mat2 -s foto-equipamento.cleaned.jpg
```

O retorno sera `[+] No metadata found` (Nenhum metadado encontrado).

---

## 3. Esterilizacao Direta (Substituicao no Local)

Se voce nao quiser manter o arquivo sujo original e preferir limpar o proprio arquivo diretamente sem criar copias `.cleaned`, utilize o parametro `--inplace`:

```bash
mat2 --inplace documento-confidencial.docx
```

---

## 4. Limpeza Leve para PDFs (`--lightweight`)

Por padrao, a limpeza de PDFs renderiza as paginas em graficos vetoriais para garantir seguranca maxima. Se precisar manter o texto selecionavel e o tamanho do arquivo reduzido, adicione o parametro `-L`:

```bash
mat2 -L relatorio.pdf
```