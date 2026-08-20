export type PlanningItemStatus = 'planning' | 'active' | 'complete' | 'blocked';
export type MilestoneType = 'deadline' | 'launch' | 'review' | 'release';

export interface Milestone {
  id: string;
  title: string;
  date: string;
  type: MilestoneType;
}

export interface ExternalDependency {
  id: string;
  title: string;
  date: string;
}

export interface PlanningItem {
  id: string;
  title: string;
  team: string;
  color: string;
  textColor: string;
  startDate: string;
  endDate: string;
  row: number;
  parentId: string | null;
  dependencies: string[];
  externalDependencies: ExternalDependency[];
  milestones: Milestone[];
  status: PlanningItemStatus;
  description: string;
  owner: string;
}
