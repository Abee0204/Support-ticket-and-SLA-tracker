import { useState, useEffect, useCallback } from "react";
import { fetchGraphQL } from "../lib/api";
import { User, AuthPayload } from "../types";

const ME_QUERY = `
  query Me {
    me {
      id
      email
      role
    }
  }
`;

const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        role
      }
    }
  }
`;

const REGISTER_MUTATION = `
  mutation Register($email: String!, $password: String!, $role: Role!) {
    register(email: $email, password: $password, role: $role) {
      token
      user {
        id
        email
        role
      }
    }
  }
`;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    fetchGraphQL<{ me: User | null }>(ME_QUERY)
      .then((data) => {
        if (data.me) {
          setUser(data.me);
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await fetchGraphQL<{ login: AuthPayload }>(LOGIN_MUTATION, {
      email,
      password,
    });
    localStorage.setItem("token", data.login.token);
    localStorage.setItem("user", JSON.stringify(data.login.user));
    setUser(data.login.user);
    return data.login.user;
  }, []);

  const register = useCallback(
    async (email: string, password: string, role: string) => {
      const data = await fetchGraphQL<{ register: AuthPayload }>(
        REGISTER_MUTATION,
        { email, password, role }
      );
      localStorage.setItem("token", data.register.token);
      localStorage.setItem("user", JSON.stringify(data.register.user));
      setUser(data.register.user);
      return data.register.user;
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  const getToken = useCallback(() => {
    return localStorage.getItem("token");
  }, []);

  return { user, loading, login, register, logout, getToken };
}
