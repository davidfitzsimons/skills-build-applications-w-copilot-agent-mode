import { CapabilityCard } from './CapabilityCard.js';

export default function Teams() {
  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      collectionKey="teams"
      emptyMessage="No teams"
      path="/api/teams"
      renderItem={(team) => (
        <>
          <strong>{String(team.name ?? 'Team')}</strong>
          <span className="text-muted"> · {Array.isArray(team.members) ? team.members.length : 0} members</span>
        </>
      )}
    />
  );
}
