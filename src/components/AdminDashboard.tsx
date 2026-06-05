import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Plus, Trash2, CheckCircle, XCircle, Clock, Link as LinkIcon, Users, Settings as SettingsIcon, Save, Edit3, X, Download, Search, Boxes } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Guest, WeddingSettings } from '../types';

import { supabase } from '../supabase';

export default function AdminDashboard() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [categories, setCategories] = useState<WeddingSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'guests' | 'settings'>('guests');
  
  // Guest Form
  const [newName, setNewName] = useState('');
  const [newMsg, setNewMsg] = useState('');
  const [greetingType, setGreetingType] = useState('Дорогие');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [qrModal, setQrModal] = useState<{id: string, url: string} | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  // Settings Form
  const [editingCategory, setEditingCategory] = useState<WeddingSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchData = async () => {
    try {
      const { data: guestsData, error: guestsError } = await supabase.from('guests').select('*');
      const { data: settingsData, error: settingsError } = await supabase.from('settings').select('*');
      
      if (guestsError) throw guestsError;
      if (settingsError) throw settingsError;
      
      const sortedGuests = (guestsData || []).reverse();
      setGuests(sortedGuests);
      setCategories(settingsData || []);
      
      if (settingsData && settingsData.length > 0 && !selectedEventId) {
        setSelectedEventId(settingsData[0].id);
      }
    } catch (e) {
      console.error('Supabase fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !selectedEventId) return;

    const newGuest: Guest = {
      id: uuidv4().slice(0, 8),
      eventId: selectedEventId,
      name: newName,
      greetingType,
      customMessage: newMsg || "Будем очень рады разделить с вами этот особенный для нас день!",
      status: 'pending',
      isAdminGenerated: true,
    };

    try {
      const { error } = await supabase.from('guests').insert([newGuest]);
      if (!error) {
        setNewName('');
        setNewMsg('');
        setGreetingType('Дорогие');
        fetchData();
      } else {
        console.error('Insert error:', error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setSavingSettings(true);
    
    // Check if new by seeing if it doesn't already exist in the categories list
    const isNew = !categories.find(c => c.id === editingCategory.id);

    try {
      let error;
      if (isNew) {
         const { error: err } = await supabase.from('settings').insert([editingCategory]);
         error = err;
      } else {
         const { error: err } = await supabase.from('settings').update(editingCategory).eq('id', editingCategory.id);
         error = err;
      }
      
      if (!error) {
        setEditingCategory(null);
        fetchData();
      } else {
        console.error('Save category error:', error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
       await supabase.from('settings').delete().eq('id', id);
       if (selectedEventId === id) setSelectedEventId('');
       fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const createNewCategory = () => {
    setEditingCategory({
      id: uuidv4().slice(0, 8),
      name: 'Новая свадьба',
      groomName: 'Амир',
      brideName: 'Мадина',
      date: '',
      time: '18:00',
      venueName: 'Ресторан "Яккасарой"',
      venueAddress: 'ул. Айни 48, Душанбе, Таджикистан',
      venueMapLink: 'https://yandex.ru/maps/-/CDTq6M~k',
      accentColor: '#b59e78',
      dressCodeText: 'Мы не ограничиваем вас определенными цветами или стилем.\nДля нас самое главное – ваше присутствие, улыбки и хорошее настроение в этот день!\nВыбирайте образ, в котором вы будете чувствовать себя красиво и комфортно.\nЕдинственная просьба – просим девушек воздержаться от белых платьев, чтобы этот цвет остался исключительно за невестой.',
      wishesText: 'Настоящая таджикская свадьба – это когда столы ломятся от угощений, а национальная музыка зовет в пляс!\nДрузья, наше вам пожелание: будьте сегодня в ударе! Услышали дойру или карнай – бросайте всё и выходите в круг!\nВаша поддержка и веселье сделают нашу свадьбу незабываемой!'
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('guests').delete().eq('id', id);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/invite/${id}`;
    navigator.clipboard.writeText(url);
  };

  const downloadQR = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `QR-${qrModal?.id}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const stats = {
    total: guests.length,
    accepted: guests.filter(g => g.status === 'accepted').length,
    declined: guests.filter(g => g.status === 'declined').length,
    pending: guests.filter(g => g.status === 'pending').length,
  };

  const filteredGuests = guests.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 rounded-full border-2 border-gray-400 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  const getCategoryName = (eventId: string) => {
    const cat = categories.find(c => c.id === eventId);
    return cat ? cat.name : 'Удаленная категория';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* QR Modal AnimatePresence */}
      <AnimatePresence>
        {qrModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setQrModal(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full relative"
            >
              <button 
                onClick={() => setQrModal(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors"
              >
                <X size={20} />
              </button>
              <h3 className="text-xl font-serif mb-6 text-gray-900 text-center">QR-код приглашения</h3>
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6">
                <QRCodeSVG id="qr-code-svg" value={qrModal.url} size={200} level="H" includeMargin />
              </div>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => { navigator.clipboard.writeText(qrModal.url); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg transition-colors font-medium text-sm text-center"
                >
                  <Copy size={16} /> Копировать
                </button>
                <button 
                  onClick={downloadQR}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 hover:bg-black text-white rounded-lg transition-colors font-medium text-sm text-center"
                >
                  <Download size={16} /> Скачать
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header 
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="mb-8 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between border-b border-gray-200 pb-5"
      >
        <div>
          <h1 className="text-4xl font-serif text-gray-900 tracking-tight mb-2">Управление приглашениями</h1>
          <p className="text-gray-500 font-sans">Создавайте и управляйте персонализированными приглашениями на свадьбу.</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2 bg-gray-100 p-1 rounded-lg self-center md:self-auto">
          <button 
            onClick={() => {setActiveTab('guests'); setEditingCategory(null);}}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'guests' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Users size={16} />
            Гости
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'settings' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <SettingsIcon size={16} />
            Настройки
          </button>
        </div>
      </motion.header>

      <AnimatePresence mode="wait">
      {activeTab === 'guests' ? (
        <motion.div
           key="guests"
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -10 }}
           transition={{ duration: 0.2 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.05, duration: 0.2 }} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Всего</p>
                <p className="text-3xl font-serif mt-1 text-gray-900">{stats.total}</p>
              </div>
              <div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500">
                <LinkIcon size={20} />
              </div>
            </motion.div>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, duration: 0.2 }} className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600">Придут</p>
                <p className="text-3xl font-serif mt-1 text-gray-900">{stats.accepted}</p>
              </div>
              <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                <CheckCircle size={20} />
              </div>
            </motion.div>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15, duration: 0.2 }} className="bg-white p-6 rounded-xl shadow-sm border border-amber-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Думают</p>
                <p className="text-3xl font-serif mt-1 text-gray-900">{stats.pending}</p>
              </div>
              <div className="h-10 w-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
                <Clock size={20} />
              </div>
            </motion.div>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, duration: 0.2 }} className="bg-white p-6 rounded-xl shadow-sm border border-rose-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-rose-600">Отказ</p>
                <p className="text-3xl font-serif mt-1 text-gray-900">{stats.declined}</p>
              </div>
              <div className="h-10 w-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-600">
                <XCircle size={20} />
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-8">
                <h2 className="text-xl font-serif mb-6 text-gray-900">Новое приглашение</h2>
                <form onSubmit={handleAddGuest} className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Категория (Пара)</label>
                     <select 
                        required
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        className="w-full px-4 py-2 border text-gray-900 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 transition-colors bg-white"
                     >
                       <option value="" disabled>Выберите категорию</option>
                       {categories.map(c => (
                         <option key={c.id} value={c.id}>{c.name}</option>
                       ))}
                     </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Обращение</label>
                    <div className="grid grid-cols-3 gap-2">
                       {['Дорогой', 'Дорогая', 'Дорогие'].map(type => (
                         <button
                           key={type}
                           type="button"
                           onClick={() => setGreetingType(type)}
                           className={`py-2 text-sm rounded-lg border transition-colors ${greetingType === type ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                         >
                           {type}
                         </button>
                       ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Имена гостей</label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Например: Александр и Мария"
                      className="w-full px-4 py-2 border text-gray-900 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Индивидуальный текст (опционально)</label>
                    <textarea
                      rows={3}
                      value={newMsg}
                      onChange={(e) => setNewMsg(e.target.value)}
                      placeholder="Будем очень рады разделить с вами этот особенный день!"
                      className="w-full px-4 py-2 border text-gray-900 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!selectedEventId}
                    className="w-full bg-gray-900 hover:bg-black text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <Plus size={18} />
                    Создать приглашение
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Поиск гостя по имени..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 transition-colors text-sm"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm font-medium uppercase tracking-wider">
                        <th className="px-6 py-4">Гости</th>
                        <th className="px-6 py-4">Статус</th>
                        <th className="px-6 py-4">Ссылка & QR</th>
                        <th className="px-6 py-4 text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 relative">
                      <AnimatePresence>
                        {filteredGuests.length === 0 && (
                          <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <td colSpan={4} className="text-center py-12">
                              <div className="mx-auto w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                <LinkIcon className="text-gray-300" />
                              </div>
                              <p className="text-gray-500">
                                {guests.length === 0 ? 'Список гостей пуст.' : 'Гости не найдены.'}
                              </p>
                            </td>
                          </motion.tr>
                        )}
                        {filteredGuests.map((guest, index) => (
                          <motion.tr 
                            key={guest.id} 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -5 }}
                            transition={{ delay: index * 0.02, duration: 0.2 }}
                            className="hover:bg-gray-50/50 transition-colors group"
                          >
                            <td className="px-6 py-4">
                              <p className="font-serif font-medium text-gray-900 text-lg">{guest.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{getCategoryName(guest.eventId || '')}</p>
                              {guest.dietaryRestrictions && (
                                <p className="text-xs text-rose-600 mt-1 uppercase tracking-wider flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                  {guest.dietaryRestrictions}
                                </p>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {guest.status === 'accepted' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Придут</span>}
                              {guest.status === 'declined' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">Отказ</span>}
                              {guest.status === 'pending' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Ожидание</span>}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <button onClick={() => copyLink(guest.id)} className="text-gray-400 hover:text-gray-900 transition-all p-2 bg-gray-50 hover:bg-gray-100 rounded-md ring-1 ring-inset ring-gray-200" title="Копировать ссылку">
                                  <Copy size={16} />
                                </button>
                                <div 
                                  className="w-10 h-10 bg-white border border-gray-100 rounded flex items-center justify-center overflow-hidden cursor-pointer hover:border-gray-300 transition-colors"
                                  onClick={() => setQrModal({ id: guest.id, url: `${window.location.origin}/invite/${guest.id}` })}
                                  title="Открыть QR-код"
                                >
                                  <QRCodeSVG value={`${window.location.origin}/invite/${guest.id}`} size={32} level="L" marginSize={1} />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button onClick={() => handleDelete(guest.id)} className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-rose-600 transition-all p-2 bg-white rounded-md hover:bg-rose-50" title="Удалить">
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
           key="settings"
           initial={{ opacity: 0, scale: 0.98 }}
           animate={{ opacity: 1, scale: 1 }}
           exit={{ opacity: 0, scale: 0.98 }}
           transition={{ duration: 0.2 }}
           className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8"
        >
           <div className="w-full md:w-1/3">
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-8">
               <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <h3 className="font-medium text-gray-700">Все категории</h3>
                 <button onClick={createNewCategory} className="text-sm text-gray-900 bg-white border border-gray-200 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer">
                   + Новая
                 </button>
               </div>
               <div className="divide-y divide-gray-50 max-h-[60vh] overflow-y-auto">
                 {categories.map(cat => (
                   <div 
                     key={cat.id} 
                     className={`p-4 flex justify-between items-center cursor-pointer transition-colors ${editingCategory?.id === cat.id ? 'bg-gray-900/5' : 'hover:bg-gray-50'}`}
                     onClick={() => setEditingCategory(cat)}
                   >
                     <div>
                       <div className="font-medium text-gray-900">{cat.name}</div>
                       <div className="text-xs text-gray-500 mt-1">{cat.groomName} & {cat.brideName}</div>
                     </div>
                     <div className="flex gap-2">
                       <button onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); }} className="p-1.5 text-gray-400 hover:text-gray-900 cursor-pointer text-left focus:outline-none"><Edit3 size={16} /></button>
                       <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }} className="p-1.5 text-gray-400 hover:text-rose-600 cursor-pointer text-left focus:outline-none"><Trash2 size={16} /></button>
                     </div>
                   </div>
                 ))}
                 {categories.length === 0 && (
                   <div className="p-6 text-center text-gray-500 text-sm">Нет категорий мероприятий. Создайте новую.</div>
                 )}
               </div>
             </div>
           </div>
           
           <div className="w-full md:w-2/3">
             <AnimatePresence mode="wait">
             {editingCategory ? (
              <motion.div 
                 key={editingCategory.id}
                 initial={{ opacity: 0, x: 10 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -10 }}
                 transition={{ duration: 0.2 }}
                 className="bg-white p-8 rounded-xl shadow-sm border border-gray-100"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-serif text-gray-900">Редактирование категории</h2>
                  <button onClick={() => setEditingCategory(null)} className="text-gray-400 hover:text-gray-900 cursor-pointer hover:bg-gray-100 p-1.5 rounded-full transition-colors text-left focus:outline-none"><XCircle size={24} /></button>
                </div>
                <form onSubmit={handleSaveCategory} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Название категории (Внутреннее)</label>
                    <input
                      type="text"
                      required
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                      placeholder="Например: Основная свадьба"
                      className="w-full px-4 py-2 border text-gray-900 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Имя жениха</label>
                      <input
                        type="text"
                        required
                        value={editingCategory.groomName}
                        onChange={(e) => setEditingCategory({...editingCategory, groomName: e.target.value})}
                        className="w-full px-4 py-2 border text-gray-900 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Имя невесты</label>
                      <input
                        type="text"
                        required
                        value={editingCategory.brideName}
                        onChange={(e) => setEditingCategory({...editingCategory, brideName: e.target.value})}
                        className="w-full px-4 py-2 border text-gray-900 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Дата свадьбы</label>
                      <input
                        type="date"
                        required
                        value={editingCategory.date}
                        onChange={(e) => setEditingCategory({...editingCategory, date: e.target.value})}
                        className="w-full px-4 py-2 border text-gray-900 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 bg-white shadow-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Время сбора (ЧЧ:ММ)</label>
                      <input
                        type="time"
                        required
                        value={editingCategory.time}
                        onChange={(e) => setEditingCategory({...editingCategory, time: e.target.value})}
                        className="w-full px-4 py-2 border text-gray-900 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Название места проведения</label>
                    <input
                      type="text"
                      required
                      value={editingCategory.venueName}
                      onChange={(e) => setEditingCategory({...editingCategory, venueName: e.target.value})}
                      placeholder="Например: Ресторан 'Панорама'"
                      className="w-full px-4 py-2 border text-gray-900 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Адрес места проведения</label>
                    <input
                      type="text"
                      required
                      value={editingCategory.venueAddress}
                      onChange={(e) => setEditingCategory({...editingCategory, venueAddress: e.target.value})}
                      className="w-full px-4 py-2 border text-gray-900 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка на Яндекс/Google карты (опционально)</label>
                    <input
                      type="text"
                      value={editingCategory.venueMapLink || ''}
                      onChange={(e) => setEditingCategory({...editingCategory, venueMapLink: e.target.value})}
                      placeholder="https://yandex.ru/maps/..."
                      className="w-full px-4 py-2 border text-gray-900 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Акцентный цвет (HEX)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        required
                        value={editingCategory.accentColor}
                        onChange={(e) => setEditingCategory({...editingCategory, accentColor: e.target.value})}
                        className="w-12 h-10 border-0 rounded cursor-pointer p-0 shadow-none border-none outline-none focus:ring-0 focus:outline-none"
                      />
                      <input
                        type="text"
                        required
                        value={editingCategory.accentColor}
                        onChange={(e) => setEditingCategory({...editingCategory, accentColor: e.target.value})}
                        className="flex-1 px-4 py-2 border text-gray-900 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 uppercase"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <div className="mb-6">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Текст для блока Дресс-код</label>
                      <textarea
                        rows={4}
                        value={editingCategory.dressCodeText || ''}
                        onChange={(e) => setEditingCategory({...editingCategory, dressCodeText: e.target.value})}
                        placeholder="Опишите желаемый дресс-код..."
                        className="w-full px-4 py-2 border text-gray-900 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900"
                      />
                    </div>

                    <div className="mb-6">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Текст для блока Пожелания</label>
                      <textarea
                        rows={4}
                        value={editingCategory.wishesText || ''}
                        onChange={(e) => setEditingCategory({...editingCategory, wishesText: e.target.value})}
                        placeholder="Напишите ваши пожелания гостям..."
                        className="w-full px-4 py-2 border text-gray-900 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="w-full bg-gray-900 hover:bg-black text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-75 cursor-pointer"
                    >
                      <Save size={18} />
                      {savingSettings ? 'Сохранение...' : 'Сохранить настройки'}
                    </button>
                  </div>
                </form>
              </motion.div>
             ) : (
               <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                 className="bg-gray-50 border border-gray-200 rounded-xl border-dashed h-full min-h-[300px] flex items-center justify-center text-gray-400"
               >
                 Выберите категорию слева или создайте новую
               </motion.div>
             )}
             </AnimatePresence>
           </div>
        </motion.div>
      )}
      </AnimatePresence>
      
      {/* Footer Learn IT Badge */}
      <div className="mt-12 mb-4 flex justify-center text-center">
        <a 
          href="https://www.learn-it-academy.site/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full overflow-hidden transition-all duration-300 hover:scale-105 bg-white border border-gray-200 hover:border-[#111] shadow-sm hover:shadow-lg hover:shadow-red-500/10"
        >
          <div className="absolute inset-0 bg-[#111111] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
          
          <span className="relative z-10 text-xs font-medium text-gray-500 group-hover:text-gray-300 transition-colors duration-500 flex items-center gap-2">
            Разработано в 
            <span className="font-bold text-gray-900 group-hover:text-[#ff4444] transition-colors duration-500 flex items-center gap-1.5">
              <Boxes size={14} strokeWidth={2.5} className="transition-transform duration-500 group-hover:rotate-12" />
              LEARN IT
            </span>
          </span>
        </a>
      </div>

    </div>
  );
}

