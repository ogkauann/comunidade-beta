import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Heading,
  Text,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
  HStack,
  Tag,
  useColorModeValue
} from '@chakra-ui/react'
import { FaSearch, FaPlus } from 'react-icons/fa'
import { Link as RouterLink } from 'react-router-dom'
import axios from 'axios'

const Home = () => {
  const [ideas, setIdeas] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        const response = await axios.get('/api/ideas')
        setIdeas(response.data)
      } catch (error) {
        console.error('Erro ao buscar ideias:', error)
      }
    }

    fetchIdeas()
  }, [])

  const filteredIdeas = ideas.filter(idea =>
    idea.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    idea.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Box>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading mb={4}>Ideias da Comunidade</Heading>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <FaSearch color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Buscar ideias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Box>

        <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
          {filteredIdeas.map((idea) => (
            <Box
              key={idea._id}
              p={6}
              bg={bg}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              _hover={{ shadow: 'md' }}
            >
              <VStack align="stretch" spacing={4}>
                <Heading size="md">{idea.titulo}</Heading>
                <Text noOfLines={3}>{idea.descricao}</Text>
                <HStack>
                  {idea.tags.map((tag, index) => (
                    <Tag key={index} colorScheme="blue">
                      #{tag}
                    </Tag>
                  ))}
                </HStack>
                <Button
                  as={RouterLink}
                  to={`/chat/${idea.salaChatId}`}
                  colorScheme="blue"
                >
                  Entrar no Chat
                </Button>
              </VStack>
            </Box>
          ))}
        </Grid>

        <Button
          leftIcon={<FaPlus />}
          colorScheme="green"
          size="lg"
          as={RouterLink}
          to="/nova-ideia"
        >
          Nova Ideia
        </Button>
      </VStack>
    </Box>
  )
}

export default Home 