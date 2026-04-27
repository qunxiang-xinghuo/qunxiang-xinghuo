import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import HomePage from './pages/HomePage'
import IdentitySelect from './pages/solo/IdentitySelect'
import BrainMatch from './pages/solo/BrainMatch'
import ReactionRecord from './pages/solo/ReactionRecord'
import RecordFeedback from './pages/solo/RecordFeedback'
import DuoBrainMatch from './pages/duo/DuoBrainMatch'
import MatchWaiting from './pages/duo/MatchWaiting'
import DuoLobby from './pages/duo/DuoLobby'
import ChatRoom from './pages/duo/ChatRoom'
import StoryResult from './pages/duo/StoryResult'
import LiveRoom from './pages/LiveRoom'

function App() {
  const location = useLocation()
  
  return (
    <div className="h-full w-full max-w-md mx-auto bg-xh-primary relative overflow-hidden">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/solo/identity" element={<IdentitySelect />} />
          <Route path="/solo/match" element={<BrainMatch />} />
          <Route path="/solo/record" element={<ReactionRecord />} />
          <Route path="/solo/feedback" element={<RecordFeedback />} />
          <Route path="/duo/identity" element={<IdentitySelect />} />
          <Route path="/duo/lobby" element={<DuoLobby />} />
          <Route path="/duo/match" element={<DuoBrainMatch />} />
          <Route path="/duo/waiting" element={<MatchWaiting />} />
          <Route path="/duo/chat" element={<ChatRoom />} />
          <Route path="/duo/result" element={<StoryResult />} />
          <Route path="/live" element={<LiveRoom />} />
        </Routes>
      </AnimatePresence>
    </div>
  )
}

export default App
