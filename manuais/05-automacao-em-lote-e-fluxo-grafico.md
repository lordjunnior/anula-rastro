---
titulo: "Automacao em Lote e Integracao no Ambiente Grafico"
descricao: "Como limpar dezenas de arquivos simultaneamente pelo terminal ou com um clique direito no gerenciador de arquivos."
---

# Automacao em Lote e Integracao Grafica

Em uma rotina operacional real, limpar arquivos um a um manualmente gera falhas por esquecimento. Este manual ensina a automatizar a higienizacao em pastas inteiras.

---

## 1. Esterilizacao em Lote pelo Terminal

Voce pode passar multiplos arquivos de uma so vez para limpar pastas inteiras:

### Limpar todas as imagens JPG e PNG de uma pasta (gerando copias `.cleaned`)
```bash
mat2 *.jpg *.png
```

### Limpar e substituir diretamente todos os arquivos de uma pasta (sem deixar originais sujos)
```bash
mat2 --inplace pasta_de_envio/*
```

### Limpar pastas e subpastas recursivamente
```bash
find ./pasta_projeto -type f \( -name "*.pdf" -o -name "*.jpg" -o -name "*.docx" \) -exec mat2 --inplace {} +
```

---

## 2. Integracao com Clique Direito (Ambientes Linux)

Voce pode configurar o gerenciador de arquivos para limpar qualquer item clicando com o botao direito do mouse sobre ele:

### No KDE Plasma (Gerenciador Dolphin)
```bash
mkdir -p ~/.local/share/kservices5/ServiceMenus/
cp dolphin/mat2.desktop ~/.local/share/kservices5/ServiceMenus/
```

### No Linux Mint / Cinnamon (Gerenciador Nemo)
```bash
mkdir -p ~/.local/share/nemo/actions/
cp nemo/mat2.nemo_action ~/.local/share/nemo/actions/
```