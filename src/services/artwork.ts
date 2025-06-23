import { ArtworkModel } from '../models/artwork';
import { UserModel } from '../models/user';
import { v4 as uuidv4 } from 'uuid';

export const ArtworkService = {
  async addArtwork(data: any) {
    const sk = data.sk || uuidv4();
    const item = {
      ...data,
      sk,
      pk: 'ART',
      gsi1pk: 'false',
      gsi1sk: sk,
      votes: 0,
      is_approved: false,
      timestamp: Date.now(),
    };
    await ArtworkModel.createArtwork(item);
    return item;
  },

  async getArtworks(queryParams?: { is_approved?: string }) {
    const is_approved = queryParams?.is_approved;
    
    // Convert query param string to boolean if present
    const approvalFlag = is_approved === undefined ? undefined : is_approved === "true";
  
    const items = await ArtworkModel.queryArtworks({ is_approved: approvalFlag });
  
    return items;
  },

  async getArtworkBySk(sk: string) {
    const result = await ArtworkModel.getArtworkById(sk);
    console.log(result)

    if (!result?.Item) throw new Error('Artwork not found');
    return result.Item;
  },

  async approveArtwork(sk: string, isApproved: boolean) {
    const res = await ArtworkModel.approveArtworkById(sk, isApproved);
    return res?.Attributes;
  },

  async deleteArtwork(sk: string) {
    await ArtworkModel.deleteArtworkById(sk);
    return { message: 'Artwork deleted' };
  },

  async voteArtwork(sk: string, userSk: string) {
    const user = await UserModel.getUserBySk(userSk);
    if (!user?.Item) throw new Error('User not found');

    const prevSk = user.Item.voted_sk;
    if (prevSk && prevSk === sk) throw new Error('Cannot vote twice for the same artwork');

    if (prevSk) {
      return await ArtworkModel.changeVote(userSk, prevSk, sk);
    } else {
      return await ArtworkModel.addNewVote(userSk, sk);
    }
  },
   async  handleVote(userSk: string, artworkSk: string) {
    const userData = await UserModel.getUserBySk(userSk);
    console.log(userData)
    if (!userData?.Item) {
      throw new Error("User not found");
    }
  
    const currentVote = userData.Item.voted_sk;
  
    if (currentVote) {
      if (currentVote === artworkSk) {
        // Prevent duplicate voting
        throw new Error("Cannot vote on the same artwork twice");
      }
      // Change vote from previous artwork to new one
      return await ArtworkModel.changeVote(userSk, currentVote, artworkSk);
    }
  
    // First-time vote
    return await ArtworkModel.addNewVote(userSk, artworkSk);
  },

};
