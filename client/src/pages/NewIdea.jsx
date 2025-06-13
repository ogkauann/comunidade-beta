import { useState } from 'react';
import { Box, Heading, FormControl, FormLabel, Input, Textarea, Button, Tag, TagLabel, TagCloseButton, HStack, VStack, useToast } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function NewIdea() {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [tags, setTags] = useState([]);
  const toast = useToast();
  const navigate = useNavigate();

  const handleAddTag = () => {
    if (tagsInput.trim() && !tags.includes(tagsInput.trim())) {
      setTags([...tags, tagsInput.trim()]);
      setTagsInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/ideas', { titulo, descricao, tags }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast({
        title: 'Ideia criada com sucesso!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/'); // Redireciona para a página inicial
    } catch (error) {
      toast({
        title: 'Erro ao criar ideia.',
        description: error.response?.data?.message || 'Tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error('Erro ao criar ideia:', error);
    }
  };

  return (
    <Box maxW="2xl" mx="auto" mt={10} p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
      <Heading as="h2" size="xl" textAlign="center" mb={6}>Nova Ideia</Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          <FormControl id="titulo" isRequired>
            <FormLabel>Título</FormLabel>
            <Input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </FormControl>
          <FormControl id="descricao" isRequired>
            <FormLabel>Descrição</FormLabel>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </FormControl>
          <FormControl id="tags">
            <FormLabel>Tags (separadas por vírgula ou Enter)</FormLabel>
            <Input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Ex: React, Node.js, Chat"
            />
            <Button size="sm" mt={2} onClick={handleAddTag}>Adicionar Tag</Button>
            <HStack spacing={2} mt={2} wrap="wrap">
              {tags.map((tag) => (
                <Tag size="md" key={tag} borderRadius="full" variant="solid" colorScheme="blue">
                  <TagLabel>{tag}</TagLabel>
                  <TagCloseButton onClick={() => handleRemoveTag(tag)} />
                </Tag>
              ))}
            </HStack>
          </FormControl>
          <Button type="submit" colorScheme="green" size="lg" width="full">Criar Ideia</Button>
        </VStack>
      </form>
    </Box>
  );
}

export default NewIdea; 