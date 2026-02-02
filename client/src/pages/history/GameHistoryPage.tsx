import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import {
  getGameHistoryApi,
  getQuestionStatsApi,
  getRankingProgressionApi,
  generateShareTokenApi,
} from '@/api/history.api';
import type {
  GameHistoryDetail,
  QuestionStats,
  RankingSnapshot,
} from '@shared/types';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import PlayerResultsTable from '@/components/history/PlayerResultsTable';
import QuestionStatsPanel from '@/components/history/QuestionStatsPanel';
import RankingChart from '@/components/history/RankingChart';

export default function GameHistoryPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [game, setGame] = useState<GameHistoryDetail | null>(null);
  const [questionStats, setQuestionStats] = useState<QuestionStats | null>(null);
  const [rankingData, setRankingData] = useState<RankingSnapshot[] | null>(null);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'players' | 'questions' | 'rankings'>('players');

  const isOwner = user && game?.quiz.id;

  useEffect(() => {
    async function load() {
      if (!gameId) return;
      try {
        const data = await getGameHistoryApi(gameId);
        setGame(data);

        // Load ranking data
        const rankings = await getRankingProgressionApi(gameId);
        setRankingData(rankings);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load game history');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [gameId]);

  useEffect(() => {
    async function loadQuestionStats() {
      if (!gameId || selectedQuestionIndex === null) return;
      try {
        const stats = await getQuestionStatsApi(gameId, selectedQuestionIndex);
        setQuestionStats(stats);
      } catch {
        addToast('error', 'Failed to load question stats');
      }
    }
    loadQuestionStats();
  }, [gameId, selectedQuestionIndex, addToast]);

  const handleShare = async () => {
    if (!gameId) return;
    try {
      const result = await generateShareTokenApi(gameId);
      setShareUrl(`${window.location.origin}/shared/${result.shareToken}`);
      setShowShareModal(true);
    } catch {
      addToast('error', 'Failed to generate share link');
    }
  };

  const copyShareUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      addToast('success', 'Link copied to clipboard');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error || 'Game not found'}
          </div>
          <Link to="/dashboard" className="mt-4 inline-block text-indigo-600 hover:text-indigo-700">
            Back to Dashboard
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              to={`/quiz/${game.quiz.id}/history`}
              className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
            >
              &larr; Back to Quiz History
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{game.quiz.title}</h1>
            <p className="text-gray-500">
              {startDate.toLocaleDateString()} at{' '}
              {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &middot;{' '}
              {game.players.length} players &middot; {duration} min &middot; PIN: {game.pin}
            </p>
          </div>
          {isOwner && (
            <Button onClick={handleShare} variant="secondary">
              Share Results
            </Button>
          )}
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
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <Modal isOpen={true} onClose={() => setShowShareModal(false)} title="Share Game Results">
          <p className="text-gray-600 mb-4">
            Anyone with this link can view the results of this game:
          </p>
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              readOnly
              value={shareUrl || ''}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
            />
            <Button onClick={copyShareUrl}>Copy</Button>
          </div>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setShowShareModal(false)}>
              Close
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
