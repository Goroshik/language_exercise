import React, {useState} from 'react';
import {Container, Fab, ThemeProvider} from '@mui/material';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import {theme} from './theme';

import {ExercisesView, Header, TopicSelection} from './components';
import Chat from './Chat';
import topicsData from './constants/topics_eng';

function App() {
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Container maxWidth="lg" sx={{mt: 4}}>
          <Header/>

          <Routes>
            <Route path="/" element={<TopicSelection topics={topicsData}/>}/>
            <Route path="/topic/:topicName" element={<ExercisesView/>}/>
          </Routes>

          {/* Floating Chat Button */}
          <Fab
            color="primary"
            aria-label="chat"
            className="gradient-fab"
            sx={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              zIndex: 1000
            }}
            onClick={() => setIsChatOpen(true)}
          >
            Chat
          </Fab>

          {/* Chat Dialog */}
          <Chat
            open={isChatOpen}
            onClose={() => setIsChatOpen(false)}
          />
        </Container>
      </Router>
    </ThemeProvider>
  );
}

export default App;
