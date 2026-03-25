
import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';

export const MaterialViewer = ({ material, onClose }) => {
    const getYouTubeEmbedUrl = (url) => {
        if (!url) return '';
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11)
            ? `https://www.youtube.com/embed/${match[2]}?autoplay=1`
            : null;
    };

    const isYouTube = material.type === 'YOUTUBE' || (material.type === 'VIDEO' && (material.url.includes('youtube.com') || material.url.includes('youtu.be')));
    const embedUrl = isYouTube ? getYouTubeEmbedUrl(material.url) : null;
    
    // Construct robust file URL relative to current host if possible, or fallback to backend port
    const backendBase = `${window.location.protocol}//${window.location.hostname}:8110`;
    const fileUrl = material.url.startsWith('http') ? material.url : `${backendBase}${material.url}`;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
            <button className="absolute top-6 right-6 text-slate-300 hover:text-white transition-all z-[110] bg-white/10 p-3 rounded-full hover:bg-white/20">
                <i className="fas fa-times text-2xl"></i>
            </button>

            <div className="w-full h-full max-w-6xl max-h-[90vh] flex flex-col p-4 md:p-6" onClick={e => e.stopPropagation()}>
                <div className="flex-1 bg-white rounded-2xl overflow-hidden shadow-2xl relative border border-slate-200">
                    {material.type === 'VIDEO' || material.type === 'YOUTUBE' ? (
                        isYouTube && embedUrl ? (
                            <iframe
                                src={embedUrl}
                                title={material.title}
                                className="w-full h-full"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        ) : (
                            <div className="bg-black w-full h-full flex items-center justify-center">
                                <video src={fileUrl} controls autoPlay className="max-w-full max-h-full object-contain"></video>
                            </div>
                        )
                    ) : (
                        <iframe src={fileUrl} title={material.title} className="w-full h-full bg-slate-100"></iframe>
                    )}
                </div>

                <div className="mt-6 text-white space-y-2">
                    <div className="flex items-center space-x-3">
                        <span className="bg-indigo-600 font-bold text-xs uppercase px-2 py-1 rounded">
                            {material.subject}
                        </span>
                        <span className="text-slate-400 text-xs">•</span>
                        <span className="font-semibold text-indigo-300 text-sm">
                            {material.uploadedBy?.name || 'Instructor'}
                        </span>
                    </div>
                    <h2 className="text-2xl font-bold">{material.title}</h2>
                    <p className="text-slate-300 text-sm max-w-3xl line-clamp-2">
                        {material.description}
                    </p>
                </div>
            </div>
        </div>
    );
};

const MaterialCard = ({ material, onClick, onEdit, onDelete, canEdit, canDelete }) => {
    const isYouTube = material.type === 'YOUTUBE';
    const isVideo = material.type === 'VIDEO';
    
    const handleDeleteClick = async (e) => {
        e.stopPropagation();
        if (!window.confirm(`Delete "${material.title}"? This cannot be undone.`)) return;
        try {
            await onDelete(material._id);
        } catch (err) {
            alert('Failed to delete: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleEditClick = (e) => {
        e.stopPropagation();
        onEdit(material);
    };

    return (
        <div onClick={() => onClick(material)} className="group relative bg-white rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all cursor-pointer border border-slate-200">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm ${isYouTube ? 'bg-red-50 text-red-500' : isVideo ? 'bg-indigo-50 text-indigo-500' : 'bg-rose-50 text-rose-500'}`}>
                   <i className={`fas ${isYouTube ? 'fa-brands fa-youtube' : isVideo ? 'fa-video' : 'fa-file-pdf'}`}></i>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canEdit && (
                        <button onClick={handleEditClick} className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-colors" title="Edit Material">
                            <i className="fas fa-edit text-sm"></i>
                        </button>
                    )}
                    {canDelete && (
                        <button onClick={handleDeleteClick} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors" title="Delete Material">
                            <i className="fas fa-trash-alt text-sm"></i>
                        </button>
                    )}
                </div>
            </div>

            <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Unit {material.unit || '1'}</span>
                <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                    {material.title}
                </h3>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-500">
                        {material.uploadedBy?.name?.[0] || 'T'}
                    </div>
                    <span className="text-sm font-semibold text-slate-500 truncate max-w-[100px]">
                        {material.uploadedBy?.name || 'Instructor'}
                    </span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-indigo-600">
                    {isYouTube || isVideo ? 'Watch' : 'Read'} <i className="fas fa-arrow-right text-[10px]"></i>
                </div>
            </div>
        </div>
    );
};

const MaterialLibrary = ({ user, ownOnly = false, onMaterialView }) => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMaterial, setSelectedMaterial] = useState(null);

    useEffect(() => {
        if (selectedMaterial && onMaterialView) {
            onMaterialView(selectedMaterial);
        }
    }, [selectedMaterial, onMaterialView]);
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [search, setSearch] = useState('');
    const [collapsedDepts, setCollapsedDepts] = useState({});
    const [editForm, setEditForm] = useState({ title: '', uploadedBy: '', subject: '', department: '' });
    const [allTeachers, setAllTeachers] = useState([]);

    const fetchMaterials = async () => {
        try {
            setLoading(true);
            const res = await api.get('/upload');
            setMaterials(res.data);
            if (user?.role === 'ADMIN') {
                const userRes = await api.get('/admin/users');
                setAllTeachers(userRes.data.filter(u => u.role === 'TEACHER'));
            }
        } catch (err) {
            console.error('Error fetching materials:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMaterials(); }, []);

    const handleDelete = async (materialId) => {
        await api.delete(`/upload/${materialId}`);
        setMaterials(prev => prev.filter(m => m._id !== materialId));
    };

    const handleEditStart = (material) => {
        setEditForm({
            title: material.title,
            uploadedBy: material.uploadedBy?._id || material.uploadedBy || '',
            subject: material.subject || '',
            department: material.department || ''
        });
        setEditingMaterial(material);
    };

    const handleEditSave = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put(`/upload/${editingMaterial._id}`, editForm);
            setMaterials(prev => prev.map(m => m._id === editingMaterial._id ? res.data : m));
            setEditingMaterial(null);
            alert('Material updated successfully.');
        } catch (err) {
            alert('Failed to update material: ' + (err.response?.data?.message || err.message));
        }
    };

    const filtered = useMemo(() => {
        let base = ownOnly
            ? materials.filter(m => (m.uploadedBy?._id || m.uploadedBy) === user?._id)
            : materials;
        if (!search.trim()) return base;
        const q = search.toLowerCase();
        return base.filter(m =>
            m.title?.toLowerCase().includes(q) ||
            m.subject?.toLowerCase().includes(q) ||
            m.department?.toLowerCase().includes(q)
        );
    }, [materials, search, ownOnly, user]);

    const grouped = useMemo(() => {
        const map = {};
        filtered.forEach(m => {
            const dept = m.department || 'General';
            const subj = m.subject && m.subject !== 'Uncategorized' ? m.subject : (m.title || 'Uncategorized');
            if (!map[dept]) map[dept] = {};
            if (!map[dept][subj]) map[dept][subj] = { pdfs: [], visual: [] };
            
            if (m.type === 'PDF') map[dept][subj].pdfs.push(m);
            else map[dept][subj].visual.push(m);
        });
        return map;
    }, [filtered]);

    const toggleDept = (dept) => setCollapsedDepts(prev => ({ ...prev, [dept]: !prev[dept] }));
    const deptNames = Object.keys(grouped).sort();

    if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Synchronizing Library...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Learning Library</h1>
                    <p className="text-slate-500 font-medium">Educational resources organized by department</p>
                </div>
                <div className="relative">
                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input
                        type="text"
                        placeholder="Search specific materials..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-10 pr-4 py-3 border border-slate-200 rounded-xl font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all w-64 md:w-80"
                    />
                </div>
            </div>

            {deptNames.length === 0 ? (
                <div className="bg-slate-50 p-12 rounded-3xl text-center border-2 border-dashed border-slate-200">
                    <i className="fas fa-folder-open text-4xl text-slate-300 mb-4 block"></i>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">No materials found</h3>
                    <p className="text-slate-500 text-sm">No resources available for this search criteria.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {deptNames.map(dept => {
                        const isCollapsed = collapsedDepts[dept];
                        const subjects = grouped[dept];
                        const totalCount = Object.values(subjects).reduce((sum, sObj) => sum + sObj.pdfs.length + sObj.visual.length, 0);
                        const isMyDept = user?.department && dept.toLowerCase() === user.department.toLowerCase();

                        return (
                            <div key={dept} className={`rounded-2xl border transition-all ${isMyDept ? 'border-indigo-200 shadow-sm' : 'border-slate-200'}`}>
                                <button
                                    onClick={() => toggleDept(dept)}
                                    className={`w-full flex items-center justify-between p-5 text-left transition-colors rounded-t-2xl ${isMyDept ? 'bg-indigo-50 hover:bg-indigo-100' : 'bg-slate-50 hover:bg-slate-100'} ${isCollapsed ? 'rounded-b-2xl' : ''}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg shadow-sm ${isMyDept ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}>
                                            <i className="fas fa-building"></i>
                                        </div>
                                        <div>
                                            <h2 className={`font-bold text-xl flex items-center gap-2 ${isMyDept ? 'text-indigo-800' : 'text-slate-800'}`}>
                                                {dept}
                                                {isMyDept && <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-md font-bold uppercase">My Dept</span>}
                                            </h2>
                                            <p className="text-sm font-semibold text-slate-500 mt-1">
                                                {Object.keys(subjects).length} Subjects • {totalCount} Resources
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-500 shadow-sm">
                                       <i className={`fas fa-chevron-${isCollapsed ? 'down' : 'up'}`}></i>
                                    </div>
                                </button>

                                {!isCollapsed && (
                                    <div className="p-6 space-y-10 bg-white rounded-b-2xl">
                                        {Object.keys(subjects).sort().map(subj => {
                                            const { pdfs, visual } = subjects[subj];
                                            return (
                                                <div key={subj} className="space-y-6">
                                                    <div className="flex items-center gap-4">
                                                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                                            <i className="fas fa-bookmark text-indigo-500"></i> {subj}
                                                        </h3>
                                                        <div className="h-px flex-1 bg-slate-200"></div>
                                                    </div>

                                                    <div className="grid lg:grid-cols-2 gap-8">
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between px-2">
                                                                <h4 className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                                                    <i className="fas fa-file-pdf text-rose-500"></i> Documents
                                                                </h4>
                                                                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">{pdfs.length} items</span>
                                                            </div>
                                                            {pdfs.length > 0 ? (
                                                                <div className="grid sm:grid-cols-2 gap-4">
                                                                    {pdfs.map(m => {
                                                                        const canEdit = user?.role === 'ADMIN';
                                                                        const canDelete = user?.role === 'ADMIN' || (m.uploadedBy?._id || m.uploadedBy) === user?._id;
                                                                        return <MaterialCard key={m._id} material={m} onClick={setSelectedMaterial} onEdit={handleEditStart} onDelete={handleDelete} canEdit={canEdit} canDelete={canDelete} />;
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <div className="p-6 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 font-medium">None available</div>
                                                            )}
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between px-2">
                                                                <h4 className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                                                    <i className="fas fa-play-circle text-indigo-500"></i> Videos & Media
                                                                </h4>
                                                                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">{visual.length} items</span>
                                                            </div>
                                                            {visual.length > 0 ? (
                                                                <div className="grid sm:grid-cols-2 gap-4">
                                                                    {visual.map(m => {
                                                                        const canEdit = user?.role === 'ADMIN';
                                                                        const canDelete = user?.role === 'ADMIN' || (m.uploadedBy?._id || m.uploadedBy) === user?._id;
                                                                        return <MaterialCard key={m._id} material={m} onClick={setSelectedMaterial} onEdit={handleEditStart} onDelete={handleDelete} canEdit={canEdit} canDelete={canDelete} />;
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <div className="p-6 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 font-medium">None available</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedMaterial && <MaterialViewer material={selectedMaterial} onClose={() => setSelectedMaterial(null)} />}

            {editingMaterial && user?.role === 'ADMIN' && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in" onClick={() => setEditingMaterial(null)}>
                    <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">Edit Material</h2>
                            <button onClick={() => setEditingMaterial(null)} className="text-slate-400 hover:text-slate-600 transition-colors w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleEditSave} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Material Title</label>
                                <input
                                    type="text" required
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-medium text-slate-800"
                                    value={editForm.title} onChange={e => setEditForm(prev => ({...prev, title: e.target.value}))}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Reassign Owner (Teacher)</label>
                                <select
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-medium text-slate-800 appearance-none bg-white"
                                    value={editForm.uploadedBy} onChange={e => setEditForm(prev => ({...prev, uploadedBy: e.target.value}))}
                                >
                                    <option value="" disabled>Select a faculty member...</option>
                                    {allTeachers.map(t => (
                                        <option key={t._id} value={t._id}>{t.name} ({t.department})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Subject</label>
                                    <input
                                        type="text" required
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-medium text-slate-800"
                                        value={editForm.subject} onChange={e => setEditForm(prev => ({...prev, subject: e.target.value}))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Department</label>
                                    <input
                                        type="text" required
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-medium text-slate-800"
                                        value={editForm.department} onChange={e => setEditForm(prev => ({...prev, department: e.target.value}))}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setEditingMaterial(null)} className="flex-1 py-3 text-slate-600 font-bold border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-all flex justify-center items-center gap-2">
                                   <i className="fas fa-save"></i> Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaterialLibrary;
