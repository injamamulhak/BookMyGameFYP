import { useState, useEffect } from 'react';
import api from '../../services/api';

const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'];

function VideoForm({ video, sports, onSave, onCancel }) {
    const isEdit = Boolean(video?.id);
    const [form, setForm] = useState({
        title: video?.title || '',
        description: video?.description || '',
        videoUrl: video?.videoUrl || '',
        thumbnailUrl: video?.thumbnailUrl || '',
        sportId: video?.sportId || '',
        difficultyLevel: video?.difficultyLevel || '',
        duration: video?.duration || '',
        isActive: video?.isActive !== undefined ? video.isActive : true,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.videoUrl.trim()) {
            setError('Title and Video URL are required.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const payload = {
                ...form,
                sportId: form.sportId || null,
                difficultyLevel: form.difficultyLevel || null,
                duration: form.duration ? parseInt(form.duration) : null,
            };
            if (isEdit) {
                await api.put(`/training/admin/${video.id}`, payload);
            } else {
                await api.post('/training/admin', payload);
            }
            onSave();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save video');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                        {isEdit ? 'Edit Training Video' : 'Add Training Video'}
                    </h2>
                    <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input
                            type="text"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="e.g. Basic Football Dribbling Techniques"
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                            required
                        />
                    </div>

                    {/* Video URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Video URL *</label>
                        <input
                            type="url"
                            name="videoUrl"
                            value={form.videoUrl}
                            onChange={handleChange}
                            placeholder="e.g. https://www.youtube.com/watch?v=... or direct .mp4 link"
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">Supports YouTube links and direct video URLs (mp4)</p>
                    </div>

                    {/* Thumbnail URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL <span className="text-gray-400">(optional)</span></label>
                        <input
                            type="url"
                            name="thumbnailUrl"
                            value={form.thumbnailUrl}
                            onChange={handleChange}
                            placeholder="Auto-generated for YouTube videos if left blank"
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400">(optional)</span></label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Brief description of what this video covers..."
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm resize-none"
                        />
                    </div>

                    {/* Sport & Difficulty */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sport <span className="text-gray-400">(optional)</span></label>
                            <select
                                name="sportId"
                                value={form.sportId}
                                onChange={handleChange}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                            >
                                <option value="">General / All Sports</option>
                                {sports.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty <span className="text-gray-400">(optional)</span></label>
                            <select
                                name="difficultyLevel"
                                value={form.difficultyLevel}
                                onChange={handleChange}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                            >
                                <option value="">Not specified</option>
                                {DIFFICULTY_LEVELS.map(d => (
                                    <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (seconds) <span className="text-gray-400">(optional)</span></label>
                        <input
                            type="number"
                            name="duration"
                            value={form.duration}
                            onChange={handleChange}
                            placeholder="e.g. 360 for a 6-minute video"
                            min="0"
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                        />
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            name="isActive"
                            id="isActive"
                            checked={form.isActive}
                            onChange={handleChange}
                            className="w-4 h-4 text-primary-600 rounded border-gray-300"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                            Active (visible to users)
                        </label>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm disabled:opacity-60"
                        >
                            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Video'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AdminTrainingVideos() {
    const [videos, setVideos] = useState([]);
    const [sports, setSports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingVideo, setEditingVideo] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchVideos();
        fetchSports();
    }, []);

    const fetchVideos = async () => {
        try {
            setLoading(true);
            const res = await api.get('/training/admin/all', { params: { limit: 100 } });
            if (res.data.success) setVideos(res.data.data);
        } catch (err) {
            console.error('Failed to fetch videos:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSports = async () => {
        try {
            const res = await api.get('/sports');
            if (res.data.success) setSports(res.data.data);
        } catch (err) {
            console.error('Failed to fetch sports:', err);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/training/admin/${id}`);
            setVideos(prev => prev.filter(v => v.id !== id));
            setDeleteConfirm(null);
        } catch (err) {
            console.error('Failed to delete video:', err);
        }
    };

    const handleSaved = () => {
        setShowForm(false);
        setEditingVideo(null);
        fetchVideos();
    };

    const filtered = videos.filter(v =>
        v.title.toLowerCase().includes(search.toLowerCase())
    );

    const formatDuration = (s) => {
        if (!s) return '—';
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    return (
        <div>
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Training Videos</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage instructional video content for users</p>
                </div>
                <button
                    onClick={() => { setEditingVideo(null); setShowForm(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Video
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-5 max-w-sm">
                <input
                    type="text"
                    placeholder="Search videos..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Total Videos', value: videos.length },
                    { label: 'Active', value: videos.filter(v => v.isActive).length },
                    { label: 'Total Views', value: videos.reduce((a, v) => a + (v.viewCount || 0), 0).toLocaleString() },
                ].map(({ label, value }) => (
                    <div key={label} className="bg-white rounded-xl shadow-sm p-4 text-center">
                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                        <p className="text-sm text-gray-500 mt-1">{label}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-4xl mb-3">🎬</div>
                        <p className="font-medium text-gray-700 mb-1">{search ? 'No matching videos' : 'No videos yet'}</p>
                        <p className="text-sm text-gray-500">
                            {search ? 'Try a different search term' : 'Click "Add Video" to get started'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Video</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sport</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Difficulty</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Views</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map(video => (
                                    <tr key={video.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="max-w-xs">
                                                <p className="font-medium text-gray-900 truncate">{video.title}</p>
                                                {video.description && (
                                                    <p className="text-xs text-gray-500 truncate mt-0.5">{video.description}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-sm text-gray-700">{video.sport?.name || '—'}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            {video.difficultyLevel ? (
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    video.difficultyLevel === 'beginner' ? 'bg-green-100 text-green-700'
                                                        : video.difficultyLevel === 'intermediate' ? 'bg-yellow-100 text-yellow-700'
                                                            : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {video.difficultyLevel.charAt(0).toUpperCase() + video.difficultyLevel.slice(1)}
                                                </span>
                                            ) : <span className="text-gray-400 text-sm">—</span>}
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-700">{formatDuration(video.duration)}</td>
                                        <td className="px-5 py-4 text-sm text-gray-700">{(video.viewCount || 0).toLocaleString()}</td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                video.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {video.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => { setEditingVideo(video); setShowForm(true); }}
                                                    className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(video.id)}
                                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Form Modal */}
            {showForm && (
                <VideoForm
                    video={editingVideo}
                    sports={sports}
                    onSave={handleSaved}
                    onCancel={() => { setShowForm(false); setEditingVideo(null); }}
                />
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="font-bold text-gray-900 mb-2">Delete Video?</h3>
                        <p className="text-sm text-gray-600 mb-5">This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
