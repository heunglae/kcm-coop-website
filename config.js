// Firebase Configuration Example
// Add to js/config.js

// Import Firebase SDK via CDN in HTML:
// <script src="https://www.gstatic.com/firebasejs/9.x/firebase-app.js"></script>
// <script src="https://www.gstatic.com/firebasejs/9.x/firebase-firestore.js"></script>

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
// firebase.initializeApp(firebaseConfig);
// const db = firebase.firestore();

// Example: Get posts
/*
async function getPosts() {
  const snapshot = await db.collection('posts')
    .where('status', '==', 'approved')
    .orderBy('created_at', 'desc')
    .limit(10)
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}
*/

// Example: Create post
/*
async function createPost(data) {
  const docRef = await db.collection('posts').add({
    ...data,
    created_at: firebase.firestore.FieldValue.serverTimestamp()
  });
  
  return docRef.id;
}
*/
