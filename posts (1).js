// Netlify Function example for posts
// Save as: netlify/functions/posts.js

const faunadb = require('faunadb');
const q = faunadb.query;

exports.handler = async (event, context) => {
  // GET /api/posts
  if (event.httpMethod === 'GET') {
    // Return posts list
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: [],
        total: 0
      })
    };
  }
  
  // POST /api/posts
  if (event.httpMethod === 'POST') {
    const data = JSON.parse(event.body);
    
    // Save to database
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };
  }
  
  return {
    statusCode: 405,
    body: 'Method Not Allowed'
  };
};
