// types/index.ts

export type Session = {
  id: string;
  title: string;
  start: string;
  end: string;
  notificationId?: string;
  completed?: boolean; // ✅ NEW
};

export type Section = {
  title: string;
  iconName: string;
  timeRange: string;
  data: Session[];
};
