import { Box, Flex, Button, Heading, Spacer, useColorModeValue } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { FaHome, FaSignInAlt, FaUserPlus } from 'react-icons/fa'

const Navbar = () => {
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  return (
    <Box bg={bg} px={4} borderBottom="1px" borderColor={borderColor}>
      <Flex h={16} alignItems="center" maxW="1200px" mx="auto">
        <Heading size="md" as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
          Comunidade Chat
        </Heading>
        <Spacer />
        <Flex gap={4}>
          <Button
            as={RouterLink}
            to="/"
            leftIcon={<FaHome />}
            variant="ghost"
          >
            Home
          </Button>
          <Button
            as={RouterLink}
            to="/login"
            leftIcon={<FaSignInAlt />}
            variant="ghost"
          >
            Login
          </Button>
          <Button
            as={RouterLink}
            to="/register"
            leftIcon={<FaUserPlus />}
            colorScheme="blue"
          >
            Registrar
          </Button>
        </Flex>
      </Flex>
    </Box>
  )
}

export default Navbar 