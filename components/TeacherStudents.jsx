
import React, { useState, useEffect } from 'react';
import api from '../services/api';

const TeacherStudents = ({ user, onRefresh }) => {
    const [assignedStudents, setAssignedStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [newStudent, setNewStudent] = useState({
        name: '', email: '', password: '', department: user.department || user.dept || '', year: '', rollNumber: ''
    });

    const resetForm = () => {
        setNewStudent({
            name: '', email: '', password: '', 
            department: user.department || user.dept || '', 
            year: '', rollNumber: '' 
        });
    };

    const [selectedStudent, setSelectedStudent] = useState(null);
    const [editingStudent, setEditingStudent] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => { fetchStudents(); }, []);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/users');
            setAssignedStudents(res.data.filter(u =>
                u.role === 'STUDENT' && (
                    (u.assignedTeacher?._id || u.assignedTeacher) === (user._id || user.id) ||
                    (u.facultyHead?._id || u.facultyHead) === (user._id || user.id)
                )
            ));
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleRemoveStudent = async (studentId, e) => {
        if (e) e.stopPropagation();
        if (!window.confirm('Remove this student from your assigned list? Account will NOT be deleted.')) return;
        try {
            await api.put(`/admin/users/${studentId}`, { assignedTeacher: null, facultyHead: null });
            fetchStudents();
        } catch (err) { alert('Failed to remove student'); }
    };

    const handlePermanentDelete = async (studentId, e) => {
        if (e) e.stopPropagation();
        if (!window.confirm('PERMANENTLY DELETE THIS STUDENT ACCOUNT? This cannot be undone and all their data will be lost.')) return;
        try {
            await api.delete(`/admin/users/${studentId}`);
            fetchStudents();
            if (onRefresh) onRefresh();
        } catch (err) { alert('Failed to delete student: ' + (err.response?.data?.message || err.message)); }
    };

    const handleOpenAddForm = () => {
        resetForm();
        setShowAddForm(true);
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/create-user', {
                ...newStudent,
                role: 'STUDENT',
                year: parseInt(newStudent.year),
                assignedTeacher: user._id || user.id,
                facultyHead: user._id || user.id
            });
            alert('Student registered successfully');
            setShowAddForm(false);
            resetForm();
            fetchStudents();
        } catch (err) { alert(err.response?.data?.message || 'Error adding student'); }
    };

    const handleUpdateStudent = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            await api.put(`/admin/users/${editingStudent._id}`, { ...editingStudent, year: parseInt(editingStudent.year) });
            alert('Updated successfully');
            setEditingStudent(null);
            fetchStudents();
        } catch (err) { alert(err.response?.data?.message || 'Error updating student'); }
        finally { setIsUpdating(false); }
    };

    const filteredStudents = assignedStudents.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) return <div className="p-16 text-center text-indigo-600 font-bold text-lg animate-pulse">Synchronizing Scholar Network...</div>;

    const StudentProfile = ({ student }) => (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in duration-300" onClick={() => setSelectedStudent(null)}>
            <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-slate-900 text-white p-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-md">
                                {student.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold">{student.name}</h2>
                                <p className="text-indigo-300 font-medium text-sm mt-1">{student.email}</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedStudent(null)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                            <i className="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-3 gap-6">
                        <div className="text-center p-5 bg-slate-50 rounded-2xl border border-slate-200">
                            <p className="text-xl font-bold text-indigo-600">{student.rollNumber || 'N/A'}</p>
                            <p className="text-xs font-semibold text-slate-500 mt-1 uppercase">Roll Number</p>
                        </div>
                        <div className="text-center p-5 bg-slate-50 rounded-2xl border border-slate-200">
                            <p className="text-xl font-bold text-slate-900">{student.year || '?'}</p>
                            <p className="text-xs font-semibold text-slate-500 mt-1 uppercase">Batch Year</p>
                        </div>
                        <div className="text-center p-5 bg-indigo-600 text-white rounded-2xl shadow-md">
                            <p className="text-2xl font-bold">{student.gpa || '0.00'}</p>
                            <p className="text-xs font-semibold text-indigo-200 mt-1 uppercase">Current GPA</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Department</p>
                            <p className="text-lg font-bold text-slate-900">{student.department || 'N/A'}</p>
                        </div>
                        {(user.role === 'ADMIN' || (student.assignedTeacher?._id || student.assignedTeacher) === (user._id || user.id) || (student.facultyHead?._id || student.facultyHead) === (user._id || user.id)) && (
                            <button
                                onClick={() => { setEditingStudent(student); setSelectedStudent(null); }}
                                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-indigo-600 transition-all shadow-md flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-edit"></i> Update Scholar Profile
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Scholar Directory</h1>
                    <p className="text-slate-500 text-lg font-medium mt-1">Manage and monitor assigned scholars.</p>
                </div>
                <button
                    onClick={handleOpenAddForm}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                    <i className="fas fa-user-plus"></i>
                    Register New Scholar
                </button>
            </div>

            {showAddForm && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowAddForm(false)}>
                    <div className="bg-white p-8 rounded-3xl w-full max-w-3xl shadow-xl border border-slate-100" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-slate-900">Register New Scholar</h3>
                            <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600 w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
                                <i className="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        <form onSubmit={handleAddStudent} className="space-y-6">
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                                    <input type="text" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:border-indigo-500 focus:bg-white outline-none" value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} placeholder="Full Name" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Email</label>
                                    <input type="email" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:border-indigo-500 focus:bg-white outline-none" value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} placeholder="email@ext.com" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                                    <input type="password" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:border-indigo-500 focus:bg-white outline-none" value={newStudent.password} onChange={e => setNewStudent({ ...newStudent, password: e.target.value })} placeholder="••••••••" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Batch Year</label>
                                    <input type="number" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:border-indigo-500 focus:bg-white outline-none" value={newStudent.year} onChange={e => setNewStudent({ ...newStudent, year: e.target.value })} placeholder="e.g. 2026" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Department</label>
                                    <input type="text" disabled className="w-full p-3 bg-slate-200 border border-slate-300 rounded-xl font-medium text-slate-500" value={newStudent.department} />
                                </div>
                                <div className="col-span-full pt-4">
                                    <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-md">
                                        <i className="fas fa-check"></i> Complete Registration
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="relative group">
                <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-indigo-600 transition-colors"></i>
                <input
                    type="text"
                    placeholder="Search by Scholar Name or Roll Number..."
                    className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-lg"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStudents.length === 0 ? (
                    <div className="col-span-full py-16 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <i className="fas fa-user-graduate text-5xl text-slate-300 mb-4"></i>
                        <p className="text-slate-500 font-bold text-lg">No matching scholars found</p>
                    </div>
                ) : (
                    filteredStudents.map(student => (
                        <div
                            key={student._id}
                            onClick={() => setSelectedStudent(student)}
                            className="bg-white rounded-3xl p-6 shadow-sm border border-sky-100 hover:shadow-lg hover:border-sky-300 transition-all cursor-pointer group relative overflow-hidden"
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-14 h-14 bg-slate-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                    {student.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                    {student.rollNumber || 'NO ROLL'}
                                </span>
                            </div>

                            <h3 className="font-bold text-xl text-slate-900 mb-1 leading-tight group-hover:text-indigo-600 transition-colors">{student.name}</h3>
                            <p className="text-sm font-medium text-slate-500 mb-6">{student.email}</p>

                            <div className="flex items-center gap-4">
                                <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 flex-1">
                                    <p className="text-xs font-semibold text-slate-400 uppercase">Batch</p>
                                    <p className="font-bold text-slate-800">{student.year || '?'}</p>
                                </div>
                                <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 flex-1">
                                    <p className="text-xs font-semibold text-indigo-400 uppercase">GPA</p>
                                    <p className="font-bold text-indigo-600">{student.gpa || '0.00'}</p>
                                </div>
                            </div>
                            
                            <div className="mt-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setEditingStudent(student); }}
                                    className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all"
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={(e) => handlePermanentDelete(student._id, e)}
                                    className="flex-1 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-xs hover:bg-red-600 hover:text-white transition-all"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {editingStudent && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-6 animate-in fade-in duration-300" onClick={() => setEditingStudent(null)}>
                    <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                               <h3 className="text-2xl font-bold text-slate-900">Update Scholar</h3>
                               <p className="text-slate-500 font-medium text-sm">Department: {editingStudent.department}</p>
                            </div>
                            <button onClick={() => setEditingStudent(null)} className="w-10 h-10 border border-slate-200 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-all"><i className="fas fa-times"></i></button>
                        </div>
                        <form onSubmit={handleUpdateStudent} className="space-y-5">
                           <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                                <input type="text" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:border-indigo-500 focus:bg-white outline-none" value={editingStudent.name} onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                               <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Roll Number</label>
                                    <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:border-indigo-500 focus:bg-white outline-none" value={editingStudent.rollNumber || ''} onChange={e => setEditingStudent({ ...editingStudent, rollNumber: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Batch Year</label>
                                    <input type="number" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:border-indigo-500 focus:bg-white outline-none" value={editingStudent.year} onChange={e => setEditingStudent({ ...editingStudent, year: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                                <input type="email" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:border-indigo-500 focus:bg-white outline-none" value={editingStudent.email} onChange={e => setEditingStudent({ ...editingStudent, email: e.target.value })} />
                            </div>
                            <div className="pt-4 flex gap-4">
                                <button type="button" onClick={() => setEditingStudent(null)} className="flex-1 py-3 border border-slate-300 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all">Cancel</button>
                                <button type="submit" disabled={isUpdating} className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md">
                                    {isUpdating ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherStudents;
