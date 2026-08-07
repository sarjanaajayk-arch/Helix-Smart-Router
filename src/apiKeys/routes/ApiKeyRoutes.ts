import { Router } from "express";

import { database } from "../../database/Database";

import { ApiKeyController } from "../controllers/ApiKeyController";
import { PostgreSQLApiKeyRepository } from "../repositories/PostgreSQLApiKeyRepository";
import { ApiKeyService } from "../services/ApiKeyService";

const router = Router();

const apiKeyRepository =
    new PostgreSQLApiKeyRepository(database);

const apiKeyService =
    new ApiKeyService(apiKeyRepository);

const apiKeyController =
    new ApiKeyController(apiKeyService);

/**
 * Create API Key
 */
router.post(
    "/",
    apiKeyController.create
);

/**
 * Get API Key
 */
router.get(
    "/:id",
    apiKeyController.getById
);

/**
 * List Organization API Keys
 */
router.get(
    "/organization/:organizationId",
    apiKeyController.listByOrganization
);

/**
 * Disable API Key
 */
router.patch(
    "/:id/disable",
    apiKeyController.disable
);

/**
 * Delete API Key
 */
router.delete(
    "/:id",
    apiKeyController.delete
);

export default router;