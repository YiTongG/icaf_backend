import { VoteModel } from '../models/votes'; 
import { ArtworkModel } from '../models/artwork';


type GetTotalVotesResult = {
  Item?: { votes: number };
};

export class VotesService {
  static async getTotalVotes(): Promise<{ votes: number }> {
    const result: GetTotalVotesResult = await ArtworkModel.getTotalVotes();
    const votes = result.Item?.votes ?? 0;
    return { votes };
  }

  static async incrementTotalVotes(): Promise<{ votes: number }> {
    const result = await VoteModel.incrementTotalVotes();
    const votes = (result as any).Attributes.votes as number;
    return { votes };
  }

  static async decrementTotalVotes(): Promise<{ votes: number }> {
    const result = await VoteModel.decrementTotalVotes();
    const votes = (result as any).Attributes.votes as number;
    return { votes };
  }
}