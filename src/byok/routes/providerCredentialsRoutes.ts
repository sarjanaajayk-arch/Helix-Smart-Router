import { Router } from 'express';

import { ProviderCredentialsController } from '../controllers/ProviderCredentialsController';

export function createProviderCredentialsRoutes(
    controller: ProviderCredentialsController
): Router {

    const router = Router();

    // Create credential
    router.post(
        '/users/:userId/credentials',
        controller.createCredential
    );

    // List credentials
    router.get(
        '/users/:userId/credentials',
        controller.listCredentials
    );

    // Get credential
    router.get(
        '/credentials/:id',
        controller.getCredential
    );

    // Update credential
    router.put(
        '/credentials/:id',
        controller.updateCredential
    );

    // Delete credential
    router.delete(
        '/credentials/:id',
        controller.deleteCredential
    );

    // Test credential
    router.post(
        '/credentials/:id/test',
        controller.testCredential
    );

    return router;
}