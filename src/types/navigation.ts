export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: { screen?: string; params?: any };
  FoodRecognition: undefined;
  Profile: { updatedUserData?: any, timestamp?: number };
  UserDetails: { 
    userData?: any;
    isNewUser?: boolean;
    isInitialSetup?: boolean;
  };
};
