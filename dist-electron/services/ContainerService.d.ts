import type { Container } from '../utils/types';
declare class ContainerService {
    private containers;
    initialize(profileId: string): void;
    /** Get the Electron partition string for a container */
    getPartition(containerId: string | null, profileId: string): string;
    /** Get all containers for a profile */
    getContainers(profileId: string): Container[];
    /** Create a new container */
    createContainer(name: string, color: Container['color'], icon: string, profileId: string): Container;
    /** Delete a container */
    deleteContainer(id: string): void;
    /** Add a site rule (domain always opens in this container) */
    addSiteRule(containerId: string, domain: string): void;
    /** Find which container should handle a given domain */
    findContainerForDomain(domain: string): Container | null;
    /** Get color for a container (for UI styling) */
    getContainerColor(containerId: string): string;
}
export declare const containerService: ContainerService;
export default containerService;
