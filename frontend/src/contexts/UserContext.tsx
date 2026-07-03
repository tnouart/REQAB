import { createContext, useContext, useState, useEffect } from 'react';
import type { UserRole } from '../services/api';

interface User {
  email: string;
  prenom: string;
  nom: string;
  roles: UserRole[];
}

interface UserContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  hasPermission: () => true,
});

export const useUser = () => useContext(UserContext);

const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ['read', 'write', 'approve', 'delete', 'admin', 'sign', 'export'],
  RESPONSABLE_QUALITE: ['read', 'write', 'approve', 'sign', 'export'],
  REDACTEUR: ['read', 'write'],
  LECTEUR: ['read'],
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    for (const role of user.roles) {
      if (ROLE_PERMISSIONS[role.code]?.includes(permission)) return true;
    }
    return false;
  };

  return (
    <UserContext.Provider value={{ user, login, logout, hasPermission }}>
      {children}
    </UserContext.Provider>
  );
};