import './App.css';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import React from 'react';
import { useState, useRef } from 'react';

initializeApp({
	apiKey: process.env.REACT_APP_API_KEY,
	authDomain: process.env.REACT_APP_AUTH_DOMAIN,
	projectId: process.env.REACT_APP_PROJECT_ID,
	storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
	messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
	appId: process.env.REACT_APP_APP_ID,
	measurementId: process.env.REACT_APP_MEASUREMENT_ID,
});

const auth = getAuth();
const firestore = getFirestore();

function App() {
	const [user] = useAuthState(auth);
	console.log(process.env.API_KEY);
	return (
		<div className='App'>
			<header className='App-header'>
				<SignOut />
			</header>
			<section>{user ? <ChatRoom /> : <SignIn />}</section>
		</div>
	);
}

function SignIn() {
	const signInWithGoogle = () => {
		const provider = new GoogleAuthProvider();
		signInWithPopup(auth, provider);
	};
	return <button onClick={signInWithGoogle}>sign in with Google</button>;
}

function SignOut() {
	return auth.currentUser && <button onClick={() => signOut(auth)}>Sign Out</button>;
}

function ChatRoom() {
	const dummy = useRef();

	const messagesRef = collection(firestore, 'messages');
	const q = query(messagesRef, orderBy('createdAt'));

	const [messages] = useCollectionData(q, { idField: 'id' });

	const [formValue, setFormValue] = useState('');

	const sendMessage = async e => {
		e.preventDefault();
		const sentText = formValue;
		setFormValue('');
		// dummy.current.scrollIntoView({ behavior: 'smooth' });
		const { uid, photoURL, displayName } = auth.currentUser;

		if (sentText.trim() !== '') {
			await addDoc(messagesRef, {
				text: sentText,
				createdAt: serverTimestamp(),
				uid,
				photoURL,
				displayName,
			});
		}
		dummy.current.scrollIntoView({ behavior: 'smooth' });
	};

	return (
		<div className='chat-container'>
			<main>
				{messages?.map((message, index) => (
					<ChatMessage message={message} key={index} />
				))}
				<div ref={dummy}></div>
			</main>
			<form onSubmit={sendMessage}>
				<input value={formValue} onChange={e => setFormValue(e.target.value)} placeholder='type a message...' />
				<button type='submit'>submit</button>
			</form>
		</div>
	);
}

function ChatMessage(props) {
	const { text, uid, photoURL, displayName } = props.message;

	const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';

	return (
		<div className={`message ${messageClass}`}>
			<img src={photoURL} />
			<div>
				<span className='display-name'>{displayName}</span>
				<p>{text}</p>
			</div>
		</div>
	);
}

export default App;
