
import express from "express";
import cors from "cors";
import archiveRoutes from "./src/routes/archiveRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Demon Slayer Archive API is running!"
  });
});

app.use("/api", archiveRoutes);

export default app;
