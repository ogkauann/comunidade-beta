import React from 'react';
import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';

function Profile() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Box p={8}>
        <Text>Carregando perfil...</Text>
      </Box>
    );
  }

  return (
    <Box p={8}>
      <VStack spacing={4} align="flex-start">
        <Heading as="h1" size="xl">Meu Perfil</Heading>
        <Text fontSize="lg">
          Nome: <Text as="span" fontWeight="bold">{user.nome}</Text>
        </Text>
        <Text fontSize="lg">
          Email: <Text as="span" fontWeight="bold">{user.email}</Text>
        </Text>
        {/* Adicione mais informações do perfil aqui se necessário */}
      </VStack>
    </Box>
  );
}

export default Profile; 