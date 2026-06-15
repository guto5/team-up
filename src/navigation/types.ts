import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
};

export type SetupStackParamList = {
  Setup: undefined;
};

export type FeedStackParamList = {
  FeedList: undefined;
  CreateProject: undefined;
  EditProject: { projectId: string };
  JoinClass: undefined;
  ProjectDetail: { projectId: string };
  TeamChat: { projectId: string };
  Endorsement: { projectId: string };
};

export type TeamStackParamList = {
  MyTeamList: undefined;
  TeamChat: { projectId: string };
  ProjectDetail: { projectId: string };
  EditProject: { projectId: string };
};

export type AppTabParamList = {
  Feed: NavigatorScreenParams<FeedStackParamList>;
  Team: NavigatorScreenParams<TeamStackParamList>;
  Portfolio: undefined;
};

export type TeacherStackParamList = {
  TeacherDashboard: undefined;
  CreateClass: undefined;
  ClassDetail: { classId: string };
  ProjectDetail: { projectId: string };
};

export type TeacherTabParamList = {
  Classes: NavigatorScreenParams<TeacherStackParamList>;
  TeacherProfile: undefined;
};
