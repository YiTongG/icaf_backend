// Use the vote count maintained within the ArtworkModel. The previous
// implementation relied on VoteModel which was never updated when
// artworks received votes, causing `/api/votes` to always return `0`.
// To reflect the real number of votes we read the value from
// `ArtworkModel.getTotalVotes`.
import { VoteModel } from '../models/votes';
import { ArtworkModel } from '../models/artwork';

type GetTotalVotesResult = {
  Item?: { votes: number };
};

export class VotesService {
  static async getTotalVotes(): Promise<{ votes: number }> {
    // Retrieve the accumulated votes from the artwork model which is updated
    // whenever a user votes. This ensures the total reflects all user actions.
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