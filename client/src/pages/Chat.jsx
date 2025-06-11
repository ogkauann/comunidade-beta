import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  Avatar,
  Flex,
  useColorModeValue,
  IconButton,
  Tooltip
} from '@chakra-ui/react'
import { FaPaperPlane, FaImage, FaCode, FaSmile } from 'react-icons/fa'
import io from 'socket.io-client'

const Chat = () => {
  const { roomId } = useParams()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const socketRef = useRef()
  const messagesEndRef = useRef(null)
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  useEffect(() => {
    // Conectar ao servidor Socket.io
    socketRef.current = io()

    // Entrar na sala
    socketRef.current.emit('join_room', roomId)

    // Carregar mensagens anteriores
    fetchMessages()

    // Configurar listeners
    socketRef.current.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message])
    })

    socketRef.current.on('user_typing', ({ userId, isTyping }) => {
      setTypingUsers((prev) => {
        if (isTyping) {
          return [...prev, userId]
        }
        return prev.filter((id) => id !== userId)
      })
    })

    return () => {
      socketRef.current.disconnect()
    }
  }, [roomId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages/${roomId}`)
      const data = await response.json()
      setMessages(data)
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const messageData = {
      roomId,
      message: newMessage,
      timestamp: new Date()
    }

    socketRef.current.emit('send_message', messageData)
    setNewMessage('')
    setIsTyping(false)
  }

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true)
      socketRef.current.emit('typing', { roomId, isTyping: true })
    }
  }

  return (
    <Box h="calc(100vh - 200px)" display="flex" flexDirection="column">
      <Box
        flex="1"
        overflowY="auto"
        p={4}
        bg={bg}
        borderRadius="lg"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <VStack spacing={4} align="stretch">
          {messages.map((msg, index) => (
            <Flex
              key={index}
              justify={msg.isOwn ? 'flex-end' : 'flex-start'}
            >
              <HStack
                spacing={3}
                bg={msg.isOwn ? 'blue.500' : 'gray.100'}
                color={msg.isOwn ? 'white' : 'black'}
                p={3}
                borderRadius="lg"
                maxW="70%"
              >
                {!msg.isOwn && (
                  <Avatar size="sm" name={msg.remetente} />
                )}
                <VStack align="stretch" spacing={1}>
                  {!msg.isOwn && (
                    <Text fontSize="sm" fontWeight="bold">
                      {msg.remetente}
                    </Text>
                  )}
                  <Text>{msg.mensagem}</Text>
                  <Text fontSize="xs" opacity={0.7}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </Text>
                </VStack>
              </HStack>
            </Flex>
          ))}
          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      {typingUsers.length > 0 && (
        <Text fontSize="sm" color="gray.500" mt={2}>
          {typingUsers.length} usuário(s) digitando...
        </Text>
      )}

      <Box as="form" onSubmit={handleSendMessage} mt={4}>
        <HStack>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleTyping}
            placeholder="Digite sua mensagem..."
          />
          <Tooltip label="Enviar imagem">
            <IconButton
              icon={<FaImage />}
              aria-label="Enviar imagem"
              variant="ghost"
            />
          </Tooltip>
          <Tooltip label="Enviar código">
            <IconButton
              icon={<FaCode />}
              aria-label="Enviar código"
              variant="ghost"
            />
          </Tooltip>
          <Tooltip label="Adicionar emoji">
            <IconButton
              icon={<FaSmile />}
              aria-label="Adicionar emoji"
              variant="ghost"
            />
          </Tooltip>
          <Button
            type="submit"
            colorScheme="blue"
            leftIcon={<FaPaperPlane />}
          >
            Enviar
          </Button>
        </HStack>
      </Box>
    </Box>
  )
}

export default Chat 