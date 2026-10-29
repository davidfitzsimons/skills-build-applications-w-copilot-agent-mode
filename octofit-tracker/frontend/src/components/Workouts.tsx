import { CapabilityCard } from './CapabilityCard.js';

export default function Workouts() {
  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      collectionKey="suggestions"
      emptyMessage="No workout suggestions"
      path="/api/workouts/suggestions/mona@example.com"
      renderItem={(suggestion) => (
        <>
          <strong>{String(suggestion.title ?? 'Workout')}</strong>
          <span className="text-muted"> · {String(suggestion.focus ?? 'general')}</span>
        </>
      )}
    />
  );
}
