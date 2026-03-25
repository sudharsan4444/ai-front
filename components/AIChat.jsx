import React, { useState, useEffect, useRef } from 'react';
import { chatWithAI } from '../services/aiService';

const AIChat = ({ user, focusedMaterial }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'system', content: `Hello ${user.name}! I'm your AI Teaching Assistant. Ask me anything about your course materials.` }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // Pass the focusedMaterial._id to ensure RAG filters correctly
            const reply = await chatWithAI(input, focusedMaterial?._id);
            setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
        } catch (error) {
            console.error(error);
            let errorMsg = error.response?.data?.message || "I'm having trouble connecting right now.";
            
            // Contextual help for RAG errors
            if (error.response?.status === 400 && errorMsg.includes('Context')) {
                errorMsg = "I couldn't find enough text in this document to answer specifically. It might still be indexing, or it's a scanned image PDF.";
            }
            
            setMessages(prev => [...prev, { role: 'error', content: errorMsg }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="bg-white/95 backdrop-blur-xl w-[380px] h-[550px] rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/50 flex flex-col mb-6 overflow-hidden animate-in slide-in-from-bottom-8 fade-in-0 duration-500 ease-out fill-mode-both">
                    {/* Header */}
                    <div className="bg-slate-900 p-6 flex justify-between items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <div className="flex items-center space-x-3 text-white relative z-10">
                            <div className="bg-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <i className="fas fa-robot text-sm"></i>
                            </div>
                            <div>
                                <h3 className="font-extrabold text-[13px] uppercase tracking-widest">{focusedMaterial ? 'Material Guide' : 'General Assistant'}</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className={`w-1.5 h-1.5 ${focusedMaterial ? 'bg-amber-400' : 'bg-emerald-400'} rounded-full animate-pulse`}></div>
                                    <p className="text-[10px] font-bold text-slate-400 tracking-wider">
                                        {focusedMaterial ? focusedMaterial.title.substring(0, 20) + (focusedMaterial.title.length > 20 ? '...' : '') : 'RAG ACTIVE'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors bg-white/5 w-8 h-8 rounded-full flex items-center justify-center relative z-10">
                            <i className="fas fa-times text-xs"></i>
                        </button>
                    </div>

                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scrollbar-hide">
                        {messages.map((m, idx) => (
                            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`max-w-[85%] rounded-[1.5rem] px-5 py-4 text-xs font-bold leading-relaxed shadow-sm ${m.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-100'
                                        : m.role === 'error'
                                            ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                            : 'bg-slate-50 text-slate-700 border border-slate-100 rounded-bl-none'
                                    }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-50 px-5 py-4 rounded-[1.5rem] rounded-bl-none border border-slate-100 flex space-x-1 items-center">
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-6 bg-white/50 backdrop-blur-sm border-t border-slate-100">
                        <form onSubmit={handleSend} className="relative group">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your inquiry..."
                                className="w-full pl-6 pr-14 py-4 bg-slate-100/80 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:outline-none transition-all text-xs font-bold text-slate-800 placeholder:text-slate-400"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="absolute right-2 top-2 w-10 h-10 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-30 transition-all flex items-center justify-center shadow-lg"
                            >
                                <i className="fas fa-paper-plane text-[10px]"></i>
                            </button>
                        </form>
                        <p className="text-[9px] text-center text-slate-300 font-bold mt-4 uppercase tracking-[0.2em]">Guided by AI Teaching Assistant Intelligence</p>
                    </div>
                </div>
            )}

            {/* Premium Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`group relative w-16 h-16 rounded-[1.75rem] shadow-2xl transition-all duration-500 flex items-center justify-center z-50 ${
                    isOpen 
                    ? 'bg-slate-900 border-4 border-white rotate-90 scale-90' 
                    : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-110 active:scale-95 shadow-indigo-200 hover:rotate-12'
                }`}
            >
                <div className={`absolute inset-0 bg-white/20 rounded-[1.5rem] scale-0 group-hover:scale-90 transition-transform duration-500`}></div>
                {isOpen ? (
                    <i className="fas fa-times text-xl text-white"></i>
                ) : (
                    <i className="fas fa-comment-dots text-2xl text-white"></i>
                )}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 border-2 border-white rounded-full animate-bounce"></span>
                )}
            </button>
        </div>
    );
};

export default AIChat;
