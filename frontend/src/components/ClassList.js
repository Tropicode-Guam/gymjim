import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Button, Modal, Typography, Box, List, ListItem, ListItemText,
    ListItemSecondaryAction, IconButton, Paper, CircularProgress, Checkbox
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';

const API_BASE = process.env.REACT_APP_API;

function ClassList() {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);  // Initialize loading to true
    const [showModal, setShowModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [checkedUsers, setCheckedUsers] = useState({});

    const getClasses = async () => {
        try {
            const response = await axios.get(`${API_BASE}/classes`);
            if (response.status === 200) {
                const classData = response.data;

                // Fetch user count for each class
                const classesWithUserCount = await Promise.all(classData.map(async (classItem) => {
                    const userResponse = await axios.get(`${API_BASE}/classes/${classItem._id}/users`);
                    const userCount = userResponse.data.length;
                    return { ...classItem, currentUsers: userCount };
                }));

                return classesWithUserCount;
            } else {
                console.error('Error fetching classes:', response.status);
                return [];
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
            return [];
        }
    };

    const handleViewUsers = async (classId) => {
        setSelectedClass(classes.find((classItem) => classItem._id === classId));
        setShowModal(true);
        try {
            const response = await axios.get(`${API_BASE}/classes/${classId}/users`);
            if (response.status === 200) {
                const sortedUsers = response.data.sort((a, b) => new Date(a.selectedDate) - new Date(b.selectedDate));
                setUsers(sortedUsers);
                const initialCheckedUsers = sortedUsers.reduce((acc, user) => {
                    acc[user._id] = false;
                    return acc;
                }, {});
                setCheckedUsers(initialCheckedUsers);
            } else {
                console.error('Failed to fetch users for class:', response.status);
            }
        } catch (error) {
            console.error('Error fetching users for class:', error);
        }
    };

    const handleCheckboxChange = (userId) => {
        setCheckedUsers((prev) => ({
            ...prev,
            [userId]: !prev[userId],
        }));
    };

    const handlePrintAttendance = () => {
        window.print();
    };

    const handleClickDeleteClass = (classId) => {
        setSelectedClass(classes.find((classItem) => classItem._id === classId))
        setShowDeleteModal(true);
    }

    const handleDeleteClass = async (classId) => {
        try {
            const response = await axios.delete(`${API_BASE}/classes/${classId}`);
            if (response.status === 200) {
                const updatedClasses = await getClasses();
                setClasses(updatedClasses);
            } else {
                console.error('Error deleting class:', response.status);
            }
        } catch (error) {
            console.error('Error deleting class:', error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const classesData = await getClasses();
                setClasses(classesData);
            } catch (error) {
                console.error('Error fetching classes:', error);
            }
            setLoading(false)
        };
        fetchData();
    }, []);

    return (
        <div>
            <Typography variant="h4" gutterBottom>Class List</Typography>
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {classes.length > 0 ? (
                        <List>
                            {classes.map((classItem) => (
                                <ListItem key={classItem._id}>
                                    <ListItemText
                                        primary={classItem.title}
                                        secondary={`Description: ${classItem.description} | Date: ${format(new Date(classItem.date), "MMMM do, yyyy")} | Users: ${classItem.currentUsers}/${classItem.size}`}
                                    />
                                    <ListItemSecondaryAction>
                                        <Button variant="contained" onClick={() => handleViewUsers(classItem._id)}>View Users</Button>
                                        <IconButton onClick={() => handleClickDeleteClass(classItem._id)} aria-label="delete">
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Typography variant="h6" gutterBottom>No classes available</Typography>
                    )}
                </>
            )}
            <Modal
                open={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}

            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100vh',
                        outline: 0,
                    }}
                >



                    {/* gpt */}
                    <Paper
                        sx={{
                            padding: 4,
                            width: '80%',
                            maxWidth: '600px',
                            bgcolor: 'background.paper',
                            boxShadow: 24,
                            opacity: 1,
                        }}
                    >
                        <Typography id="modal-title" variant="h6" gutterBottom>Are you sure you want to delete this class?</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    handleDeleteClass(selectedClass._id);
                                    setShowDeleteModal(false);
                                }}
                                color="error"
                            >
                                Delete
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            </Modal>
            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                aria-labelledby="modal-title"
                aria-describedby="modal-description"
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100vh',
                        outline: 0,
                    }}
                >
                    <Paper
                        sx={{
                            padding: 4,
                            width: '80%',
                            maxWidth: '600px',
                            bgcolor: 'background.paper',
                            boxShadow: 24,
                            opacity: 1,
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography id="modal-title" variant="h5" gutterBottom>Users for {selectedClass && selectedClass.title}</Typography>
                            <Button onClick={() => setShowModal(false)} variant="outlined">Close</Button>
                        </Box>
                        <List id="modal-description">
                            {users.map((user) => (
                                <ListItem key={user._id} divider>
                                    <ListItemText primary={`Name: ${user.name}`} secondary={`Phone: ${user.phone}`} />
                                    <ListItemText primary={`Insurance: ${user.insurance}`} secondary={`Selected Date: ${format(new Date(user.selectedDate), "MMMM do, yyyy")}`} />
                                    <ListItemSecondaryAction>
                                        <Checkbox
                                            edge="end"
                                            checked={checkedUsers[user._id] || false}
                                            onChange={() => handleCheckboxChange(user._id)}
                                        />
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                        <Box sx={{ marginTop: 2 }}>
                            <Button variant="contained" color="primary" onClick={handlePrintAttendance}>
                                Print Attendance
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            </Modal>
        </div>
    );
}

export default ClassList;
