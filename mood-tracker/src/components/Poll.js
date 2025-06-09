import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const Poll = () => {
  const [polls, setPolls] = useState([]);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    const response = await axios.get('http://localhost:5000/polls');
    // If response.data is an array and empty, setPolls to []
    if (Array.isArray(response.data) && response.data.length === 0) {
      setPolls([]);
    } else if (Array.isArray(response.data)) {
      setPolls(response.data);
    } else {
      setPolls([]);
    }
  };

  const vote = async (pollId, optionId) => {
    await axios.post(`http://localhost:5000/poll/vote`, { option_id: optionId });
    fetchPolls();
  };

  const handleOptionChange = (idx, value) => {
    const newOptions = [...options];
    newOptions[idx] = value;
    setOptions(newOptions);
  };

  const addOption = () => setOptions([...options, '']);

  const createPoll = async () => {
    if (!question.trim() || options.some(opt => !opt.trim())) {
      alert('Please enter a question and all options.');
      return;
    }
    await axios.post('http://localhost:5000/poll', {
      question,
      options
    });
    setQuestion('');
    setOptions(['', '']);
    setCreating(false);
    fetchPolls();
  };

  return (
    <motion.div className="poll-container">
      <h2>Polls</h2>
      <button onClick={() => setCreating(!creating)}>
        {creating ? 'Cancel' : 'Create New Poll'}
      </button>
      {creating && (
        <div className="create-poll">
          <input
            type="text"
            placeholder="Poll question"
            value={question}
            onChange={e => setQuestion(e.target.value)}
          />
          {options.map((opt, idx) => (
            <input
              key={idx}
              type="text"
              placeholder={`Option ${idx + 1}`}
              value={opt}
              onChange={e => handleOptionChange(idx, e.target.value)}
              style={{ marginTop: '0.5rem' }}
            />
          ))}
          <button onClick={addOption} style={{ marginTop: '0.5rem' }}>Add Option</button>
          <button onClick={createPoll} style={{ marginTop: '0.5rem' }}>Submit Poll</button>
        </div>
      )}
      {polls.length === 0 ? (
        <p style={{ marginTop: '2rem', fontSize: '1.2rem', color: '#888' }}>
          No polls available. Create one!
        </p>
      ) : (
        polls.map((poll) => (
          <motion.div key={poll.id} className="poll-item">
            <h3>{poll.question}</h3>
            {poll.options.map(option => (
              <button key={option.id} onClick={() => vote(poll.id, option.id)}>
                {option.option} ({option.votes})
              </button>
            ))}
          </motion.div>
        ))
      )}
    </motion.div>
  );
};

export default Poll;