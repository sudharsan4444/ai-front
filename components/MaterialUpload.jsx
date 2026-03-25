
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { MaterialViewer } from './MaterialLibrary';

const MaterialUpload = ({ user, onViewResults }) => {
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [formData, setFormData] = useState({
        title: '', description: '', subject: '', department: user.department || '', type: 'PDF', unit: '1', youtubeUrl: ''
    });
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [materials, setMaterials] = useState([]);

    useEffect(() => { fetchMaterials(); }, []);

    const fetchMaterials = async () => {
        try {
            const res = await api.get('/upload');
            const seen = new Set();
            const unique = res.data.filter(m => {
                if (seen.has(m._id)) return false;
                seen.add(m._id);
                return true;
            });
            setMaterials(unique);
        } catch (err) { console.error('Error fetching materials:', err); }
    };

    const handleDeleteMaterial = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Delete this resource permanently?')) return;
        try {
            await api.delete(`/upload/${id}`);
            setMaterials(prev => prev.filter(m => m._id !== id));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete material');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        if (file) data.append('file', file);
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('subject', formData.subject);
        data.append('department', formData.department);
        data.append('unit', formData.unit);
        data.append('type', formData.type);
        if (formData.type === 'YOUTUBE') data.append('youtubeUrl', formData.youtubeUrl);

        try {
            setUploading(true);
            await api.post('/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            alert('Material integrated successfully!');
            setFormData({ title: '', description: '', subject: '', department: user.department || '', type: 'PDF', unit: '1', youtubeUrl: '' });
            setFile(null);
            fetchMaterials();
        } catch (err) {
            alert(err.response?.data?.message || 'Error uploading material');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Knowledge Integration</h2>
                <p className="text-slate-500 text-lg font-medium italic mt-2">Expand the institutional repository with premium learning resources.</p>
            </div>

            <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Asset Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-black text-slate-800 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                                placeholder="e.g. Quantum Mechanics 101"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Domain/Subject</label>
                            <input
                                type="text"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-black text-slate-800 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                                placeholder="e.g. Physics"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Department</label>
                            <input
                                type="text"
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-black text-slate-800 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                                placeholder="e.g. Computer Science"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Resource Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-black text-slate-800 focus:border-indigo-500 focus:bg-white transition-all outline-none appearance-none cursor-pointer"
                            >
                                <option value="PDF">PDF Document</option>
                                <option value="VIDEO">Video (MP4)</option>
                                <option value="YOUTUBE">YouTube Flux</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Curriculum Unit</label>
                            <input
                                type="text"
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-black text-slate-800 focus:border-indigo-500 focus:bg-white transition-all outline-none text-center"
                                placeholder="1"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Source Payload</label>
                            {formData.type === 'YOUTUBE' ? (
                                <input
                                    type="url"
                                    value={formData.youtubeUrl}
                                    onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-black text-slate-800 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                                    placeholder="https://youtu.be/..."
                                    required
                                />
                            ) : (
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="file-upload"
                                        onChange={(e) => setFile(e.target.files[0])}
                                        className="hidden"
                                        required
                                    />
                                    <label htmlFor="file-upload" className="w-full px-6 py-4 bg-slate-100 border-2 border-dashed border-slate-300 rounded-[1.5rem] font-black text-slate-400 flex items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition-all text-xs uppercase tracking-widest">
                                        {file ? file.name : 'Select File'}
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Brief Abstract</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-black text-slate-800 focus:border-indigo-500 focus:bg-white transition-all outline-none h-24 italic"
                            placeholder="Describe the knowledge payload..."
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={uploading}
                        className="w-full bg-slate-900 text-white py-6 rounded-[1.5rem] font-black text-base uppercase tracking-[0.5em] hover:bg-indigo-600 transition-all shadow-2xl flex items-center justify-center gap-4 group"
                    >
                        {uploading ? <i className="fas fa-atom fa-spin"></i> : <i className="fas fa-cloud-upload-alt group-hover:-translate-y-1 transition-transform"></i>}
                        {uploading ? 'Processing Payload...' : 'Submit to Repository'}
                    </button>
                </form>
            </div>

            <div className="space-y-6">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Manifested Resources</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {materials.map(m => (
                        <div
                            key={m._id}
                            onClick={() => setSelectedMaterial(m)}
                            className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 cursor-pointer hover:border-indigo-400 hover:shadow-2xl hover:-translate-y-2 transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-[2rem] -mr-12 -mt-12 group-hover:bg-indigo-50 transition-all"></div>
                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <h4 className="font-black text-slate-900 text-xl tracking-tighter line-clamp-1 group-hover:text-indigo-600 uppercase italic">{m.title}</h4>
                                <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest ${
                                    m.type === 'YOUTUBE' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                }`}>
                                    {m.type}
                                </span>
                            </div>
                            <p className="text-xs font-bold text-slate-400 line-clamp-2 italic mb-6 leading-relaxed">"{m.description || 'No abstract provided for this asset.'}"</p>
                            
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex flex-col">
                                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{m.subject}</span>
                                   <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">Unit 0{m.unit}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => handleDeleteMaterial(m._id, e)}
                                        className="w-10 h-10 bg-white text-red-500 border border-slate-100 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                    >
                                        <i className="fas fa-trash-alt text-xs"></i>
                                    </button>
                                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
                                       <i className="fas fa-chevron-right text-xs"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedMaterial && (
                <MaterialViewer
                    material={selectedMaterial}
                    onClose={() => setSelectedMaterial(null)}
                />
            )}
        </div>
    );
};

export default MaterialUpload;
