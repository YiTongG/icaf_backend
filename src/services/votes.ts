import { MockVoteModel } from '../models/votes'; 

type GetTotalVotesResult = {
  Item?: { votes: number };
};

export class VotesService {
  static async getTotalVotes(): Promise<{ votes: number }> {
    const result: GetTotalVotesResult = await MockVoteModel.getTotalVotes();
    const votes = result.Item?.votes ?? 0;
    return { votes };
  }

  static async incrementTotalVotes(): Promise<{ votes: number }> {
    const result = await MockVoteModel.incrementTotalVotes();
    const votes = (result as any).Attributes.votes as number;
    return { votes };
  }

  static async decrementTotalVotes(): Promise<{ votes: number }> {
    const result = await MockVoteModel.decrementTotalVotes();
    const votes = (result as any).Attributes.votes as number;
    return { votes };
  }
}