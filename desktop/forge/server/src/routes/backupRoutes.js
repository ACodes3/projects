
import { Router } from "express";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createDatabaseBackup } from "../services/backupService.js";

const router = Router();

// GET /api/backup/download
router.get("/download", async (req, res) => {
  let tempDir;

  try {
    // Only allow requests from the local computer.
    const remoteAddress = req.socket.remoteAddress;

    if (
      remoteAddress !== "127.0.0.1" &&
      remoteAddress !== "::1" &&
      remoteAddress !== "::ffff:127.0.0.1"
    ) {
      return res.status(403).json({
        success: false,
        message: "Database backups are only available locally.",
      });
    }

    tempDir = await mkdtemp(
      path.join(os.tmpdir(), "forge-backup-")
    );

    const backupPath = path.join(tempDir, "forge-backup.sqlite");

    await createDatabaseBackup(backupPath);

    res.download(backupPath, "forge-backup.sqlite", async (error) => {
      if (error && !res.headersSent) {
        console.error("Backup download failed:", error);

        res.status(500).json({
          success: false,
          message: "Failed to download database backup.",
        });
      }

      await rm(tempDir, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 100,
      }).catch((cleanupError) => {
        console.error("Failed to clean backup files:", cleanupError);
      });
    });
  } catch (error) {
    console.error("Failed to create database backup:", error);

    if (tempDir) {
      await rm(tempDir, {
        recursive: true,
        force: true,
      }).catch(() => {});
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create database backup.",
    });
  }
});

export default router;
