# Contexto do projeto — Panorama

## Produto

O Panorama é um site de comparação internacional de indicadores econômicos, desenvolvido primeiro no Windows e preparado para GitHub Pages e domínio próprio. A interface atende público leigo sem embutir conclusões partidárias ou causais.

## MVP

Indicadores:

1. Crescimento real anual do PIB (%).
2. Dívida pública bruta do governo geral (% do PIB).

Recursos:

- Mapa-múndi interativo com zoom e arraste.
- Seleção de até cinco países.
- Clique simples seleciona ou desmarca o país; Ctrl+clique adiciona ou remove.
- Busca de países para acessibilidade e celular.
- Período configurável sem apagar a seleção.
- Gráfico anual, tabela, resumos e exportação CSV.
- Visualização separada ou simultânea dos dois indicadores, com eixos adequados às unidades.
- Temas claro e escuro com preferência salva no navegador.
- Fonte, edição e estado de observação, estimativa ou projeção.
- Ausência de dados exibida como ausência, nunca zero.

## Fontes

O Public Finances in Modern History (FPP) é a fonte histórica principal. Os códigos validados são `rgc` para crescimento real e `d` para dívida pública bruta/PIB. O World Economic Outlook (WEO) complementa anos recentes com `NGDP_RPCH` e `GGXWDG_NGDP`.

O importador normaliza os dados em registros com país, ano, indicador, valor, unidade, fonte e estado. O WEO só é acrescentado depois do último ano FPP disponível por país e indicador. Mudanças de fonte permanecem visíveis.

## Regras econômicas

- Crescimento anual não deve ser somado como percentual simples.
- A média usa somente taxas anuais observadas no período.
- O acumulado, quando exibido, usa o produto das variações.
- Dívida é estoque; déficit é fluxo e não faz parte deste MVP.
- Dívida/PIB pode cair mesmo com déficit.
- Correlação visual não é prova de causalidade.

## Critérios de aceite

- A aplicação inicia com `npm run dev`.
- Brasil e Peru podem ser comparados em 2000–2014.
- Japão possui visualização histórica em 1955–1964, incluindo lacunas quando existirem.
- Trocar indicador ou período mantém os países.
- CSV, fontes, unidades e estados dos dados aparecem corretamente.
- `npm run check` passa antes da entrega.
