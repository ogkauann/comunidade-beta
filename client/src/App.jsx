import { ChakraProvider, Box } from '@chakra-ui/react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import theme from './theme'
import Home from './pages/Home'
import Chat from './pages/Chat'
import Login from './pages/Login'
import Register from './pages/Register'
import NewIdea from './pages/NewIdea'
import Profile from './pages/Profile'
import RoomsPage from './pages/RoomsPage'
import DirectMessagesPage from './pages/DirectMessagesPage'

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Box minH="100vh" bg="gray.50">
          <Navbar />
          <Box maxW="1200px" mx="auto" px={4} py={8}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/chat/:roomId" element={<Chat />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/nova-ideia" element={<NewIdea />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/rooms" element={<RoomsPage />} />
              <Route path="/direct-messages" element={<DirectMessagesPage />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ChakraProvider>
  )
}

export default App 