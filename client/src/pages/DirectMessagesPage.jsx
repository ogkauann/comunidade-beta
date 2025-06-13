import React, { useState, useEffect } from 'react';
import { Box, Heading, Text, VStack, Button, useToast, SimpleGrid, Card, CardHeader, CardBody, CardFooter, Avatar, Flex } from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function DirectMessagesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchUsers();
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      toast({
        title: 'Erro ao carregar usuários.',
        description: error.response?.data?.msg || 'Não foi possível carregar a lista de usuários.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleStartDirectMessage = async (targetUserId) => {
    try {
      const response = await axios.post('/api/rooms/direct', { targetUserId });
      const roomId = response.data._id;
      toast({
        title: 'Conversa iniciada!',
        description: 'Você foi redirecionado para a sala de DM.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate(`/chat/${roomId}`);
    } catch (error) {
      toast({
        title: 'Erro ao iniciar MD.',
        description: error.response?.data?.msg || 'Não foi possível iniciar a mensagem direta.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={8}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl">Mensagens Diretas</Heading>

        <Box>
          <Heading as="h2" size="lg" mb={4}>Iniciar uma Nova Conversa</Heading>
          {users.length === 0 ? (
            <Text>Nenhum outro usuário disponível para MD.</Text>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {users.map((targetUser) => (
                <Card key={targetUser._id} borderWidth="1px" borderRadius="lg" overflow="hidden">
                  <CardHeader>
                    <Flex alignItems="center">
                      <Avatar name={targetUser.nome} mr={3} />
                      <Heading size="md">{targetUser.nome}</Heading>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <Text fontSize="sm" color="gray.600">{targetUser.email}</Text>
                  </CardBody>
                  <CardFooter>
                    <Button colorScheme="blue" onClick={() => handleStartDirectMessage(targetUser._id)}>
                      Enviar Mensagem
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Box>
      </VStack>
    </Box>
  );
}

export default DirectMessagesPage; 