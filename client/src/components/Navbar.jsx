import React from 'react';
import { Box, Flex, Link, Button, Text, HStack, useToast } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NavLink = ({ children, to }) => (
  <Link
    as={RouterLink}
    to={to}
    px={2}
    py={1}
    rounded={'md'}
    _hover={{
      textDecoration: 'none',
      bg: 'teal.700',
    }}
    color="white"
  >
    {children}
  </Link>
);

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Logout realizado.',
        description: 'Você foi desconectado com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast({
        title: 'Erro ao fazer logout.',
        description: 'Não foi possível desconectar. Tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box bg="teal.500" px={4}>
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <Box>
          <NavLink to="/">Home</NavLink>
          {user && (
            <NavLink to="/chat/general">Chat</NavLink>
          )}
          {user && (
            <NavLink to="/rooms">Salas</NavLink>
          )}
        </Box>
        <Flex alignItems={'center'}>
          {user ? (
            <HStack>
              <Text color="white" mr={4}>Bem-vindo, <Link as={RouterLink} to="/profile" fontWeight="bold" _hover={{ textDecoration: 'underline' }}>{user.nome}</Link></Text>
              <Button colorScheme={'teal'} variant={'outline'} size={'sm'} color="white" _hover={{ bg: 'teal.400' }} onClick={handleLogout}>
                Logout
              </Button>
            </HStack>
          ) : (
            <>
              <Link as={RouterLink} to="/login">
                <Button colorScheme={'teal'} variant={'solid'} size={'sm'} mr={4}>
                  Login
                </Button>
              </Link>
              <Link as={RouterLink} to="/register">
                <Button colorScheme={'teal'} variant={'outline'} size={'sm'} color="white" _hover={{ bg: 'teal.400' }}>
                  Register
                </Button>
              </Link>
            </>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}

export default Navbar; 