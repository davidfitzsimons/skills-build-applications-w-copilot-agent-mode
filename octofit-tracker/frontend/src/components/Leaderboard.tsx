import { CapabilityCard } from './CapabilityCard.js';

export default function Leaderboard() {
  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      collectionKey="leaderboard"
      emptyMessage="No leaderboard scores"
      path="/api/leaderboard"
      renderItem={(entry) => (
        <>
          <strong>{String(entry.teamName ?? 'Team')}</strong>
          <span className="text-muted"> · {String(entry.totalPoints ?? 0)} pts</span>
        </>
      )}
    />
  );
}
