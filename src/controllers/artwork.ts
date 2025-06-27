import { Request, Response } from 'express';
import { ArtworkService } from '../services/artwork';

export const ArtworkController = {
  async getArtwork(req: Request, res: Response) {
    try {
      const { artworkSk } = req.params;
      const artwork = await ArtworkService.getArtworkBySk(artworkSk);
      res.json(artwork);
    } catch (error) {
      res.status(404).json({ error: 'Artwork not found' });
    }
  },

  async getArtworks(req: Request, res: Response) {
    try {
      const artworks = await ArtworkService.getArtworks(req.query);
      res.json(artworks);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch artworks' });
    }
  },

  async addArtwork(req: Request, res: Response) {
    try {
      const item = (req as any).validatedData;
      const artwork = await ArtworkService.addArtwork(item);
      res.status(201).json({ message: 'Artwork created', sk: artwork.sk });
    } catch (error) {
      res.status(400).json({ error: 'Failed to create artwork' });
    }
  },

  async approveArtwork(req: Request, res: Response) {
    try {
      const { artworkSk } = req.params;
      const { is_approved } = req.body;
      const result = await ArtworkService.approveArtwork(artworkSk, is_approved);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: 'Approval failed' });
    }
  },

  async deleteArtwork(req: Request, res: Response) {
    try {
      const { artworkSk } = req.params;
      const result = await ArtworkService.deleteArtwork(artworkSk);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: 'Delete failed' });
    }
  },

  async voteArtwork(req: Request, res: Response) {
    try {
      const { userSk } = req.body;
      const { artworkSk } = req.params;
      const result = await ArtworkService.handleVote(userSk, artworkSk);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: 'Vote failed' });
    }
  },


};
