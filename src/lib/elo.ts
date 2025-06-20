import { SongsContextType } from "./SongsContext";
import { databases } from '@/lib/appwrite';

const ELO_NOISE = 5; // Noise factor to add randomness to ELO updates

function expected(a: number, b: number) {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}

function calculateRawELO(
  currentElo: number,
  opponentElo: number,
  outcome: number,
  K: number
) {
  return currentElo + K * (outcome - expected(currentElo, opponentElo));
}

function calculateNewELO(
  currentElo: number,
  opponentElo: number,
  outcome: number,
  K: number
) {
  const rawElo = calculateRawELO(currentElo, opponentElo, outcome, K);
  return Math.max(100, Math.round(rawElo + (Math.random() * 2 - 1) * ELO_NOISE));
}

/**
 * Updates the ELO ratings of two songs after a match result and persists the changes.
 *
 * @param songsCtx - The context containing the list of songs and a setter function to update them.
 * @param indices - A tuple containing the indices of the two songs being compared ([firstIndex, secondIndex]).
 * @param winner - Indicates which song won the match ("first" or "second").
 * @param K - (Optional) The K-factor used in the ELO calculation. Defaults to 32.
 * @returns An object containing a `promise` property, which resolves when the ELO updates have been persisted to the database.
 */
export function updateELOsAfterWinning(
  songsCtx: SongsContextType,
  indices: [number, number],
  winner: "first" | "second",
  K = 32
) {
  const [firstIndex, secondIndex] = indices;
  const firstSong = songsCtx.songs[firstIndex!];
  const secondSong = songsCtx.songs[secondIndex!];

  const newFirstElo = calculateNewELO(
    firstSong.elo,
    secondSong.elo,
    winner === "first" ? 1 : 0,
    K
  );
  const newSecondElo = calculateNewELO(
    secondSong.elo,
    firstSong.elo,
    winner === "second" ? 1 : 0,
    K
  );


  /* songsCtx.setSongs((prevSongs) => {
    prevSongs[firstIndex!] = {
      ...prevSongs[firstIndex!],
      elo: newFirstElo,
    };
    prevSongs[secondIndex!] = {
      ...prevSongs[secondIndex!],
      elo: newSecondElo,
    };
    return [...prevSongs];
  }); */
  const newSongs = [...songsCtx.songs];
  newSongs[firstIndex!] = {
    ...newSongs[firstIndex!],
    elo: newFirstElo,
  };
  newSongs[secondIndex!] = {
    ...newSongs[secondIndex!],
    elo: newSecondElo,
  };
  songsCtx.setSongs(newSongs);

  return {
    promise: (async () => {
      await Promise.allSettled([
        databases.updateDocument("db", "songs", firstSong.$id, {
          elo: newFirstElo,
        }),
        databases.updateDocument("db", "songs", secondSong.$id, {
          elo: newSecondElo,
        }),
      ]);
    })(),
    newSongs: newSongs,
  };
}