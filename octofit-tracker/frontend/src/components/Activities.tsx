import { CapabilityCard } from './CapabilityCard.js';

export default function Activities() {
  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      collectionKey="activities"
      emptyMessage="No activities"
      path="/api/activities"
      renderItem={(activity) => (
        <>
          <strong>{String(activity.type ?? 'Activity')}</strong>
          <span className="text-muted"> · {Number(activity.minutes ?? 0)} min</span>
        </>
      )}
    />
  );
}
