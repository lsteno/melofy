export const calculateElo = (
  winnerRating: number,
  loserRating: number,
  K = 32
) => {
  const expectedWinner = 1 / (1 + 10 ** ((loserRating - winnerRating) / 400));
  const expectedLoser = 1 / (1 + 10 ** ((winnerRating - loserRating) / 400));

  const newWinnerRating = Math.round(winnerRating + K * (1 - expectedWinner));
  const newLoserRating = Math.round(loserRating + K * (0 - expectedLoser));

  return [newWinnerRating, newLoserRating];
};
