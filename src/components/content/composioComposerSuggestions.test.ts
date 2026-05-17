import { describe, expect, it } from 'vitest'
import type { DirectoryComposioConnector } from '../../api/codexGateway'
import { mergeComposioConnectors, rankComposioSuggestions } from './composioComposerSuggestions'

function connector(overrides: Partial<DirectoryComposioConnector>): DirectoryComposioConnector {
  return {
    slug: 'default',
    name: 'Default',
    description: '',
    logoUrl: '',
    latestVersion: '',
    toolsCount: 0,
    triggersCount: 0,
    isNoAuth: false,
    enabled: true,
    authModes: [],
    activeCount: 0,
    totalConnections: 0,
    connectionStatuses: [],
    ...overrides,
  }
}

describe('rankComposioSuggestions', () => {
  it('prefers connected connectors for matching text', () => {
    const rows = [
      connector({ slug: 'reddit', name: 'Reddit', activeCount: 1, toolsCount: 10 }),
      connector({ slug: 'reddit_org', name: 'Reddit Org', activeCount: 0, toolsCount: 50 }),
    ]
    expect(rankComposioSuggestions(rows, 'reddit')[0]?.slug).toBe('reddit')
  })

  it('returns empty results for too-short generic text', () => {
    expect(rankComposioSuggestions([connector({ slug: 'reddit', name: 'Reddit' })], 'r')).toEqual([])
  })
})

describe('mergeComposioConnectors', () => {
  it('preserves catalog availability and overlays live fields by slug', () => {
    const merged = mergeComposioConnectors(
      [connector({ slug: 'reddit', name: 'Reddit', toolsCount: 12 })],
      [connector({ slug: 'reddit', name: 'Reddit', activeCount: 2, totalConnections: 2 })],
    )
    expect(merged[0]).toMatchObject({ slug: 'reddit', name: 'Reddit', activeCount: 2, totalConnections: 2 })
  })
})
