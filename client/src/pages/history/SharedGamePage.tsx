import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getSharedGameApi,
  getQuestionStatsApi,
  getRankingProgressionApi,
} from '@/api/history.api';
import type {
  GameHistoryDetail,
  QuestionStats,
  RankingSnapshot,
} from '@shared/types';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PlayerResultsTable from '@/components/history/PlayerResultsTable';
import QuestionStatsPanel from '@/components/history/QuestionStatsPanel';
import RankingChart from '@/components/history/RankingChart';

export default function SharedGamePage() {
  const { shareToken } = useParams<{ shareToken: string }>();

  const [game, setGame] = useState<GameHistoryDetail | null>(null);
  const [questionStats, setQuestionStats] = useState<QuestionStats | null>(null);
  const [rankingData, setRankingData] = useState<RankingSnapshot[] | null>(null);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'players' | 'questions' | 'rankings'>('players');

  useEffect(() => {
    async function load() {
      if (!shareToken) return;
      try {
        const data = await getSharedGameApi(shareToken);
        setGame(data);

        // Load ranking data
        const rankings = await getRankingProgressionApi(data.id, shareToken);
        setRankingData(rankings);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Invalid or expired share link');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [shareToken]);

  useEffect(() => {
    async function loadQuestionStats() {
      if (!game || selectedQuestionIndex === null || !shareToken) return;
      try {
        const stats = await getQuestionStatsApi(game.id, selectedQuestionIndex, shareToken);
        setQuestionStats(stats);
      } catch {
        // Silently fail
      }
    }
    loadQuestionStats();
  }, [game, selectedQuestionIndex, shareToken]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Link Invalid</h1>
          <p className="text-gray-500 mb-6">
            {error || 'This share link is invalid or has expired.'}
          </p>
          <Link
            to="/play"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Join a game instead
          </Link>
        </div>
      </div>
    );
  }

  const startDate = new Date(game.startedAt);
  const endDate = new Date(game.finishedAt);
  const duration = Math.round((endDate.getTime() - startDate.getTime()) / 1000 / 60);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full mb-3">
            Shared Results
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{game.quiz.title}</h1>
          <p className="text-gray-500">
            {startDate.toLocaleDateString()} at{' '}
            {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &middot;{' '}
            {game.players.length} players &middot; {duration} min
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-8">
            {[
              { id: 'players', label: 'Players' },
              { id: 'questions', label: 'Questions' },
              { id: 'rankings', label: 'Ranking Progression' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'players' && (
          <PlayerResultsTable players={game.players} />
        )}

        {activeTab === 'questions' && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Question list */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-medium text-gray-900 mb-4">Questions</h3>
              <div className="space-y-2">
                {game.questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setSelectedQuestionIndex(idx)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      selectedQuestionIndex === idx
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="font-medium">Q{idx + 1}:</span>{' '}
                    {q.text.length > 50 ? q.text.slice(0, 50) + '...' : q.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Question stats */}
            <div className="md:col-span-2">
              {selectedQuestionIndex !== null && questionStats ? (
                <QuestionStatsPanel stats={questionStats} />
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                  Select a question to see statistics
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'rankings' && rankingData && (
          <RankingChart data={rankingData} />
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link to="/play" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Want to play? Join a game
          </Link>
        </div>
      </div>
    </div>
  );
}
