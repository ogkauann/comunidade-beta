import { useState } from 'react';
import { Box, Heading, FormControl, FormLabel, Input, Button, Text, Link as ChakraLink } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@chakra-ui/react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast({
        title: 'Login realizado com sucesso!',
        description: 'Bem-vindo de volta!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao fazer login. Tente novamente.');
      toast({
        title: 'Erro ao fazer login',
        description: err.response?.data?.message || 'Erro ao fazer login. Tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={10} p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
      <Heading as="h2" size="xl" textAlign="center" mb={6}>Login</Heading>
      <form onSubmit={handleSubmit}>
        <FormControl id="email" mb={4} isRequired>
          <FormLabel>Email</FormLabel>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </FormControl>
        <FormControl id="password" mb={6} isRequired>
          <FormLabel>Senha</FormLabel>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </FormControl>
        {error && <Text color="red.500" mb={4}>{error}</Text>}
        <Button type="submit" colorScheme="teal" size="lg" width="full">Entrar</Button>
      </form>
      <Text mt={4} textAlign="center">
        Não tem uma conta?{' '}
        <ChakraLink as={RouterLink} to="/register" color="teal.500">Cadastre-se</ChakraLink>
      </Text>
    </Box>
  );
}

export default Login; 