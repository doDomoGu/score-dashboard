import { Router } from "express";
import { getTournaments } from "./getTournaments";
import { createTournament } from "./createTournament";
import { getTournamentById } from "./getTournamentById";
import { updateTournament } from "./updateTournament";
import { deleteTournament } from "./deleteTournament";

const router = Router();

// 路由定义
router.get("/", getTournaments); // GET /api/tournaments
router.post("/", createTournament); // POST /api/tournaments
router.get("/:id", getTournamentById); // GET /api/tournaments/:id
router.put("/:id", updateTournament); // PUT /api/tournaments/:id
router.delete("/:id", deleteTournament); // DELETE /api/tournaments/:id

export default router;
