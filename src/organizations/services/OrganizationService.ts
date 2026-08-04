import { randomUUID } from "crypto";

import { Organization } from "../models/Organization";
import { OrganizationRepository } from "../repositories/OrganizationRepository";

export class OrganizationService {

    constructor(
        private readonly organizationRepository: OrganizationRepository
    ) {}

    /**
     * Create a new organization.
     */
    async createOrganization(
        name: string,
        slug: string
    ): Promise<Organization> {
       

        // Validation
        if (!name?.trim()) {
            throw new Error("Name is required.");
        }

        if (!slug?.trim()) {
            throw new Error("Slug is required.");
        }

        if (name.length > 100) {
            throw new Error("Name is too long.");
        }

        if (slug.length > 100) {
            throw new Error("Slug is too long.");
        }

        const slugRegex = /^[a-z0-9-]+$/;

        if (!slugRegex.test(slug)) {
            throw new Error(
                "Slug may contain only lowercase letters, numbers, and hyphens."
            );
        }

        const existing =
            await this.organizationRepository.findBySlug(slug);

        if (existing) {
            throw new Error("Organization slug already exists.");
        }

        const organization: Organization = {
            id: randomUUID(),
            name,
            slug,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
        };

        return this.organizationRepository.create(
            organization
        );
    }

    /**
     * Get organization by ID.
     */
    async getOrganization(
        id: string
    ): Promise<Organization> {

        const organization =
            await this.organizationRepository.findById(id);

        if (!organization) {
            throw new Error("Organization not found.");
        }

        return organization;
    }

    /**
     * Get all organizations.
     */
    async listOrganizations(): Promise<Organization[]> {
        return this.organizationRepository.list();
    }

    /**
     * Update organization partially or fully.
     */
    async updateOrganization(
        id: string,
        name?: string,
        slug?: string
    ): Promise<Organization> {

        const organization =
            await this.organizationRepository.findById(id);

        if (!organization) {
            throw new Error("Organization not found.");
        }

        if (name !== undefined) {

            if (!name.trim()) {
                throw new Error("Name is required.");
            }

            if (name.length > 100) {
                throw new Error("Name is too long.");
            }
        }

        if (slug !== undefined) {

            if (!slug.trim()) {
                throw new Error("Slug is required.");
            }

            if (slug.length > 100) {
                throw new Error("Slug is too long.");
            }

            const slugRegex = /^[a-z0-9-]+$/;

            if (!slugRegex.test(slug)) {
                throw new Error(
                    "Slug may contain only lowercase letters, numbers, and hyphens."
                );
            }

            if (organization.slug !== slug) {

                const existing =
                    await this.organizationRepository.findBySlug(slug);

                if (existing) {
                    throw new Error("Organization slug already exists.");
                }
            }
        }

        if (name !== undefined) {
            organization.name = name;
        }

        if (slug !== undefined) {
            organization.slug = slug;
        }

        organization.updatedAt = new Date();

        return this.organizationRepository.update(
            organization
        );
    }

    /**
     * Delete organization.
     */
    async deleteOrganization(
        id: string
    ): Promise<void> {

        const organization =
            await this.organizationRepository.findById(id);

        if (!organization) {
            throw new Error("Organization not found.");
        }

        await this.organizationRepository.delete(id);
    }
}