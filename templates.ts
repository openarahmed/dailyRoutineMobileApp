// templates.ts

export type Session = {
  title: string;
  startTime: string; // format: "HH:mm"
  endTime: string;
};

export type RoutineTemplate = {
  id: string;
  name: string;
  sessions: Session[];
};

export const routineTemplates: RoutineTemplate[] = [
  {
    id: "study_plan",
    name: "Study Plan",
    sessions: [
      { title: "Morning Review", startTime: "08:00", endTime: "09:30" },
      { title: "Lecture Watching", startTime: "10:00", endTime: "12:00" },
      { title: "Lunch Break", startTime: "12:00", endTime: "13:00" },
      { title: "Practice Problems", startTime: "14:00", endTime: "16:00" },
      { title: "Evening Revision", startTime: "18:00", endTime: "19:00" },
    ],
  },
  {
    id: "morning_routine",
    name: "Morning Routine",
    sessions: [
      { title: "Wake Up & Freshen Up", startTime: "06:00", endTime: "06:30" },
      { title: "Exercise", startTime: "06:30", endTime: "07:00" },
      { title: "Breakfast", startTime: "07:00", endTime: "07:30" },
      { title: "Planning Day", startTime: "07:30", endTime: "08:00" },
    ],
  },
  {
    id: "developer_daily",
    name: "Developer Daily Schedule",
    sessions: [
      { title: "Code Review", startTime: "09:00", endTime: "10:00" },
      { title: "Feature Development", startTime: "10:00", endTime: "12:00" },
      { title: "Lunch Break", startTime: "12:00", endTime: "13:00" },
      { title: "Bug Fixing", startTime: "13:00", endTime: "15:00" },
      { title: "Learning & Docs", startTime: "15:00", endTime: "16:00" },
    ],
  },
];
