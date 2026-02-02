import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getQuizGamesHistoryApi } from '@/api/history.api';
import { getQuizApi } from '@/api/quiz.api';
import type { GameHistorySummary, Quiz } from '@shared/types';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Button from '@/components/common/Button';

function GameHistoryCard({ game }: { game: GameHistorySummary }) {
  const startDate = new Date(game.startedAt);
  const endDate = new Date(game.finishedAt);
  const duration = Math.round((endDate.getTime() - startDate.getTime()) / 1000 / 60);

  return (
    <Link
      to={`/game/${game.id}/history`}
      className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-gray-500">PIN: {game.pin}</p>
          <p className="text-lg font-semibold text-gray-900">
            {game.playerCount} {game.playerCount === 1 ? 'player' : 'players'}
          </p>
        </div>
        <span className="text-sm text-gray-500">{duration} min</span>
      </div>
      <div className="text-sm text-gray-500">
        {startDate.toLocaleDateString()} at {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </Link>
  );
}

export default function QuizHistoryPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [games, setGames] = useState<GameHistorySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!quizId) return;
      try {
        const [quizData, gamesData] = await Promise.all([
          getQuizApi(quizId),
          getQuizGamesHistoryApi(quizId),
        ]);
        setQuiz(quizData);
        setGames(gamesData);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load history');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [quizId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
          <Link to="/dashboard" className="mt-4 inline-block text-indigo-600 hover:text-indigo-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block">
              &larr; Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Game History: {quiz?.title}
            </h1>
          </div>
        </div>

        {games.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">No games have been played yet for this quiz.</p>
            <Link to={`/quiz/${quizId}/edit`}>
              <Button>Edit Quiz</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {games.map((game) => (
              <GameHistoryCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
