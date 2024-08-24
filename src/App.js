import './App.css';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, query, orderBy, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import React, { useState, useRef, useEffect } from 'react';
import Popup from 'reactjs-popup';

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
// const [isOpen, setOpen] = useState(false);

function App() {
	const [user] = useAuthState(auth);
	const [isOpen, setIsOpen] = useState(false);
	const [selectedDisplayName, setSelectedDisplayName] = useState('');
	const [selectedPhotoURL, setSelectedPhotoURL] = useState('');

	const openProfilePopup = (displayName, photoURL) => {
		setSelectedDisplayName(displayName);
		setSelectedPhotoURL(photoURL);
		setIsOpen(true);
	};

	return (
		<div className='App'>
			<header className='App-header'>
				<SignOut />
			</header>
			<section>
				{user ? <ChatRoom openProfilePopup={openProfilePopup} /> : <SignIn />}
				<Popup open={isOpen} onClose={() => setIsOpen(false)} modal>
					<div className='profileBackground'>
						<h2>{selectedDisplayName}</h2>
						<img
							src={selectedPhotoURL}
							alt={`${selectedDisplayName}'s profile`}
							style={{ width: '100px', height: '100px', borderRadius: '50%' }}
						/>
						{/* <button onClick={() => setIsOpen(false)}>Close</button> // cl */}
					</div>
				</Popup>
			</section>
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

function ChatRoom({ openProfilePopup }) {
	const dummy = useRef();

	const messagesRef = collection(firestore, 'messages');
	const q = query(messagesRef, orderBy('createdAt'));

	const [messages] = useCollectionData(q, { idField: 'id' });

	const [formValue, setFormValue] = useState('');

	// useEffect(() => {
	// 	dummy.current?.scrollIntoView({ behavior: 'smooth' }, [messages]);
	// });
	useEffect(() => {
		if (dummy.current) {
			// Ensure the scroll is set to the bottom after the container is rendered
			dummy.current.scrollIntoView({
				bottom: dummy.current.scrollHeight,
				behavior: 'smooth',
			});
		}
	}, [messages]);

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
		// dummy.current.scrollIntoView({ behavior: 'smooth' });
	};

	return (
		<div className='chat-container'>
			<main>
				{messages?.map((message, index) => (
					<ChatMessage message={message} key={index} openProfilePopup={openProfilePopup} />
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

function getTimeStamp(createdAt) {
	if (!createdAt) return '';

	const date = createdAt.toDate();
	const now = new Date();

	// Check if the message was created today
	const isToday = date.toDateString() === now.toDateString();

	// Check if the message was created this year
	const isThisYear = date.getFullYear() === now.getFullYear();

	// Get time, date, and year components
	const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	const dayMonth = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
	const year = date.getFullYear();

	// Determine what to display
	if (isToday) {
		return time;
	} else if (isThisYear) {
		return `${dayMonth}, ${time}`;
	} else {
		return `${dayMonth} ${year}, ${time}`;
	}
}

function ChatMessage({ message, openProfilePopup }) {
	const { text, uid, photoURL, displayName, createdAt } = message;

	// setSelectedDisplayName(displayName);
	// setSelectedPhotoURL(photoURL);

	// if (!message || !handleProfileClick) {
	// 	console.error('Required props are missing in ChatMessage component');
	// 	return null;
	// }

	const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';

	const timestamp = getTimeStamp(createdAt);

	return (
		<div className='chat-message'>
			<button className='photo-btn' onClick={() => openProfilePopup(displayName, photoURL)}>
				<img src={photoURL} />
			</button>
			<div>
				<div className='message-header'>
					<button className='name-btn' onClick={() => openProfilePopup(displayName, photoURL)}>
						<span className='display-name'>{displayName}</span>
					</button>
					<small className='timestamp'>{timestamp}</small>
				</div>
				<p>{text}</p>
			</div>
		</div>
	);
}

export default App;
