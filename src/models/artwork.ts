import { v4 as uuidv4 } from 'uuid';

export const artworks: Record<string, any> = {};
export const userVotes: Record<string, string> = {};
let totalVotes = 0;

export const ArtworkModel = {
  async getArtworkById(artworkSk: string) {
    const item = artworks[artworkSk];
    if (!item) throw new Error('Artwork not found');
    return { Item: artworks[artworkSk] };
  },

  async createArtwork(item: any) {
    const sk = item.sk || uuidv4();
    artworks[sk] = { ...item, sk, votes: 0, is_approved: false };
    return { sk }; 
  },

  async createArtworkAndUpdateUser(item: any, userSk: string) {
    await ArtworkModel.createArtwork(item);
    return {
      artwork: artworks[item.sk],
      userUpdated: true,
    };
  },

  async deleteArtworkById(artworkSk: string) {
    delete artworks[artworkSk];
  },

  async incrementVoteArtworkById(artworkSk: string) {
    if (!artworks[artworkSk]) throw new Error('Artwork not found');
    artworks[artworkSk].votes = (artworks[artworkSk].votes || 0) + 1;
    totalVotes += 1;
    return { Attributes: artworks[artworkSk] };
  },

  async decrementVoteArtworkById(artworkSk: string) {
    if (!artworks[artworkSk]) throw new Error('Artwork not found');
    artworks[artworkSk].votes = Math.max((artworks[artworkSk].votes || 0) - 1, 0);
    totalVotes = Math.max(totalVotes - 1, 0);
    return { Attributes: artworks[artworkSk] };
  },

  async addNewVote(userSk: string, artworkSk: string) {
    if (userVotes[userSk]) throw new Error('User already voted');
    userVotes[userSk] = artworkSk;
    await ArtworkModel.incrementVoteArtworkById(artworkSk);
    return { message: 'Vote added successfully' };
  },

  async changeVote(userSk: string, oldArtworkSk: string, newArtworkSk: string) {
    if (userVotes[userSk] !== oldArtworkSk) throw new Error('Invalid previous vote');
    await ArtworkModel.decrementVoteArtworkById(oldArtworkSk);
    await ArtworkModel.incrementVoteArtworkById(newArtworkSk);
    userVotes[userSk] = newArtworkSk;
    return { message: 'Vote changed successfully' };
  },

  async approveArtworkById(artworkSk: string, status: boolean) {
    if (!artworks[artworkSk]) throw new Error('Not found');
    artworks[artworkSk].is_approved = status;
    return { Attributes: artworks[artworkSk] };
  },

  async queryArtworks(query: { is_approved?: boolean }) {
    return Object.values(artworks).filter(art => {
      if (query.is_approved !== undefined) return art.is_approved === query.is_approved;
      return true;
    });
  },

  async getTotalVotes() {
    return { Item: { votes: totalVotes } };
  },
};
