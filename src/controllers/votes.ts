// src/controllers/VotesController.ts

import { Request, Response } from 'express';
import { VotesService } from '../services/votes';

export class VotesController {
  static async getTotalVotes(req: Request, res: Response): Promise<void> {
    try {
      const votes = await VotesService.getTotalVotes();
      res.status(200).json(votes);
    } catch (error) {
      console.error(error);
      res
        .status(400)
        .json({ error: 'Error fetching total votes' });
    }
  }
}
