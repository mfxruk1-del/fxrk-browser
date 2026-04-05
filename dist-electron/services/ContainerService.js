"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.containerService = void 0;
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
const DatabaseService_1 = require("./DatabaseService");
// ============================================================
// FXRK Browser - Container Tab Service
// Each container has an isolated cookie/storage partition.
// ============================================================
const DEFAULT_CONTAINERS = [
    { id: 'personal', name: 'Personal', color: 'blue', icon: '🏠', siteRules: [], profileId: 'default' },
    { id: 'work', name: 'Work', color: 'green', icon: '💼', siteRules: [], profileId: 'default' },
    { id: 'shopping', name: 'Shopping', color: 'orange', icon: '🛒', siteRules: [], profileId: 'default' },
    { id: 'banking', name: 'Banking', color: 'red', icon: '🏦', siteRules: [], profileId: 'default' },
];
class ContainerService {
    containers = new Map();
    initialize(profileId) {
        const stored = DatabaseService_1.db.getContainers(profileId);
        if (stored.length === 0) {
            // Create default containers for new profiles
            for (const container of DEFAULT_CONTAINERS) {
                const c = { ...container, profileId };
                DatabaseService_1.db.saveContainer(c);
                this.containers.set(c.id, c);
            }
        }
        else {
            for (const container of stored) {
                this.containers.set(container.id, container);
            }
        }
        logger_1.logger.info(`Container service initialized with ${this.containers.size} containers`);
    }
    /** Get the Electron partition string for a container */
    getPartition(containerId, profileId) {
        if (!containerId)
            return `persist:profile-${profileId}`;
        return `persist:container-${containerId}-${profileId}`;
    }
    /** Get all containers for a profile */
    getContainers(profileId) {
        return Array.from(this.containers.values()).filter(c => c.profileId === profileId);
    }
    /** Create a new container */
    createContainer(name, color, icon, profileId) {
        const container = {
            id: (0, uuid_1.v4)(),
            name,
            color,
            icon,
            siteRules: [],
            profileId,
        };
        this.containers.set(container.id, container);
        DatabaseService_1.db.saveContainer(container);
        return container;
    }
    /** Delete a container */
    deleteContainer(id) {
        this.containers.delete(id);
        DatabaseService_1.db.deleteContainer(id);
    }
    /** Add a site rule (domain always opens in this container) */
    addSiteRule(containerId, domain) {
        const container = this.containers.get(containerId);
        if (!container)
            return;
        // Remove domain from other containers first
        for (const c of this.containers.values()) {
            const idx = c.siteRules.indexOf(domain);
            if (idx !== -1) {
                c.siteRules.splice(idx, 1);
                DatabaseService_1.db.saveContainer(c);
            }
        }
        if (!container.siteRules.includes(domain)) {
            container.siteRules.push(domain);
            DatabaseService_1.db.saveContainer(container);
        }
    }
    /** Find which container should handle a given domain */
    findContainerForDomain(domain) {
        for (const container of this.containers.values()) {
            if (container.siteRules.some(rule => domain.includes(rule) || rule.includes(domain))) {
                return container;
            }
        }
        return null;
    }
    /** Get color for a container (for UI styling) */
    getContainerColor(containerId) {
        const container = this.containers.get(containerId);
        if (!container)
            return '#888888';
        if (container.customColor)
            return container.customColor;
        const colors = {
            blue: '#0088ff',
            green: '#00cc44',
            orange: '#ff8800',
            red: '#ff2244',
            purple: '#bc13fe',
            cyan: '#00d9ff',
        };
        return colors[container.color] || '#888888';
    }
}
exports.containerService = new ContainerService();
exports.default = exports.containerService;
//# sourceMappingURL=ContainerService.js.map