export function difficultyBadge(difficulty: string) {
  switch (difficulty) {
    case 'easy':   return 'bg-tertiary/10 text-tertiary border border-tertiary/20';
    case 'medium': return 'bg-secondary-container/50 text-on-secondary-container border border-outline-variant/30';
    case 'hard':   return 'bg-error-container/50 text-on-error-container border border-error/20';
    default:       return 'bg-surface-container-high text-on-surface-variant border border-outline-variant';
  }
}

// backwards-compat alias
export const difficultyBg = difficultyBadge;

export function platformBadge(platform: string) {
  switch (platform) {
    case 'leetcode':     return 'bg-yellow-500/10 text-yellow-700 border border-yellow-500/25 dark:text-yellow-400';
    case 'hackerrank':   return 'bg-green-500/10 text-green-700 border border-green-500/25 dark:text-green-400';
    case 'datalemur':    return 'bg-purple-500/10 text-purple-700 border border-purple-500/25 dark:text-purple-400';
    case 'stratascratch':return 'bg-blue-500/10 text-blue-700 border border-blue-500/25 dark:text-blue-400';
    case 'sqlzoo':       return 'bg-cyan-500/10 text-cyan-700 border border-cyan-500/25 dark:text-cyan-400';
    case 'geeksforgeeks':return 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/25 dark:text-emerald-400';
    default:             return 'bg-primary/10 text-primary border border-primary/20';
  }
}

export const platformColor = platformBadge;

export function engagementBadge(status: string) {
  switch (status) {
    case 'active':        return 'bg-tertiary-container/30 text-tertiary border border-tertiary-container/40';
    case 'slipping':      return 'bg-secondary-container/50 text-on-secondary-container border border-secondary-container';
    case 'at_risk':       return 'bg-error-container/50 text-on-error-container border border-error/30';
    case 'dormant':       return 'bg-surface-dim text-on-surface border border-outline-variant';
    case 'never_started': return 'bg-error-container text-on-error-container border border-error/20';
    default:              return 'bg-surface-container-high text-on-surface-variant border border-outline-variant';
  }
}

export const engagementColor = engagementBadge;

export function tierLabel(tier: number) {
  switch (tier) {
    case 1: return 'Code only';
    case 2: return 'Code + Screenshot';
    case 3: return 'Auto-verified';
    case 4: return 'Mentor verified';
    default: return 'Unknown';
  }
}

export function statusColor(status: string) {
  switch (status) {
    case 'mentor_verified': return 'text-tertiary';
    case 'auto_verified':   return 'text-tertiary';
    case 'pending_review':  return 'text-secondary';
    case 'pending':         return 'text-on-surface-variant';
    case 'rejected':        return 'text-error';
    default:                return 'text-on-surface-variant';
  }
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function formatPoints(n: number) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Never';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays <= 0) {
    const diffHrs = Math.floor(diffMs / 3600000);
    if (diffHrs <= 0) return 'Just now';
    return `${diffHrs} hr${diffHrs === 1 ? '' : 's'} ago`;
  }
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

export function initials(name: string | undefined) {
  if (!name) return '?';
  return name
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
