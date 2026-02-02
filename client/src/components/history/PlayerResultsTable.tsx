import type { PlayerResult } from '@shared/types';

interface PlayerResultsTableProps {
  players: PlayerResult[];
}

export default function PlayerResultsTable({ players }: PlayerResultsTableProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rank
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Player
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Score
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Correct
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Accuracy
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Avg. Time
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
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
                        ? 'bg-yellow-100 text-yellow-700'
                        : player.finalRank === 2
                        ? 'bg-gray-100 text-gray-700'
                        : player.finalRank === 3
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-50 text-gray-500'
                    }`}
                  >
                    {player.finalRank}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-medium text-gray-900">{player.nickname}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="font-bold text-gray-900">
                    {player.finalScore.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500">
                  {player.correctAnswers}/{player.totalAnswers}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span
                    className={`font-medium ${
                      accuracy >= 70
                        ? 'text-green-600'
                        : accuracy >= 40
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}
                  >
                    {accuracy}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500">
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
