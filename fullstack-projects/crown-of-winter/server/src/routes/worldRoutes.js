
import { Router } from "express";

import { authenticate } from "../middleware/authenticate.js";

import {
  create,
  list,
  getOne,
} from "../controllers/worldController.js";

const router = Router();

// All world routes require authentication
router.use(authenticate);

// POST /api/worlds
router.post("/", create);

// GET /api/worlds
router.get("/", list);

// GET /api/worlds/:worldId
router.get("/:worldId", getOne);

export default router;
