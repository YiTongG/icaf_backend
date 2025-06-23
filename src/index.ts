import express from 'express';
import { Request, Response, NextFunction, RequestHandler } from "express";
import { ArtworkController } from './controllers/artwork';
import { VotesController } from './controllers/votes';
import {
    addArtworkValidator,
    getArtworkValidator,
    approveArtworkValidator,
    deleteArtworkValidator,
    voteArtworkValidator,
    validationMiddleware
  } from '../validators';



export const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
// --- Authentication APIs ---

// --- Artwork APIs ---
app.get('/api/artworks/:artworkSk', getArtworkValidator, validationMiddleware,ArtworkController.getArtwork);
app.get('/api/artworks', ArtworkController.getArtworks);
app.post('/api/artworks', addArtworkValidator, validationMiddleware, ArtworkController.addArtwork);
app.patch('/api/artworks/:artworkSk', approveArtworkValidator, validationMiddleware,ArtworkController.approveArtwork);
app.delete('/api/artworks/:artworkSk',deleteArtworkValidator, validationMiddleware, ArtworkController.deleteArtwork);
app.patch('/api/vote/:artworkSk', voteArtworkValidator, validationMiddleware, ArtworkController.voteArtwork);

// --- Vote APIs ---
app.get("/api/votes",VotesController.getTotalVotes)

// --- Root route ---
app.get('/', (_req, res) => {
  res.send('Hello, ICAF Backend!');
});

// --- Start server --- should be comment out while running ts-jest
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
