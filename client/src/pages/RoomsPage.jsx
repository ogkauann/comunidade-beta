import React, { useState, useEffect } from 'react';
import { Box, Heading, Text, VStack, Button, useToast, FormControl, FormLabel, Input, Select, SimpleGrid, Card, CardHeader, CardBody, CardFooter } from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';

function RoomsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomType, setNewRoomType] = useState('public');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchRooms();
  }, [user, navigate]);

  const fetchRooms = async () => {
    try {
      const response = await axios.get('/api/rooms');
      setRooms(response.data);
    } catch (error) {
      toast({
        title: 'Erro ao carregar salas.',
        description: error.response?.data?.msg || 'Não foi possível carregar as salas.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/rooms', {
        name: newRoomName,
        description: newRoomDescription,
        type: newRoomType,
      });
      setRooms([...rooms, response.data]);
      setNewRoomName('');
      setNewRoomDescription('');
      setNewRoomType('public');
      toast({
        title: 'Sala criada com sucesso!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erro ao criar sala.',
        description: error.response?.data?.msg || 'Não foi possível criar a sala.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleJoinRoom = async (roomId) => {
    try {
      await axios.post(`/api/rooms/${roomId}/join`);
      toast({
        title: 'Você entrou na sala!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate(`/chat/${roomId}`);
    } catch (error) {
      toast({
        title: 'Erro ao entrar na sala.',
        description: error.response?.data?.msg || 'Não foi possível entrar na sala.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={8}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl">Salas de Chat</Heading>

        <Box>
          <Heading as="h2" size="lg" mb={4}>Criar Nova Sala</Heading>
          <form onSubmit={handleCreateRoom}>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Nome da Sala</FormLabel>
                <Input
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Ex: Discussão Geral"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Descrição</FormLabel>
                <Input
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  placeholder="Opcional: Descreva o propósito da sala"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Tipo</FormLabel>
                <Select value={newRoomType} onChange={(e) => setNewRoomType(e.target.value)}>
                  <option value="public">Pública</option>
                  <option value="private">Privada</option>
                </Select>
              </FormControl>
              <Button type="submit" colorScheme="blue" mt={4}>
                Criar Sala
              </Button>
            </VStack>
          </form>
        </Box>

        <Box>
          <Heading as="h2" size="lg" mb={4}>Salas Disponíveis</Heading>
          {rooms.length === 0 ? (
            <Text>Nenhuma sala disponível ainda.</Text>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {rooms.map((room) => (
                <Card key={room._id} borderWidth="1px" borderRadius="lg" overflow="hidden">
                  <CardHeader>
                    <Heading size="md">{room.name}</Heading>
                  </CardHeader>
                  <CardBody>
                    <Text>{room.description || 'Sem descrição.'}</Text>
                    <Text fontSize="sm" color="gray.500">Tipo: {room.type === 'public' ? 'Pública' : 'Privada'}</Text>
                    <Text fontSize="sm" color="gray.500">Criador: {room.creator?.nome}</Text>
                  </CardBody>
                  <CardFooter>
                    <Button colorScheme="teal" onClick={() => handleJoinRoom(room._id)}>
                      Entrar na Sala
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

export default RoomsPage; 