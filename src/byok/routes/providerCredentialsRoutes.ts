import { Router } from "express";

import { ProviderCredentialsController } from "../controllers/ProviderCredentialsController";

export function createProviderCredentialsRoutes(
    controller: ProviderCredentialsController
): Router {

    console.log("✅ BYOK ROUTES CREATED");

    const router = Router();

    router.use((req, _res, next) => {
        console.log("🔥 BYOK ROUTE HIT");
        next();
    });

    /**
     * Create Provider Credential
     */
    router.post(
        "/organizations/:organizationId/credentials",
        controller.createCredential
    );

    /**
     * List Provider Credentials
     */
    router.get(
        "/organizations/:organizationId/credentials",
        controller.listCredentials
    );

    /**
     * Get Credential
     */
    router.get(
        "/credentials/:id",
        controller.getCredential
    );

    /**
     * Update Credential
     */
    router.put(
        "/credentials/:id",
        controller.updateCredential
    );

    /**
     * Delete Credential
     */
    router.delete(
        "/credentials/:id",
        controller.deleteCredential
    );

    /**
     * Test Credential
     */
    router.post(
        "/credentials/:id/test",
        controller.testCredential
    );

    return router;
}