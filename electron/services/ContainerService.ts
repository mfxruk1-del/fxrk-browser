import { session } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '../utils/logger'
import { db } from './DatabaseService'
import type { Container } from '../utils/types'

// ============================================================
// FXRK Browser - Container Tab Service
// Each container has an isolated cookie/storage partition.
// ============================================================

const DEFAULT_CONTAINERS: Container[] = [
  { id: 'personal', name: 'Personal', color: 'blue', icon: '🏠', siteRules: [], profileId: 'default' },
  { id: 'work', name: 'Work', color: 'green', icon: '💼', siteRules: [], profileId: 'default' },
  { id: 'shopping', name: 'Shopping', color: 'orange', icon: '🛒', siteRules: [], profileId: 'default' },
  { id: 'banking', name: 'Banking', color: 'red', icon: '🏦', siteRules: [], profileId: 'default' },
]

class ContainerService {
  private containers: Map<string, Container> = new Map()

  initialize(profileId: string): void {
    const stored = db.getContainers(profileId)

    if (stored.length === 0) {
      // Create default containers for new profiles
      for (const container of DEFAULT_CONTAINERS) {
        const c = { ...container, profileId }
        db.saveContainer(c)
        this.containers.set(c.id, c)
      }
    } else {
      for (const container of stored) {
        this.containers.set(container.id, container)
      }
    }

    logger.info(`Container service initialized with ${this.containers.size} containers`)
  }

  /** Get the Electron partition string for a container */
  getPartition(containerId: string | null, profileId: string): string {
    if (!containerId) return `persist:profile-${profileId}`
    return `persist:container-${containerId}-${profileId}`
  }

  /** Get all containers for a profile */
  getContainers(profileId: string): Container[] {
    return Array.from(this.containers.values()).filter(c => c.profileId === profileId)
  }

  /** Create a new container */
  createContainer(
    name: string,
    color: Container['color'],
    icon: string,
    profileId: string
  ): Container {
    const container: Container = {
      id: uuidv4(),
      name,
      color,
      icon,
      siteRules: [],
      profileId,
    }
    this.containers.set(container.id, container)
    db.saveContainer(container)
    return container
  }

  /** Delete a container */
  deleteContainer(id: string): void {
    this.containers.delete(id)
    db.deleteContainer(id)
  }

  /** Add a site rule (domain always opens in this container) */
  addSiteRule(containerId: string, domain: string): void {
    const container = this.containers.get(containerId)
    if (!container) return

    // Remove domain from other containers first
    for (const c of this.containers.values()) {
      const idx = c.siteRules.indexOf(domain)
      if (idx !== -1) {
        c.siteRules.splice(idx, 1)
        db.saveContainer(c)
      }
    }

    if (!container.siteRules.includes(domain)) {
      container.siteRules.push(domain)
      db.saveContainer(container)
    }
  }

  /** Find which container should handle a given domain */
  findContainerForDomain(domain: string): Container | null {
    for (const container of this.containers.values()) {
      if (container.siteRules.some(rule => domain.includes(rule) || rule.includes(domain))) {
        return container
      }
    }
    return null
  }

  /** Get color for a container (for UI styling) */
  getContainerColor(containerId: string): string {
    const container = this.containers.get(containerId)
    if (!container) return '#888888'
    if (container.customColor) return container.customColor

    const colors: Record<string, string> = {
      blue: '#0088ff',
      green: '#00cc44',
      orange: '#ff8800',
      red: '#ff2244',
      purple: '#bc13fe',
      cyan: '#00d9ff',
    }
    return colors[container.color] || '#888888'
  }
}

export const containerService = new ContainerService()
export default containerService
