import React from 'react';
import { Box, Text, Flex, HStack, Avatar, VStack, useColorModeValue } from '@chakra-ui/react';

const Message = React.memo(({ message, user }) => {
  const isOwn = message.remetente && user && message.remetente._id === user._id;
  const messageBg = useColorModeValue(isOwn ? 'blue.500' : 'gray.100', isOwn ? 'blue.500' : 'gray.700');
  const messageColor = useColorModeValue(isOwn ? 'white' : 'black', 'white');

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

  return (
    <Flex justify={isOwn ? 'flex-end' : 'flex-start'}>
      <HStack
        spacing={3}
        bg={messageBg}
        color={messageColor}
        p={3}
        borderRadius="lg"
        maxW="70%"
      >
        {!isOwn && (
          <Avatar size="sm" name={message.remetente?.nome} />
        )}
        <VStack align="stretch" spacing={1}>
          {!isOwn && (
            <Text fontSize="sm" fontWeight="bold">
              {message.remetente?.nome}
            </Text>
          )}
          <Text>{message.mensagem}</Text>
          <Text fontSize="xs" opacity={0.7}>
            {formatTimestamp(message.timestamp)}
          </Text>
        </VStack>
      </HStack>
    </Flex>
  );
});

export default Message; 