# Contexto do projeto — Panorama

## Produto

O Panorama é um site de comparação internacional de indicadores econômicos, desenvolvido primeiro no Windows e preparado para GitHub Pages e domínio próprio. A interface atende público leigo sem embutir conclusões partidárias ou causais.

## MVP

Indicadores:

1. Crescimento real anual do PIB (%).
2. Dívida pública bruta do governo geral (% do PIB).
3. PIB per capita em PPC, dólares internacionais constantes de 2021.
4. Consumo das famílias per capita em PPC, dólares internacionais constantes de 2021.

Recursos:

- Mapa-múndi interativo ampliado, com zoom por roda, botões ou pinça, arraste e escala temática no ano final selecionado.
- Seleção de múltiplos países, territórios ou agregados econômicos, sem limite rígido.
- Clique simples seleciona ou desmarca o país; Ctrl+clique adiciona ou remove.
- Busca separada entre países/territórios e regiões/grupos econômicos.
- URL compartilhável com seleção, indicador, período e idioma.
- Presets de comparações e períodos frequentes em seletores dropdown compactos.
- Período configurável sem apagar a seleção.
- Gráfico anual com destaque persistente ao clicar na legenda, tabela, resumos e exportação CSV.
- Visualização separada ou simultânea dos dois indicadores, com eixos adequados às unidades.
- Temas claro e escuro com preferência salva no navegador.
- Interface em português do Brasil, inglês e espanhol, com preferência salva no navegador.
- Fonte, edição e estado de observação, estimativa ou projeção.
- Ausência de dados exibida como ausência, nunca zero.
- Metadados de busca e compartilhamento, favicon, manifesto, sitemap e robots.

## Fontes

O Public Finances in Modern History (FPP) é a fonte histórica principal. Os códigos validados são `rgc` para crescimento real e `d` para dívida pública bruta/PIB. O World Economic Outlook (WEO) complementa anos recentes com `NGDP_RPCH` e `GGXWDG_NGDP`.

O importador normaliza os dados em registros com país, ano, indicador, valor, unidade, fonte e estado. O WEO só é acrescentado depois do último ano FPP disponível por país e indicador. Mudanças de fonte permanecem visíveis.

O World Development Indicators do Banco Mundial fornece `NY.GDP.PCAP.PP.KD` para PIB per capita e `NE.CON.PCAP.PP.KD` para consumo das famílias per capita. As duas séries usam PPC em dólares internacionais constantes de 2021, começam em 1990 para Brasil, Peru e Japão e preservam lacunas sem convertê-las em zero.

Abaixo do gráfico, fora do cartão principal, a interface exibe uma nota dinâmica com as fontes e os intervalos efetivamente presentes nos países, indicadores e anos selecionados. A fonte e o status exatos de cada ponto continuam disponíveis no tooltip.

## Regras econômicas

- Crescimento anual não deve ser somado como percentual simples.
- A média usa somente taxas anuais observadas no período.
- O acumulado, quando exibido, usa o produto das variações.
- Dívida é estoque; déficit é fluxo e não faz parte deste MVP.
- Dívida/PIB pode cair mesmo com déficit.
- PIB per capita e consumo per capita são medidas distintas; ambas são exibidas separadamente e não representam distribuição de renda.
- Correlação visual não é prova de causalidade.

## Critérios de aceite

- A aplicação inicia com `npm run dev`.
- Brasil e Peru podem ser comparados em 2000–2014.
- Japão possui visualização histórica em 1955–1964, incluindo lacunas quando existirem.
- Trocar indicador ou período mantém os países.
- Abrir uma URL compartilhada restaura entidades, indicador, período e idioma válidos.
- O mapa usa somente valores existentes no ano escolhido; lacunas permanecem sem cor temática.
- CSV, fontes, unidades e estados dos dados aparecem corretamente.
- Brasil e Peru possuem PIB e consumo per capita desde 1990; lacunas de outros países permanecem visíveis.
- `npm run check` passa antes da entrega.
