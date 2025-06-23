let totalVotes = 0;

export const MockVoteModel = {
  async getTotalVotes() {
    return {
      Item: {
        votes: totalVotes,
      },
    };
  },

  async incrementTotalVotes() {
    totalVotes += 1;
    return {
      Attributes: {
        votes: totalVotes,
      },
    };
  },

  async decrementTotalVotes() {
    totalVotes = Math.max(0, totalVotes - 1);
    return {
      Attributes: {
        votes: totalVotes,
      },
    };
  },
};