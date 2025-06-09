import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const Mood = ({ username }) => {
  const [moods, setMoods] = useState([]);
  const [newMood, setNewMood] = useState('');
  const [recommendation, setRecommendation] = useState('');

  useEffect(() => {
    fetchMoods();
  }, []);

  const fetchMoods = async () => {
    const response = await axios.get('http://localhost:5000/moods');
    setMoods(response.data);
  };

  const postMood = async () => {
    if (!newMood) return;
    const response = await axios.post('http://localhost:5000/mood', { user: username, mood: newMood });
    if (response.data.status === 'success') {
      /*
      const chatResponse = await axios.get('http://localhost:5000/moodbot', { params: { text: newMood } });
      setRecommendation(chatResponse.data.reply);
      */
      fetchMoods();
      setNewMood('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="mood-container"
    >
      <h2>Mood Tracker</h2>
      <div className="mood-list">
        {moods.map((mood, index) => (
          <motion.div
            key={index}
            className="mood-item"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <p><strong>{mood.user}:</strong> {mood.mood}</p>
            <small>{new Date(mood.timestamp).toLocaleString()}</small>
          </motion.div>
        ))}
      </div>
      <textarea
        placeholder="How are you feeling?"
        value={newMood}
        onChange={(e) => setNewMood(e.target.value)}
      />
      <button onClick={postMood}>Post Mood</button>
      {recommendation && <p className="recommendation">{recommendation}</p>}
    </motion.div>
  );
};

export default Mood;