import { useState, useEffect, useRef, useCallback } from 'react'
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
  Tooltip,
  useToast
} from '@chakra-ui/react'
import { FaPaperPlane, FaImage, FaCode, FaSmile } from 'react-icons/fa'
import io from 'socket.io-client'
import { useAuth } from '../context/AuthContext.jsx'
import Message from '../components/Message.jsx'

const Chat = () => {
  const { roomId } = useParams()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const socketRef = useRef()
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const { user, token } = useAuth()
  const toast = useToast()

  useEffect(() => {
    socketRef.current = io({
      auth: {
        token: token,
      },
    });

    socketRef.current.emit('join_room', roomId)

    fetchMessages()

    socketRef.current.on('receive_message', (message) => {
      setMessages((prev) => [...prev, {
        ...message,
        isOwn: message.remetente && user && message.remetente._id === user._id,
      }]);
    });

    socketRef.current.on('user_typing', ({ userId, userName, isTyping }) => {
      setTypingUsers((prev) => {
        if (isTyping) {
          if (userId !== user?._id && !prev.some(u => u.userId === userId)) {
            return [...prev, { userId, userName }];
          }
        } else {
          return prev.filter((u) => u.userId !== userId);
        }
        return prev;
      });
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Erro de conexão do Socket.io:', err.message);
      toast({
        title: 'Erro de conexão.',
        description: `Não foi possível conectar ao servidor de chat: ${err.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    });

    return () => {
      socketRef.current.disconnect()
    }
  }, [roomId, token, user, toast])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    if (!token) {
      toast({
        title: 'Não autorizado.',
        description: 'Você precisa estar logado para ver as mensagens.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    try {
      const response = await fetch(`/api/messages/${roomId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setMessages(data.messages.map(msg => ({
        ...msg,
        isOwn: msg.remetente && user && msg.remetente._id === user._id,
      })));
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast({
        title: 'Erro ao carregar mensagens.',
        description: `Não foi possível carregar as mensagens: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  };

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
  };

  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true)
      socketRef.current.emit('typing', { roomId, isTyping: true })
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current.emit('typing', { roomId, isTyping: false });
    }, 1000);
  }, [isTyping, roomId]);

  const handleNewMessageChange = (e) => {
    setNewMessage(e.target.value);
    handleTyping();
  };

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
            <Message key={msg._id || index} message={msg} user={user} />
          ))}
          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      {typingUsers.length > 0 && (
        <Text fontSize="sm" color="gray.500" mt={2}>
          {typingUsers.map(u => u.userName).join(', ')} está digitando...
        </Text>
      )}

      <Box as="form" onSubmit={handleSendMessage} mt={4}>
        <HStack>
          <Input
            value={newMessage}
            onChange={handleNewMessageChange}
            placeholder="Digite sua mensagem..."
          />
          <Tooltip label="Enviar imagem">
            <IconButton
              icon={<FaImage />}
              aria-label="Enviar imagem"
              variant="ghost"
              onClick={() => toast({
                title: 'Funcionalidade não implementada.',
                description: 'O envio de imagens não está disponível no momento.',
                status: 'info',
                duration: 3000,
                isClosable: true,
              })}
            />
          </Tooltip>
          <Tooltip label="Enviar código">
            <IconButton
              icon={<FaCode />}
              aria-label="Enviar código"
              variant="ghost"
              onClick={() => toast({
                title: 'Funcionalidade não implementada.',
                description: 'O envio de código não está disponível no momento.',
                status: 'info',
                duration: 3000,
                isClosable: true,
              })}
            />
          </Tooltip>
          <Tooltip label="Adicionar emoji">
            <IconButton
              icon={<FaSmile />}
              aria-label="Adicionar emoji"
              variant="ghost"
              onClick={() => toast({
                title: 'Funcionalidade não implementada.',
                description: 'A adição de emojis não está disponível no momento.',
                status: 'info',
                duration: 3000,
                isClosable: true,
              })}
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