import { useMemo } from 'react';
import type { RankingSnapshot } from '@shared/types';

interface RankingChartProps {
  data: RankingSnapshot[];
}

// Colors for top players
const PLAYER_COLORS = [
  '#00f0ff', // neon cyan
  '#ff2d8a', // neon pink
  '#39ff14', // neon green
  '#ffe600', // neon yellow
  '#bf00ff', // neon purple
  '#ff6d00', // neon orange
  '#2979ff', // neon blue
  '#ff4081', // neon rose
];

export default function RankingChart({ data }: RankingChartProps) {
  const { players, chartData } = useMemo(() => {
    if (data.length === 0) return { players: [], chartData: [] };

    // Get unique players from final rankings
    const finalRankings = data[data.length - 1].rankings;
    const topPlayers = finalRankings.slice(0, 8); // Show top 8 players

    // Build chart data - for each question, get each player's rank
    const chartData = data.map((snapshot) => {
      const rankMap = new Map(
        snapshot.rankings.map((r) => [r.playerId, r.rank])
      );
      return {
        questionIndex: snapshot.afterQuestionIndex,
        ranks: topPlayers.map((p) => rankMap.get(p.playerId) || topPlayers.length + 1),
      };
    });

    return { players: topPlayers, chartData };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="bg-cyber-card border border-primary-500/15 rounded-lg shadow p-8 text-center text-gray-400">
        No ranking data available
      </div>
    );
  }

  const numQuestions = data.length;
  const maxRank = players.length;

  // SVG dimensions
  const width = 800;
  const height = 400;
  const padding = { top: 40, right: 120, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scale functions
  const xScale = (index: number) => padding.left + (index / (numQuestions - 1)) * chartWidth;
  const yScale = (rank: number) => padding.top + ((rank - 1) / (maxRank - 1)) * chartHeight;

  return (
    <div className="bg-cyber-card border border-primary-500/15 rounded-lg shadow p-6">
      <h3 className="font-medium text-gray-100 mb-4">Ranking Progression</h3>
      <p className="text-sm text-gray-400 mb-4">
        How player positions changed throughout the game (lower is better)
      </p>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[600px]">
          {/* Grid lines */}
          {Array.from({ length: maxRank }, (_, i) => (
            <line
              key={`grid-${i}`}
              x1={padding.left}
              y1={yScale(i + 1)}
              x2={width - padding.right}
              y2={yScale(i + 1)}
              stroke="rgba(0,240,255,0.1)"
              strokeWidth="1"
            />
          ))}

          {/* Y axis labels (ranks) */}
          {Array.from({ length: maxRank }, (_, i) => (
            <text
              key={`y-label-${i}`}
              x={padding.left - 10}
              y={yScale(i + 1)}
              textAnchor="end"
              alignmentBaseline="middle"
              className="text-xs fill-gray-400"
            >
              #{i + 1}
            </text>
          ))}

          {/* X axis labels (questions) */}
          {chartData.map((d, i) => (
            <text
              key={`x-label-${i}`}
              x={xScale(i)}
              y={height - padding.bottom + 20}
              textAnchor="middle"
              className="text-xs fill-gray-400"
            >
              Q{d.questionIndex + 1}
            </text>
          ))}

          {/* Player lines */}
          {players.map((player, playerIndex) => {
            const color = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
            const pathData = chartData
              .map((d, i) => {
                const x = xScale(i);
                const y = yScale(d.ranks[playerIndex]);
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              })
              .join(' ');

            return (
              <g key={player.playerId}>
                {/* Line */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Points */}
                {chartData.map((d, i) => (
                  <circle
                    key={`point-${player.playerId}-${i}`}
                    cx={xScale(i)}
                    cy={yScale(d.ranks[playerIndex])}
                    r="4"
                    fill={color}
                  />
                ))}
              </g>
            );
          })}

          {/* Legend */}
          {players.map((player, i) => (
            <g key={`legend-${player.playerId}`} transform={`translate(${width - padding.right + 10}, ${padding.top + i * 24})`}>
              <rect
                width="12"
                height="12"
                fill={PLAYER_COLORS[i % PLAYER_COLORS.length]}
                rx="2"
              />
              <text
                x="18"
                y="10"
                className="text-xs fill-gray-300"
              >
                {player.nickname.length > 12 ? player.nickname.slice(0, 12) + '...' : player.nickname}
              </text>
            </g>
          ))}

          {/* Axis titles */}
          <text
            x={width / 2}
            y={height - 10}
            textAnchor="middle"
            className="text-sm fill-gray-400"
          >
            Question
          </text>
          <text
            x={15}
            y={height / 2}
            textAnchor="middle"
            transform={`rotate(-90, 15, ${height / 2})`}
            className="text-sm fill-gray-400"
          >
            Rank
          </text>
        </svg>
      </div>
    </div>
  );
}
