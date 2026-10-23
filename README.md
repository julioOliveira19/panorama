# Panorama

Comparador histórico de países para crescimento real anual do PIB e dívida pública bruta como porcentagem do PIB. Os indicadores podem ser vistos separadamente ou juntos, com escalas e tonalidades independentes. O mapa permite zoom e arraste, e a interface oferece temas claro e escuro em português do Brasil, inglês e espanhol. A aplicação usa dados do Fundo Monetário Internacional, mantém lacunas como ausências e distingue projeções recentes.

O idioma pode ser alterado no canto superior direito. A preferência fica salva no navegador e também localiza nomes de países, números, datas, gráficos, tabelas e o CSV exportado.

## Executar no Windows

Abra o PowerShell e rode:

```powershell
Set-Location E:\panorama
New-Item -ItemType Directory -Force .tmp | Out-Null
$env:TEMP = 'E:\panorama\.tmp'
$env:TMP = 'E:\panorama\.tmp'
npm.cmd install
npm.cmd run dev
```

O arquivo `.npmrc` mantém o cache do npm em `E:\panorama\.npm-cache`. Os comandos acima também mantêm os temporários da sessão no SSD.

Abra o endereço exibido pelo Vite, normalmente `http://localhost:5173`.

Para testar a versão final de produção:

```powershell
npm.cmd run build
npm.cmd run preview
```

## Atualizar os dados

```powershell
npm.cmd run data:update
```

O importador consulta quatro séries oficiais do DataMapper:

- FPP `rgc`: crescimento real anual do PIB.
- FPP `d`: dívida pública bruta como porcentagem do PIB.
- WEO `NGDP_RPCH`: crescimento real recente e projeções.
- WEO `GGXWDG_NGDP`: dívida bruta do governo geral recente e projeções.

Os arquivos originais ficam em `data/raw`. Os arquivos consumidos pelo site ficam em `public/data`. O FPP é preservado como histórico; o WEO é acrescentado somente após o último ano FPP disponível para cada país e indicador.

## Verificações

```powershell
npm.cmd run check
```

Esse comando executa lint, testes automatizados e o build de produção.

## GitHub Pages

O workflow `.github/workflows/deploy.yml` testa, compila e publica a pasta `dist` automaticamente. Depois de enviar o projeto ao GitHub:

1. Abra `Settings` → `Pages` no repositório.
2. Em `Build and deployment`, escolha `GitHub Actions`.
3. Envie uma alteração para a branch `main` ou execute o workflow manualmente.

O projeto usa caminhos relativos e funciona em endereços como `https://usuario.github.io/panorama/`. Um domínio próprio pode ser configurado depois nas opções do GitHub Pages.

## Limites metodológicos

- Ausência de dado nunca é tratada como zero.
- Média de crescimento é a média aritmética das taxas anuais disponíveis.
- Crescimento acumulado é calculado separadamente por composição.
- Mudança da dívida é apresentada em pontos percentuais.
- Observações, estimativas e projeções são identificadas.
- Comparações são descritivas e não demonstram causalidade.

## Fontes

- [Public Finances in Modern History — FMI](https://www.imf.org/external/datamapper/datasets/FPP)
- [World Economic Outlook — FMI](https://data.imf.org/Datasets/WEO)
- [Documentação da API DataMapper](https://www.imf.org/external/datamapper/api/)
