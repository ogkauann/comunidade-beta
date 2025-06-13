import { createContext, useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { useToast } from '@chakra-ui/react';
import { Box, Spinner } from '@chakra-ui/react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(!!token);
  const toast = useToast();

  const justAuthenticatedRef = useRef(false);

  // Configuração do interceptor do Axios para incluir o token de autenticação
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, [token]);

  // Handles successful login/register
  const handleAuthSuccess = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    setLoading(false);
    justAuthenticatedRef.current = true;
  };

  // Effect to load user data from token on initial load or token changes (e.g., logout)
  useEffect(() => {
    if (justAuthenticatedRef.current) {
      justAuthenticatedRef.current = false;
      setLoading(false);
      return;
    }

    if (token) {
      setLoading(true);
      const fetchUser = async () => {
        try {
          const response = await axios.get('/api/auth/me');
          setUser(response.data);
        } catch (error) {
          console.error('Erro ao carregar usuário (useEffect):', error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          toast({
            title: 'Sessão expirada',
            description: 'Por favor, faça login novamente.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [token, toast]);

  const login = async (email, senha) => {
    setLoading(true); // Start loading when attempting login
    try {
      const response = await axios.post('/api/auth/login', { email, senha });
      handleAuthSuccess(response.data.token, response.data.user);
      return response.data.user;
    } catch (error) {
      setLoading(false); // Stop loading on error
      throw error;
    }
  };

  const register = async (nome, email, senha) => {
    setLoading(true); // Start loading when attempting register
    try {
      const response = await axios.post('/api/auth/register', { nome, email, senha });
      handleAuthSuccess(response.data.token, response.data.user);
      return response.data.user;
    } catch (error) {
      setLoading(false); // Stop loading on error
      throw error;
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Erro ao fazer logout no servidor:', error);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setLoading(false);
      justAuthenticatedRef.current = false;
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="100vh"
      >
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="teal.500"
          size="xl"
        />
      </Box>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 