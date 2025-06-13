import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: 'admin' | 'club' | 'college' | 'general';
    };
  }

  interface User {
    role?: 'admin' | 'club' | 'college' | 'general';
  }
}
