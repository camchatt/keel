import { SERVICE_CATEGORY_LABEL, getServices } from '@/data/services';
import { circleItems, type CircleItem } from '@/lib/circle';
import type { JoinKind, ShareDetails, Team } from '@/types';

export function isHosted(team: Team): boolean {
  return (team.role ?? 'host') !== 'member';
}

export function hostedTeams(teams: Team[]): Team[] {
  return teams.filter(isHosted);
}

export function joinedTeams(teams: Team[]): Team[] {
  return teams.filter((team) => team.role === 'member');
}

export function joinKind(team: Team): JoinKind {
  const services = getServices(team.serviceIds ?? []);
  if (services.length > 0) return 'service';
  return 'other';
}

export function viaNames(team: Team): string[] {
  return circleItems(team).map((item) => item.name);
}

export function viaLine(team?: Team): string {
  if (!team) return 'via invite';
  const names = viaNames(team);
  if (names.length) return `via ${names.join(' · ')}`;
  return 'via invite';
}

export function joinKindLabel(kind: JoinKind): string {
  return kind === 'service' ? 'Service' : 'Other';
}

export function accessHeading(item: CircleItem): string {
  if (item.kind === 'discount') return 'Discount';
  if (item.kind === 'source') return 'Source';
  switch (item.service.category) {
    case 'invest':
      return 'Investment';
    case 'seats':
      return 'Seats';
    case 'sports':
      return 'Sports';
    case 'perks':
      return 'Perk';
    case 'work':
      return 'Work';
    case 'resources':
      return 'Resource';
    case 'passes':
      return 'Pass';
    default:
      return 'Login';
  }
}

export function accessFieldLabels(item: CircleItem): { login: string; secret: string; extra?: string; secretLocked: boolean } {
  if (item.kind === 'discount') {
    return { login: 'Login', secret: 'Code', extra: 'Note', secretLocked: false };
  }
  if (item.kind === 'source') {
    return { login: 'Login', secret: 'Password', extra: 'Link', secretLocked: true };
  }
  switch (item.service.category) {
    case 'invest':
      return { login: 'Login', secret: 'Password', extra: 'Account', secretLocked: true };
    case 'seats':
      return { login: 'Login', secret: 'Password', extra: 'Seats', secretLocked: true };
    case 'sports':
      return { login: 'Login', secret: 'Password', extra: 'League', secretLocked: true };
    case 'perks':
      return { login: 'Login', secret: 'Password', extra: 'Member ID', secretLocked: true };
    case 'work':
      return { login: 'Login', secret: 'Password', extra: 'Workspace', secretLocked: true };
    case 'resources':
      return { login: 'Login', secret: 'Password', extra: 'Member ID', secretLocked: true };
    case 'passes':
      return { login: 'Login', secret: 'Password', extra: 'Pass number', secretLocked: true };
    case 'stay':
    case 'fly':
      return { login: 'Login', secret: 'Password', extra: 'Loyalty number', secretLocked: true };
    default:
      return { login: 'Login', secret: 'Password', extra: 'Note', secretLocked: true };
  }
}

export function emptyDetails(): ShareDetails {
  return { login: '', password: '', extra: '' };
}

export type AccessEntry = {
  key: string;
  team: Team;
  item: CircleItem;
};

export function accessEntries(teams: Team[]): AccessEntry[] {
  return teams
    .flatMap((team) =>
      circleItems(team)
        .filter((item) => item.kind === 'service')
        .map((item) => ({
          key: `${team.id}:${item.id}`,
          team,
          item,
        })),
    )
    .sort((a, b) => a.item.name.localeCompare(b.item.name) || a.team.name.localeCompare(b.team.name));
}

export function peopleLine(team: Team): string {
  const count = team.members.length;
  const people = count === 0 ? 'Just you' : `${count + 1} people`;
  if (team.hostName?.trim()) return `${people} · ${team.hostName.trim()} hosts`;
  return people;
}

export function categoryLine(team: Team): string {
  const services = getServices(team.serviceIds ?? []);
  const labels = [...new Set(services.map((service) => SERVICE_CATEGORY_LABEL[service.category]))];
  if (team.discountCodes.some((item) => item.place.trim() || item.code.trim()) && !labels.includes('Perks')) {
    labels.push('Code');
  }
  if (labels.length === 0 && (team.sourceIds?.length ?? 0) > 0) return 'Source';
  if (labels.length === 0) return 'Invite';
  return labels.join(' · ');
}
