import { DefaultSession } from "next-auth";
import { UserRole } from "./roles";

// Valid role values: 'USER' | 'ADMIN' | 'NUTRITIONIST' (see src/types/roles.ts)
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole;
  }
}
