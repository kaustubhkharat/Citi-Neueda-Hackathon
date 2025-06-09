import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const Shame = ({ username }) => {
  const [shames, setShames] = useState([]);
  const [newShame, setNewShame] = useState('');

  useEffect(() => {
    fetchShames();
  }, []);

  const fetchShames = async () => {
    const response = await axios.get('http://localhost:5000/shame/leaderboard');
    setShames(response.data);
  };

  const postShame = async () => {
    if (!newShame) return;
    await axios.post('http://localhost:5000/shame', { user_id: username, distraction: newShame });
    fetchShames();
    setNewShame('');
  };

  const voteShame = async (shameId) => {
    await axios.post(`http://localhost:5000/shame/vote`, { id: shameId });
    fetchShames();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="shame-container"
    >
      <h2>Shame Leaderboard</h2>
      <div className="shame-list">
        {shames.map((shame) => (
          <motion.div
            key={shame.id} // Use the shame ID as the key
            className="shame-item"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: shame.id * 0.1 }}
          >
            <p>{shame.distraction}</p>
            <small>Votes: {shame.votes}</small>
            <button onClick={() => voteShame(shame.id)}>Vote</button> {/* Pass the ID */}
          </motion.div>
        ))}
      </div>
      <textarea
        placeholder="What distracted you today?"
        value={newShame}
        onChange={(e) => setNewShame(e.target.value)}
      />
      <button onClick={postShame}>Add Distraction</button>
    </motion.div>
  );
};

export default Shame;