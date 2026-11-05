export interface AppBindings {
  NODE_ENV?: string;
  DATABASE_URL?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  ENVIRONMENT?: string;
  PLATFORM_CURRENCY?: string;
  DEFAULT_MARKUP_PERCENTAGE?: string;
}

export type AppVariables = {
  userId?: string;
  userRole?: 'CUSTOMER' | 'AGENCY_OWNER' | 'ADMIN';
  agencyId?: string;
};

export type AppContext = {
  Bindings: AppBindings;
  Variables: AppVariables;
};

