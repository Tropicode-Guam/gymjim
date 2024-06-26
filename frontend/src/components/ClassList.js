import React, { useState, useContext } from 'react';
import axios from 'axios';
import {
    Button, Modal, Typography, Box, List, ListItem, ListItemText,
    IconButton, Paper, CircularProgress, MenuItem, Select, Grid
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import EditIcon from '@mui/icons-material/Edit';
import { format, parseISO } from 'date-fns';
import { ClassCard } from './ClassCard';
import { OnlyOngoingContext } from '../Contexts';
import { useGetClassesQuery } from '../slices/classesSlice';
import { useUpdateClassOrderMutation } from '../slices/classesSlice';


const API_BASE = process.env.REACT_APP_API;

function ClassList(props) {
    const { onClassSelect, closeOnSelect, authKey } = props;
    const onlyOngoing = useContext(OnlyOngoingContext);
    const { data: classes, isLoading: loading, error, refetch: refetchClasses } = useGetClassesQuery(onlyOngoing);
    const {refetch: otherRefetch} = useGetClassesQuery(!onlyOngoing);
    const [updateClassOrder] = useUpdateClassOrderMutation();

    const [showModal, setShowModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [classDates, setClassDates] = useState([]);
    const [selectedClassDate, setSelectedClassDate] = useState('');
    const [cardOpen, setCardOpen] = useState(false);

    const handleViewUsers = async (classId) => {
        const selectedClassItem = classes.find((classItem) => classItem._id === classId);
        setSelectedClass(selectedClassItem);
        setShowModal(true);
        const response = await axios.get(`${API_BASE}/classes/${classId}/users`);
        if (response.status === 200) {
            const sortedUsers = response.data.sort((a, b) => new Date(a.selectedDate) - new Date(b.selectedDate));
            setUsers(sortedUsers);

            const uniqueDates = [...new Set(sortedUsers.map(user => user.selectedDate))];
            setClassDates(uniqueDates);
            setSelectedClassDate(uniqueDates[0] || '');
        } else {
            console.error('Failed to fetch users for class:', response.status);
        }
    };

    const handlePrintAttendance = () => {
        const printContent = document.getElementById('printable-attendance').innerHTML;
        const printWindow = window.open('', '', 'width=900,height=650');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Attendance</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 20px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                        }
                        th, td {
                            border: 1px solid black;
                            padding: 8px;
                            text-align: left;
                        }
                        th {
                            background-color: #f2f2f2;
                        }
                    </style>
                </head>
                <body>
                    ${printContent}
                </body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    const handleDeleteClass = async (classId) => {
        try {
            const response = await axios.delete(`${API_BASE}/classes/${classId}`);
            if (response.status === 200) {
                await refetchClasses();
            } else {
                console.error('Error deleting class:', response.status);
            }
        } catch (error) {
            console.error('Error deleting class:', error);
        }
    };

    const handleClickDeleteClass = (classId) => {
        setSelectedClass(classes.find((classItem) => classItem._id === classId));
        setShowDeleteModal(true);
    };

    const moveCard = async (index, direction) => {
        const newIndex = index + direction;
        if (newIndex >= 0 && newIndex < classes.length) {
            const newClasses = [...classes];
            const temp = newClasses[index];
            newClasses[index] = newClasses[newIndex];
            newClasses[newIndex] = temp;
            const payload = {
                ids: newClasses.map((classItem) => classItem._id),
                key: authKey
            }
            await updateClassOrder(payload);
            await refetchClasses();
            await otherRefetch();
        }
    };

    return (
        <div>
            <Typography variant="h4" gutterBottom sx={{ marginTop: 4 }}>Class List</Typography>
            {error && <Typography color="error">Error fetching classes: {error.error}</Typography>}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {classes && classes.length > 0 ? (
                        <Grid container spacing={4}>
                            {classes.map((classItem, i) => (
                                <Grid item xs={12} sm={6} md={4} key={classItem._id}>
                                    <ClassCard 
                                        classItem={classItem}
                                        open={cardOpen && selectedClass === classItem}
                                        onOpen={() => {setCardOpen(true); setSelectedClass(classItem)}}
                                        onClose={() => {setCardOpen(false); setSelectedClass(null)}}
                                        maxModalWidth='1000px'
                                    >
                                        <Button variant="contained" onClick={() => handleViewUsers(classItem._id)}>View Users</Button>
                                        <IconButton disabled={i==0} color="primary" onClick={() => moveCard(i, -1)}>
                                            <ArrowBackIosNewIcon />
                                        </IconButton>
                                        <IconButton disabled={i==classes.length-1} color="primary" onClick={() => moveCard(i, 1)}>
                                            <ArrowForwardIosIcon />
                                        </IconButton>
                                        <IconButton color="primary" onClick={() => {
                                            onClassSelect(classItem)
                                            if (closeOnSelect) {
                                                setCardOpen(false);
                                            }
                                        }}>
                                            <EditIcon/>
                                        </IconButton>
                                        <IconButton color="primary" onClick={() => handleClickDeleteClass(classItem._id)} aria-label="delete">
                                            <DeleteIcon />
                                        </IconButton>
                                    </ClassCard>
                                </Grid>
                            ))}
                        </Grid>
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
                        display: 'flex', alignItems: 'center',
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
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100vh',
                        outline: 0,
                    }}
                >
                    <Paper
                        className="no-print"
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
                            <Button onClick={() => setShowModal(false)} variant="outlined" className="no-print">Close</Button>
                        </Box>
                        <Box sx={{ marginBottom: 2 }}>
                            <Typography variant="h6">Select Date</Typography>
                            <Select
                                value={selectedClassDate}
                                onChange={(e) => setSelectedClassDate(e.target.value)}
                                fullWidth
                            >
                                {classDates.map(date => (
                                    <MenuItem key={date} value={date}>
                                        {format(parseISO(date), "MMMM do, yyyy")}
                                    </MenuItem>
                                ))}
                            </Select>
                        </Box>
                        <List id="modal-description">
                            {users.filter(user => user.selectedDate === selectedClassDate).map((user) => (
                                <ListItem key={user._id} divider>
                                    <ListItemText primary={`Name: ${user.name}`} secondary={`Phone: ${user.phone}`} />
                                    <ListItemText primary={`Insurance: ${user.insurance}`} secondary={`Selected Date: ${format(parseISO(user.selectedDate), "MMMM do, yyyy")}`} />
                                </ListItem>
                            ))}
                        </List>
                        <Box sx={{ marginTop: 2 }}>
                            <Button variant="contained" color="primary" onClick={handlePrintAttendance} className="no-print">
                                Print Attendance
                            </Button>
                        </Box>
                    </Paper>
                    <div id="printable-attendance" style={{ display: 'none' }}>
                        <h2>Attendance for {selectedClass?.title} on {selectedClassDate && format(parseISO(selectedClassDate), "MMMM do, yyyy")}</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: '11%' }}>Here ✔️</th>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th style={{ width: '11%' }}>Gym Member</th>
                                    <th>Insurance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.filter(user => user.selectedDate === selectedClassDate).map((user) => (
                                    <tr key={user._id}>
                                        <td></td>
                                        <td>{user.name}</td>
                                        <td>{user.phone}</td>
                                        <td>{user.gymMembership && '✔️'}</td>
                                        <td>{user.insurance}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <h4>Trainer Name: _________________________________</h4>
                        <h4>Trainer Signature: ______________________________</h4>
                    </div>
                </Box>
            </Modal>
            <style>
                {`
                    @media print {
                        .no-print {
                            display: none;
                        }
                        .MuiPaper-root {
                            box-shadow: none !important;
                        }
                    }
                `}
            </style>
        </div>
    );
}

export default ClassList;
