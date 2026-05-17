import type { DirectoryComposioConnector } from '../../api/codexGateway'

export function mergeComposioConnectors(
  catalog: DirectoryComposioConnector[],
  liveRows: DirectoryComposioConnector[],
): DirectoryComposioConnector[] {
  const bySlug = new Map(liveRows.map((row) => [row.slug, row]))
  return catalog.map((row) => {
    const live = bySlug.get(row.slug)
    return live ? { ...row, ...live } : row
  })
}

function normalizeSuggestionQuery(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/u)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2)
}

function scoreComposioSuggestion(connector: DirectoryComposioConnector, tokens: string[], fullQuery: string): number {
  const haystack = `${connector.name} ${connector.slug} ${connector.description}`.toLowerCase()
  let score = 0
  for (const token of tokens) {
    if (connector.slug === token || connector.name.toLowerCase() === token) score += 500
    else if (connector.slug.startsWith(token) || connector.name.toLowerCase().startsWith(token)) score += 250
    else if (haystack.includes(token)) score += 100
  }
  if (fullQuery.includes(connector.slug.toLowerCase()) || fullQuery.includes(connector.name.toLowerCase())) score += 150
  if (score <= 0) return 0
  if (connector.activeCount > 0) score += 10_000
  else if (connector.totalConnections > 0) score += 2_500
  else if (connector.isNoAuth) score += 500
  score += connector.toolsCount
  return score
}

export function rankComposioSuggestions(rows: DirectoryComposioConnector[], query: string): DirectoryComposioConnector[] {
  const tokens = normalizeSuggestionQuery(query)
  if (tokens.length === 0) return []
  return rows
    .map((connector) => ({ connector, score: scoreComposioSuggestion(connector, tokens, query.toLowerCase()) }))
    .filter((row) => row.score > 0)
    .sort((first, second) => second.score - first.score || first.connector.name.localeCompare(second.connector.name))
    .map((row) => row.connector)
}
