import type { PlayerResult } from '@shared/types';

interface PlayerResultsTableProps {
  players: PlayerResult[];
}

export default function PlayerResultsTable({ players }: PlayerResultsTableProps) {
  return (
    <div className="bg-cyber-card border border-primary-500/15 rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-primary-500/10">
        <thead className="bg-cyber-surface">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Rank
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Player
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
              Score
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
              Correct
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
              Accuracy
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
              Avg. Time
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-primary-500/10">
          {players.map((player) => {
            const accuracy = player.totalAnswers > 0
              ? Math.round((player.correctAnswers / player.totalAnswers) * 100)
              : 0;

            return (
              <tr key={player.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                      player.finalRank === 1
                        ? 'bg-neon-yellow/20 text-neon-yellow'
                        : player.finalRank === 2
                        ? 'bg-gray-500/20 text-gray-300'
                        : player.finalRank === 3
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-cyber-surface text-gray-400'
                    }`}
                  >
                    {player.finalRank}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-medium text-gray-100">{player.nickname}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="font-bold text-gray-100">
                    {player.finalScore.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-400">
                  {player.correctAnswers}/{player.totalAnswers}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span
                    className={`font-medium ${
                      accuracy >= 70
                        ? 'text-neon-green'
                        : accuracy >= 40
                        ? 'text-neon-yellow'
                        : 'text-red-400'
                    }`}
                  >
                    {accuracy}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-400">
                  {(player.averageTime / 1000).toFixed(1)}s
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
