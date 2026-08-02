import { DefaultSession } from "next-auth";

// Valid role values: 'USER' | 'ADMIN' | 'NUTRITIONIST' (see src/types/roles.ts)
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      /** @see UserRole in src/types/roles.ts */
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    /** @see UserRole in src/types/roles.ts */
    role?: string;
  }
}
