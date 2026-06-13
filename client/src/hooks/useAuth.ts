import { useState, useEffect } from "react";

interface User {
  id: string;
  username?: string;
  name: string;
  isAdmin: boolean;
  memberData?: any;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 로그인 상태 확인
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const userData = localStorage.getItem("user");
    
    if (isLoggedIn === "true" && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error("Failed to parse user data:", error);
        logout();
      }
    }
    
    setIsLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    setUser(null);
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout
  };
}