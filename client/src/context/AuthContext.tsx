import React, { createContext, useContext } from "react";
import { authClient } from "../lib/auth-client";

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  image?: string | null;
  emailVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: typeof authClient.signIn.email;
  signOut: () => Promise<void>;
  refetchSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: sessionData, isPending, refetch } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut();
    refetch();
  };

  return (
    <AuthContext.Provider
      value={{
        user: (sessionData?.user as User) ?? null,
        isLoading: isPending,
        signIn: authClient.signIn.email,
        signOut: handleSignOut,
        refetchSession: refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
