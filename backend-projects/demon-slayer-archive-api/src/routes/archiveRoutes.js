
import { Router } from "express";
import {
  getAll,
  getById
} from "../controllers/archiveController.js";

const router = Router();

router.get("/:collection", getAll);
router.get("/:collection/:id", getById);

export default router;
