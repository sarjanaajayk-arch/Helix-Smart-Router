import { Router } from "express";

import { database } from "../../database/Database";

import { OrganizationController } from "../controllers/OrganizationController";
import { PostgreSQLOrganizationRepository } from "../repositories/PostgreSQLOrganizationRepository";
import { OrganizationService } from "../services/OrganizationService";

const router = Router();

const organizationRepository =
    new PostgreSQLOrganizationRepository(database);

const organizationService =
    new OrganizationService(organizationRepository);

const organizationController =
    new OrganizationController(organizationService);

// Create Organization

router.post(
    "/",
    organizationController.register
);

// List Organizations
router.get(
    "/",
    organizationController.list
);

// Get Organization by ID
router.get(
    "/:id",
    organizationController.getById
);

// Update Organization
router.patch(
    "/:id",
    organizationController.update
);

// Delete Organization
router.delete(
    "/:id",
    organizationController.delete
);

export default router;