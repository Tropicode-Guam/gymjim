import React, { useState } from 'react';

function Admin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loggedIn, setLoggedIn] = useState('');

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [size, setSize] = useState('');

    const handleSubmit = async (event) => {
        console.log("trying to sign in");
        event.preventDefault();

        const credentials = { username, password };

        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Login response:", data);

            if (data.connectionHash) {
                // Store the connectionHash for future requests
                localStorage.setItem('connectionHash', data.connectionHash);  // or store it in memory
                // Set loggedIn to true upon successful login
                setLoggedIn(true);
            } else {
                // Handle cases where login is successful but no connectionHash is received
                console.error('Login successful but no connectionHash received');
                // setLoggedIn(false); // Or handle as appropriate
            }

        } catch (error) {
            console.error('Error during login:', error.message);
            // Optionally, handle the error, e.g., by showing an error message
            // setLoggedIn(false);
        }
    };


    const handleNewClass = async (event) => {
        event.preventDefault();

        // Retrieve the stored connection hash
        const connectionHash = localStorage.getItem('connectionHash');

        const payload = {
            title,
            description,
            date,
            size,
            key: connectionHash  // Use the retrieved connection hash here
        };

        try {
            const response = await fetch('http://localhost:5000/api/classes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const data = await response.json();
                console.log(data);

                // Reset form fields after successful submission
                setTitle('');
                setDescription('');
                // Additional logic for success
            } else {
                console.error('Error:', response.status, response.statusText);
                // Handle different response statuses appropriately
                if (response.status === 401) {
                    console.log('Login key not authorized', response.status);
                    setLoggedIn(false);  // Consider logging out or prompting for re-login
                }
            }
        } catch (error) {
            console.error('Request failed:', error);
            // Handle network or other errors
        }
    };


    // TODO put these in their own components
    if (loggedIn) {
        return (
            <div className="admin-page">
                <h1>Create a new class</h1>
                <form onSubmit={handleNewClass}>
                    <div>
                        <label htmlFor="title">Title</label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="description">Description</label>
                        <input
                            type="text"
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="date">Date</label>
                        <input
                            type="datetime-local"
                            id="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="size">Size</label>
                        <input
                            type="text"
                            id="size"
                            value={size}
                            onChange={(e) => setSize(e.target.value)}
                        />
                    </div>
                    <button type="submit">Add Class</button>
                </form>
            </div>
        )
    } else {
        return (
            <div className="lock-screen">
                <h1>Hilton Gym Panel</h1>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="username">Username:</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="password">Password:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit">Login</button>
                </form>
            </div>
        );
    }
}

export default Admin;
