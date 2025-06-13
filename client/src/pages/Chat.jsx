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
  useToast,
  Spinner,
  Heading,
  Popover,
  PopoverTrigger,
  PopoverContent
} from '@chakra-ui/react'
import { FaPaperPlane, FaImage, FaCode, FaSmile } from 'react-icons/fa'
import io from 'socket.io-client'
import { useAuth } from '../context/AuthContext.jsx'
import Message from '../components/Message.jsx'
import axios from 'axios'
import EmojiPicker from 'emoji-picker-react'

const Chat = () => {
  const { roomId } = useParams()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const [currentRoomId, setCurrentRoomId] = useState(null)
  const [currentRoomName, setCurrentRoomName] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const socketRef = useRef()
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const topOfMessagesRef = useRef(null)
  const loadingMessagesRef = useRef(loadingMessages)

  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const { user, token } = useAuth()
  const toast = useToast()

  useEffect(() => {
    loadingMessagesRef.current = loadingMessages;
  }, [loadingMessages]);

  const fetchRoomDetails = useCallback(async (idOrName) => {
    if (!token) {
      toast({
        title: 'Não autorizado.',
        description: 'Você precisa estar logado para acessar as salas.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return null;
    }

    try {
      let room = null;
      if (idOrName && idOrName.length === 24 && /^[0-9a-fA-F]+$/.test(idOrName)) {
        const response = await axios.get(`/api/rooms/${idOrName}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        room = response.data;
      } else {
        const response = await axios.get('/api/rooms', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        room = response.data.find(r => r.name === idOrName);
      }
      
      if (room) {
        setCurrentRoomName(room.name)
        return room._id;
      } else {
        toast({
          title: 'Sala não encontrada.',
          description: `A sala ${idOrName} não foi encontrada.`, 
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes da sala:', error);
      toast({
        title: 'Erro ao buscar sala.',
        description: `Não foi possível carregar a sala: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return null;
    }
  }, [token, toast]);

  useEffect(() => {
    if (roomId && !currentRoomId) {
      fetchRoomDetails(roomId).then(id => {
        if (id) {
          setCurrentRoomId(id);
        }
      });
    }
  }, [roomId, currentRoomId, fetchRoomDetails]);

  const fetchMessages = useCallback(async (pageToLoad) => {
    if (!currentRoomId || !token) {
      setLoadingMessages(false);
      setInitialLoad(false);
      return;
    }
    if (loadingMessagesRef.current) return;

    setLoadingMessages(true);
    try {
      const limit = 20;
      const response = await axios.get(`/api/messages/${currentRoomId}?page=${pageToLoad}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const newMessages = response.data.messages.map(msg => ({
        ...msg,
        timestamp: msg.createdAt || msg.timestamp,
        isOwn: msg.remetente && user && msg.remetente._id === user._id,
      }));

      const previousScrollHeight = messagesContainerRef.current ? messagesContainerRef.current.scrollHeight : 0;

      setMessages((prevMessages) => {
        const uniqueNewMessages = newMessages.filter(
          (nm) => !prevMessages.some((pm) => pm._id === nm._id)
        );
        return [...uniqueNewMessages, ...prevMessages];
      });
      setCurrentPage(pageToLoad);
      setHasMoreMessages(newMessages.length === limit);

      if (pageToLoad === 1 && messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      } else if (messagesContainerRef.current) {
        const currentScrollHeight = messagesContainerRef.current.scrollHeight;
        messagesContainerRef.current.scrollTop += (currentScrollHeight - previousScrollHeight);
      }

    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast({
        title: 'Erro ao carregar mensagens.',
        description: `Não foi possível carregar as mensagens: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setHasMoreMessages(false);
    } finally {
      setLoadingMessages(false);
      setInitialLoad(false);
    }
  }, [token, currentRoomId, user, toast]);

  useEffect(() => {
    if (!currentRoomId || !token) return;

    if (socketRef.current) {
        socketRef.current.disconnect();
    }

    socketRef.current = io({
      auth: {
        token: token,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      toast({
        title: 'Conectado',
        description: 'Conexão com o servidor estabelecida',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      if (currentRoomId) {
        socketRef.current.emit('join_room', currentRoomId);
      }
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      toast({
        title: 'Desconectado',
        description: 'Conexão com o servidor perdida',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    });

    socketRef.current.on('reconnect_attempt', (attemptNumber) => {
      toast({
        title: 'Tentando reconectar',
        description: `Tentativa ${attemptNumber} de reconexão...`,
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    });

    socketRef.current.on('reconnect_failed', () => {
      toast({
        title: 'Falha na reconexão',
        description: 'Não foi possível reconectar ao servidor. Por favor, recarregue a página.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    });

    socketRef.current.emit('join_room', currentRoomId);

    if (!loadingMessagesRef.current) {
      fetchMessages(1);
    }

    socketRef.current.on('receive_message', (message) => {
      setMessages((prev) => [...prev, {
        ...message,
        timestamp: message.createdAt || message.timestamp,
        isOwn: message.remetente && user && message.remetente._id === user._id,
      }]);
      if (messagesContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        if (scrollHeight - scrollTop - clientHeight < 200) {
          scrollToBottom();
        }
      }
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
      socketRef.current.disconnect();
    };
  }, [currentRoomId, token, user, toast, fetchMessages, loadingMessagesRef]);

  useEffect(() => {
    if (messagesContainerRef.current && !initialLoad) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      if (scrollHeight - scrollTop - clientHeight < 200) {
        scrollToBottom();
      }
    }
  }, [messages, initialLoad]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMoreMessages && !loadingMessages && !initialLoad) {
        fetchMessages(currentPage + 1);
      }
    }, { threshold: 0.1 });

    const currentTopOfMessages = topOfMessagesRef.current;
    if (currentTopOfMessages) {
      observer.observe(currentTopOfMessages);
    }

    return () => {
      if (currentTopOfMessages) {
        observer.unobserve(currentTopOfMessages);
      }
    };
  }, [hasMoreMessages, loadingMessages, fetchMessages, currentPage, initialLoad]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !currentRoomId) return

    const messageData = {
      roomId: currentRoomId,
      message: newMessage,
    }

    socketRef.current.emit('send_message', messageData)
    setNewMessage('')
  }

  const handleNewMessageChange = (e) => {
    setNewMessage(e.target.value)
    if (socketRef.current && currentRoomId && user) {
      if (e.target.value.length > 0) {
        if (!isTyping) {
          setIsTyping(true)
          socketRef.current.emit('typing', { roomId: currentRoomId, isTyping: true });
        }
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          socketRef.current.emit('typing', { roomId: currentRoomId, isTyping: false });
        }, 3000);
      } else {
        clearTimeout(typingTimeoutRef.current);
        setIsTyping(false);
        socketRef.current.emit('typing', { roomId: currentRoomId, isTyping: false });
      }
    }
  }

  const onEmojiClick = (emojiData, event) => {
    setNewMessage(prevMsg => prevMsg + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <Box h="calc(100vh - 200px)" display="flex" flexDirection="column">
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">{currentRoomName || 'Carregando Sala...'}</Heading>
        <HStack spacing={2}>
          <Box
            w={2}
            h={2}
            borderRadius="full"
            bg={isConnected ? 'green.500' : 'red.500'}
          />
          <Text fontSize="sm" color={isConnected ? 'green.500' : 'red.500'}>
            {isConnected ? 'Conectado' : 'Desconectado'}
          </Text>
        </HStack>
      </Flex>

      <Box
        flex="1"
        overflowY="auto"
        p={4}
        bg={bg}
        borderRadius="lg"
        borderWidth="1px"
        borderColor={borderColor}
        ref={messagesContainerRef}
        onScroll={(e) => {
          if (e.target.scrollTop === 0 && hasMoreMessages && !loadingMessagesRef.current && !initialLoad) {
            fetchMessages(currentPage + 1);
          }
        }}
      >
        <div ref={topOfMessagesRef}></div>
        <VStack spacing={4} align="stretch">
          {messages.map((message) => (
            <Message key={message._id} message={message} user={user} />
          ))}
          {loadingMessages && !initialLoad && (
            <Flex justify="center" mt={4}>
              <Spinner size="md" color="teal.500" />
            </Flex>
          )}
        </VStack>
        <div ref={messagesEndRef} />
      </Box>

      {typingUsers.length > 0 && (
        <Text fontSize="sm" color="gray.500" mb={2}>
          {typingUsers.map(u => u.userName).join(', ')} está digitando...
        </Text>
      )}

      <Box as="form" onSubmit={handleSendMessage} mt={4}>
        <HStack>
          <Input
            value={newMessage}
            onChange={handleNewMessageChange}
            placeholder="Digite sua mensagem..."
            flex="1"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage(e);
              }
            }}
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
          <Popover
            isOpen={showEmojiPicker}
            onClose={() => setShowEmojiPicker(false)}
            placement="top-start"
            closeOnBlur={true}
          >
            <PopoverTrigger>
              <IconButton
                aria-label="Emoji"
                icon={<FaSmile />}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              />
            </PopoverTrigger>
            <PopoverContent width="350px">
              <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
            </PopoverContent>
          </Popover>
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