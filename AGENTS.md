# Instruções do Codex — Panorama

## Antes de começar

- Leia `CONTEXTO_PROJETO.md` antes de alterar a arquitetura ou os dados.
- Preserve o código existente e converse em português brasileiro.
- Mantenha a aplicação local e publicável como site estático, sem backend obrigatório.
- O MVP possui somente crescimento real anual do PIB e dívida pública bruta/PIB.
- Não acrescente login, monetização ou temas adicionais sem pedido específico.

## Dados e precisão

- Use dados oficiais do FMI e teste fontes e códigos antes de alterar a integração.
- FPP é a fonte histórica. WEO complementa os anos recentes quando compatível.
- Não invente valores nem transforme lacunas em zero.
- Preserve fonte, unidade, edição e condição de observação, estimativa ou projeção.
- Não trate séries metodologicamente diferentes como idênticas sem aviso.
- Média de crescimento é aritmética sobre anos válidos; acumulado usa composição.
- Dívida deve mostrar valor inicial, final e mudança em pontos percentuais.

## Experiência

- Mapa claro, seleção evidente e até cinco países.
- Clique simples substitui a seleção; Ctrl+clique adiciona ou remove.
- A busca de países é a alternativa acessível e móvel.
- Trocar indicador ou período preserva os países.
- Gráfico, tabela, resumo, fontes e CSV são obrigatórios.

## Método de trabalho

- Faça mudanças pequenas e testáveis.
- Execute `npm run check` antes de entregar.
- Mantenha tratamento de erro, carregamento, cache e fallback claros.
- Não grave chaves ou dados pessoais no repositório.
