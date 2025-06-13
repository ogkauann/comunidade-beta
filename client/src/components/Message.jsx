import React from 'react';
import { Box, Text, Flex, HStack, Avatar, VStack, useColorModeValue } from '@chakra-ui/react';

const Message = React.memo(({ message, user }) => {
  const isOwn = message.remetente && user && message.remetente._id === user._id;
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const systemBg = useColorModeValue('gray.100', 'gray.700')
  const systemTextColor = useColorModeValue('gray.600', 'gray.300')

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
      return `Hoje às ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Ontem às ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { year: 'numeric', month: 'numeric', day: 'numeric' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  if (message.tipo === 'sistema') {
    return (
      <Flex justify="center" my={2}>
        <Text
          fontSize="sm"
          color={systemTextColor}
          bg={systemBg}
          px={4}
          py={1}
          borderRadius="full"
        >
          {message.mensagem}
        </Text>
      </Flex>
    )
  }

  return (
    <Flex
      justify={isOwn ? 'flex-end' : 'flex-start'}
      align="flex-start"
      mb={4}
      gap={2}
    >
      {!isOwn && (
        <Avatar
          size="sm"
          name={message.remetente?.nome}
          src={message.remetente?.avatar}
        />
      )}
      <Box
        maxW="70%"
        bg={isOwn ? 'blue.500' : bg}
        color={isOwn ? 'white' : 'inherit'}
        p={3}
        borderRadius="lg"
        borderWidth={1}
        borderColor={isOwn ? 'transparent' : borderColor}
      >
        {!isOwn && (
          <Text fontSize="xs" color={isOwn ? 'whiteAlpha.800' : 'gray.500'} mb={1}>
            {message.remetente?.nome}
          </Text>
        )}
        <Text>{message.mensagem}</Text>
        <Text fontSize="xs" color={isOwn ? 'whiteAlpha.800' : 'gray.500'} mt={1}>
          {formatTimestamp(message.createdAt || message.timestamp)}
        </Text>
      </Box>
      {isOwn && (
        <Avatar
          size="sm"
          name={message.remetente?.nome}
          src={message.remetente?.avatar}
        />
      )}
    </Flex>
  );
});

export default Message; 