import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, Boxes } from 'lucide-react';
import type { Guest, WeddingSettings } from '../types';

import { supabase } from '../supabase';

const FloatingParticles = () => {
  const [particles] = useState(() => [...Array(40)].map((_, i) => ({
    id: i,
    startX: Math.random() * 100,
    endX: Math.random() * 100,
    size: Math.random() * 12 + 6,
    duration: Math.random() * 20 + 20,
    delay: Math.random() * -30,
    isPetal: Math.random() > 0.5,
    rotation: Math.random() * 360
  })));

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: "-10vh", x: `${p.startX}vw`, rotate: p.rotation, opacity: 0 }}
          animate={{
            y: "110vh",
            x: `${p.endX}vw`,
            rotate: p.rotation + 360,
            opacity: [0, 1, 1, 0]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
            times: [0, 0.1, 0.9, 1]
          }}
          className={`absolute ${p.isPetal ? 'rounded-tl-full rounded-br-full rounded-tr-sm rounded-bl-sm shadow-sm' : 'rounded-full'}`}
          style={{
            width: p.size,
            height: p.isPetal ? p.size * 1.5 : p.size,
            background: p.isPetal ? 'linear-gradient(135deg, #fce7f3 0%, #fecdd3 100%)' : 'radial-gradient(circle, #fff7ed 0%, #fed7aa 100%)',
            filter: p.isPetal ? 'drop-shadow(0 4px 6px rgba(254, 205, 211, 0.3))' : 'blur(1px) drop-shadow(0 0 8px rgba(254, 215, 170, 0.6))',
            mixBlendMode: p.isPetal ? 'multiply' : 'screen'
          }}
        />
      ))}
    </div>
  );
};

export default function InvitationView() {
  const { id } = useParams();
  const [guest, setGuest] = useState<Guest | null>(null);
  const [settings, setSettings] = useState<WeddingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [rsvpState, setRsvpState] = useState<'pending' | 'attending' | 'declined'>('pending');
  const [dietary, setDietary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [isOpened, setIsOpened] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number} | null>(null);

  useEffect(() => {
    document.fonts.ready.then(() => {
      setFontsLoaded(true);
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: guestData, error: guestError } = await supabase.from('guests').select('*').eq('id', id).single();
        if (guestError || !guestData) throw new Error();
        
        let settingsId = guestData.eventId || 'default-event';
        let { data: settingsData, error: settingsError } = await supabase.from('settings').select('*').eq('id', settingsId).single();
        
        if (settingsError || !settingsData) {
           const { data: allSettings } = await supabase.from('settings').select('*').limit(1);
           if (allSettings && allSettings.length > 0) {
             settingsData = allSettings[0];
           }
        }
        
        setGuest(guestData);
        setSettings(settingsData as WeddingSettings);
        
        if (guestData.status !== 'pending') {
          setRsvpState(guestData.status === 'accepted' ? 'attending' : 'declined');
          setDietary(guestData.dietaryRestrictions || '');
          if (guestData.status === 'accepted' || guestData.status === 'declined') {
             setSuccess(true);
          }
        }
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (!settings?.date) return;
    
    // Timer logic
    const calculateTimeLeft = () => {
      const difference = new Date(`${settings.date}T${settings.time || '12:00'}:00`).getTime() - new Date().getTime();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft(null);
      }
    };
    
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [settings?.date, settings?.time]);

  // Lock body scroll when not opened
  useEffect(() => {
    if (!isOpened) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpened]);

  const handleRSVP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rsvpState === 'pending') return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('guests').update({
        status: rsvpState === 'attending' ? 'accepted' : 'declined',
        dietaryRestrictions: dietary,
      }).eq('id', id);
      
      if (!error) {
        setSuccess(true);
      } else {
        console.error('RSVP error:', error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCalendar = (dateStr: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const month = date.getMonth();
    const year = date.getFullYear();
    const targetDay = date.getDate();
    
    const firstDay = new Date(year, month, 1).getDay();
    // JS days: 0 is Sun, 1 is Mon. Adjust to Mon=0, Sun=6.
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    const dayNames = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
    
    const cells = [];
    for (let i = 0; i < startOffset; i++) {
       cells.push(<div key={`empty-${i}`} className="text-center text-transparent">0</div>);
    }
    for (let i = 1; i <= daysInMonth; i++) {
       const isTarget = i === targetDay;
       cells.push(
         <div key={i} className={`relative flex items-center justify-center text-sm ${isTarget ? 'text-[#8a7f76]' : 'text-gray-500'}`}>
            <span className={isTarget ? 'relative z-10' : ''}>{i}</span>
            {isTarget && (
               <Heart className="absolute w-8 h-8 text-[#cbae9e] opacity-50 z-0" strokeWidth={1.5} />
            )}
         </div>
       );
    }
    
    return (
       <div className="w-full max-w-[280px] mx-auto my-6">
         <div className="text-3xl font-serif text-[#5a504a] text-center mb-6 capitalize">{monthNames[month]}, {year}</div>
         <div className="grid grid-cols-7 gap-y-4 gap-x-2">
            {dayNames.map(d => <div key={d} className="text-xs text-gray-400 font-sans text-center mb-2">{d}</div>)}
            {cells}
         </div>
       </div>
    );
  };

  if (loading || !fontsLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fffdf9]" style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/rice-paper.png")` }}>
         <div className="relative w-28 h-28 mb-10 flex items-center justify-center">
            <div className="absolute inset-0 border-t-2 border-[#cbae9e] rounded-full animate-[spin_2s_linear_infinite] opacity-70"></div>
            <div className="absolute inset-2 border-r-2 border-[#b59e78] rounded-full animate-[spin_3s_linear_infinite_reverse] opacity-60"></div>
            <div className="absolute inset-4 border-b-2 border-[#a79485] rounded-full animate-[spin_4s_linear_infinite] opacity-50"></div>
            <Heart className="text-[#b5a396] animate-pulse scale-125" fill="currentColor" strokeWidth={1} size={32} />
         </div>
         <div className="text-[#a79485] uppercase tracking-[0.4em] text-xs font-sans animate-pulse">Создаём магию...</div>
      </div>
    );
  }

  if (error || !guest || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfaf6]">
        <div className="text-center p-8">
          <h2 className="text-2xl font-serif text-gray-900 mb-2">Приглашение не найдено</h2>
          <p className="text-gray-500 font-sans">Пожалуйста, проверьте правильность ссылки.</p>
        </div>
      </div>
    );
  }

  const bgStyle = {
    backgroundColor: '#fffdf9',
    backgroundImage: `url("https://www.transparenttextures.com/patterns/rice-paper.png"), url("https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=2000&sort=luxurious&q=80")`,
    backgroundSize: 'auto, cover',
    backgroundPosition: 'center, center',
    backgroundBlendMode: 'multiply, soft-light',
    backgroundAttachment: 'fixed, fixed'
  };

  return (
    <div className="min-h-screen relative font-serif text-[#4a4a4a] overflow-x-hidden" style={bgStyle}>
      <FloatingParticles />


      {/* Cover Screen */}
      <AnimatePresence>
        {!isOpened && (
          <motion.div 
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 0.9, ease: [0.6, -0.05, 0.01, 1] }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
            style={{
              backgroundColor: '#fffdf9',
              backgroundImage: `url("https://www.transparenttextures.com/patterns/rice-paper.png"), url("https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=80")`,
              backgroundSize: 'auto, cover',
              backgroundPosition: 'center, center',
              backgroundBlendMode: 'multiply, soft-light'
            }}
          >
            <div className="absolute inset-0 border-[16px] md:border-[24px] border-[#fffdf9] pointer-events-none z-10 box-border"></div>
            <div className="absolute inset-4 md:inset-6 border-2 border-double border-[#cbae9e]/60 pointer-events-none z-10 rounded-sm"></div>
            
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.3, duration: 1.2, ease: "easeOut" }}
               className="text-center flex flex-col items-center relative z-20"
            >
              <div className="w-[1px] h-20 bg-gradient-to-b from-transparent to-[#cbae9e]/70 mb-10 mx-auto hidden md:block"></div>
              
              <h1 className="text-xl md:text-2xl uppercase tracking-[0.4em] font-sans text-[#a79485] mb-6">
                Свадебное Приглашение
              </h1>
              
              <div className="text-6xl md:text-8xl font-script text-[#b59e78] mb-14 drop-shadow-sm px-4 leading-tight">
                {settings.groomName} <span className="text-4xl text-[#cbae9e] mx-4">&</span> {settings.brideName}
              </div>
              
              <button 
                onClick={() => setIsOpened(true)}
                className="w-28 h-28 rounded-full bg-[#af2d2d] flex items-center justify-center transition-transform hover:scale-110 active:scale-95 group relative shadow-[0_8px_30px_rgba(175,45,45,0.4)] z-50 cursor-pointer"
              >
                  {/* Wax seal effect wrapper */}
                 <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#d43737] via-[#b31f1f] to-[#7a1212] shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-2px_6px_rgba(0,0,0,0.5)] border-[1px] border-[#ea9999]"></div>
                 <div className="absolute inset-1 rounded-full border border-white/20 pointer-events-none"></div>
                 <div className="relative text-[#fdf0ed] drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)] flex flex-col items-center">
                    <Heart size={32} className="mx-auto block" fill="currentColor" />
                 </div>
              </button>
              <p className="mt-8 text-xs tracking-[0.3em] font-sans text-[#a79485] uppercase">Открыть конверт</p>
            </motion.div>
            
            {/* Floral decorations */}
            <div className="absolute top-0 right-0 w-80 h-80 md:w-[32rem] md:h-[32rem] bg-[url('https://images.unsplash.com/photo-1507290439931-a861b5a38200?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')] bg-cover opacity-15 pointer-events-none rounded-bl-full" style={{ mixBlendMode: 'multiply' }}></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 md:w-[32rem] md:h-[32rem] bg-[url('https://images.unsplash.com/photo-1507290439931-a861b5a38200?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')] bg-cover opacity-15 pointer-events-none rounded-tr-full transform rotate-180" style={{ mixBlendMode: 'multiply' }}></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`w-full max-w-2xl mx-auto bg-white/70 backdrop-blur-md shadow-[0_0_60px_rgba(0,0,0,0.08)] min-h-screen pb-24 ${isOpened ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000 relative z-10 border-x border-[#cbae9e]/20`}>
        
        {/* Decorative corner borders */}
        <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-[#b59e78]/60 rounded-tl-xl pointer-events-none"></div>
        <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-[#b59e78]/60 rounded-tr-xl pointer-events-none"></div>
        
        {/* Header Names */}
        <section className="pt-28 pb-16 px-6 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-20 h-20 mx-auto mb-8 bg-[url('https://images.unsplash.com/photo-1544367567-0f2fcb046ebf?auto=format&fit=crop&w=200&q=80')] bg-cover border border-[#cbae9e]/40 rounded-full shadow-md" style={{ mixBlendMode: 'multiply' }}></div>
            <h1 className="text-[3rem] md:text-7xl text-[#51433a] leading-tight mb-2 font-semibold" style={{ fontFamily: 'var(--font-serif)' }}>
              {settings.groomName} <br/> <span className="font-script text-6xl text-[#b59e78] drop-shadow-md">и</span> <br/> {settings.brideName}
            </h1>
          </motion.div>
        </section>

        {/* Greeting block */}
        <section className="py-16 px-8 text-center bg-gradient-to-b from-transparent via-white/50 to-transparent relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-[#cbae9e] to-transparent"></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-[#cbae9e] to-transparent"></div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-4xl font-script text-[#b5a396] mb-8">{guest?.greetingType} {guest?.name}!</h2>
            <p className="text-lg leading-relaxed text-[#5a504a] font-medium max-w-md mx-auto">
              {guest?.customMessage}
            </p>
          </motion.div>
        </section>

        {/* Calendar */}
        <section className="py-16 px-6 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            {renderCalendar(settings.date)}
            <div className="mt-10 text-lg text-[#5a504a] font-serif border-y border-[#cbae9e]/40 py-3 px-8 inline-block shadow-sm bg-white/30 tracking-wide">
              {settings.time} – Сбор гостей
            </div>
          </motion.div>
        </section>

        {/* Venue */}
        <section className="py-20 px-6 text-center bg-white/60 relative">
           <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <h2 className="text-5xl font-script text-[#b5a396] mb-8 drop-shadow-[0_2px_2px_rgba(0,0,0,0.05)]">Место проведения</h2>
            <div className="p-6 border border-[#cbae9e]/30 bg-white/40 rounded-xl shadow-sm w-full max-w-xs relative">
               <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#fffdf9] rotate-45 border border-[#cbae9e]/30 z-0"></div>
               <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#fffdf9] rotate-45 border border-[#cbae9e]/30 z-0" style={{ borderTop: 'none', borderLeft: 'none' }}></div>
               <p className="text-2xl font-serif text-[#3b3734] mb-3 font-semibold relative z-10">« {settings.venueName} »</p>
               <p className="text-[#6b6058] mb-6 text-lg relative z-10 font-medium">{settings.venueAddress}</p>
               
               <a 
                 href={settings.venueMapLink || `https://yandex.ru/maps/?text=${encodeURIComponent(settings.venueAddress || '')}`}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="px-8 py-3 bg-[#b5a396] text-white text-sm uppercase tracking-widest font-sans hover:bg-[#8f8075] shadow-md transition-colors block w-fit mx-auto relative z-10 rounded-full"
               >
                 Как добраться
               </a>
            </div>
          </motion.div>
        </section>

        {/* Dress Code */}
        <section className="py-20 px-8 text-center text-lg relative">
           <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-white/60 backdrop-blur-sm rounded-3xl p-10 shadow-[0_4px_30px_rgba(0,0,0,0.05)] border border-white relative w-full max-w-sm mx-auto"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[url('https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80')] bg-cover opacity-20 pointer-events-none rounded-bl-3xl" style={{ mixBlendMode: 'multiply' }}></div>
            <h2 className="text-5xl font-script text-[#b5a396] mb-8 relative z-10 drop-shadow-sm">Дресс-код</h2>
            <div className="relative z-10 text-[#5a504a] font-medium leading-relaxed">
              {settings.dressCodeText ? (
                settings.dressCodeText.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-5">{paragraph}</p>
                ))
              ) : (
                <>
                  <p className="mb-5">Мы решили отказаться от строгого дресс-кода и не ограничивать вас определенными цветами или стилем.</p>
                  <p className="mb-5">Для нас самое главное – ваше присутствие, улыбки и хорошее настроение в этот день!</p>
                  <p className="mb-5">Выбирайте образ, в котором вы будете чувствовать себя красиво и комфортно.</p>
                  <p>Единственная просьба – просим девушек воздержаться от белых платьев, чтобы этот цвет остался исключительно за невестой.</p>
                </>
              )}
            </div>
          </motion.div>
        </section>

        {/* Wishes */}
        <section className="py-16 px-8 text-center text-lg bg-gradient-to-t from-transparent via-white/50 to-transparent relative">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-[#cbae9e] to-transparent"></div>
           <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-md mx-auto"
          >
            <h2 className="text-5xl font-script text-[#b5a396] mb-8 drop-shadow-sm">Пожелания</h2>
            <div className="text-[#5a504a]">
              {settings.wishesText ? (
                settings.wishesText.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-5 leading-relaxed font-semibold italic">{paragraph}</p>
                ))
              ) : (
                <>
                  <p className="mb-5 italic font-semibold">Настоящая свадьба – это когда стол ломится от угощений, а ноги сами просятся в пляс.</p>
                  <p className="mb-5 italic font-semibold">Друзья, наше вам пожелание: будьте сегодня в ударе! Не ждите, пока вас пойдут приглашать танцевать – услышали ритм, бросайте всё и в круг!</p>
                  <p className="italic font-semibold">Нам очень нужна ваша поддержка в танце. Чем дружнее вы будете выходить, тем ярче и счастливее будет наша свадьба!</p>
                </>
              )}
            </div>
          </motion.div>
        </section>

        {/* Timer */}
        {timeLeft && (
          <section className="pt-12 pb-16 px-6 text-center">
            <h3 className="text-[#a79485] uppercase tracking-[0.3em] text-xs font-sans mb-10">Событие начнется через...</h3>
            <div className="flex items-center justify-center space-x-2 md:space-x-4 text-[#5a504a]">
              <div className="w-16 md:w-20">
                 <div className="text-4xl md:text-5xl font-serif mb-2 text-[#b59e78]">{timeLeft.days}</div>
                 <div className="text-[9px] uppercase tracking-widest font-sans text-[#8a7f76]">Дней</div>
              </div>
              <div className="text-3xl text-[#cbae9e] mb-6 font-light">:</div>
              <div className="w-16 md:w-20">
                 <div className="text-4xl md:text-5xl font-serif mb-2 text-[#b59e78]">{timeLeft.hours}</div>
                 <div className="text-[9px] uppercase tracking-widest font-sans text-[#8a7f76]">Часов</div>
              </div>
              <div className="text-3xl text-[#cbae9e] mb-6 font-light">:</div>
              <div className="w-16 md:w-20">
                 <div className="text-4xl md:text-5xl font-serif mb-2 text-[#b59e78]">{timeLeft.minutes}</div>
                 <div className="text-[9px] uppercase tracking-widest font-sans text-[#8a7f76]">Минут</div>
              </div>
              <div className="text-3xl text-[#cbae9e] mb-6 font-light hidden sm:block">:</div>
              <div className="w-16 md:w-20 hidden sm:block">
                 <div className="text-4xl md:text-5xl font-serif mb-2 text-[#b59e78]">{timeLeft.seconds}</div>
                 <div className="text-[9px] uppercase tracking-widest font-sans text-[#8a7f76]">Секунд</div>
              </div>
            </div>
          </section>
        )}

        {/* RSVP System */}
        <section className="py-16 px-6 pb-24 relative">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-[#cbae9e] to-transparent"></div>
           <div className="max-w-md mx-auto pt-8">
             {!success ? (
               <div className="w-full bg-white/50 backdrop-blur-sm p-8 rounded-2xl shadow-sm border border-white">
                  <h3 className="text-center font-serif text-3xl text-[#4a4a4a] mb-8 font-medium">Присутствие</h3>
                  <form onSubmit={handleRSVP} className="space-y-4">
                     
                     <div 
                        onClick={() => setRsvpState('attending')}
                        className={`p-4 rounded-lg flex items-center justify-center border ${rsvpState === 'attending' ? 'border-[#b5a396] bg-[#fcf9f6] text-[#8c7462] shadow-inner' : 'border-[#d8d0c8] bg-white/40'} text-center cursor-pointer transition-all hover:border-[#b5a396] duration-300 font-medium`}
                     >
                        Я с удовольствием приду!
                     </div>
                     
                     <div 
                        onClick={() => setRsvpState('declined')}
                        className={`p-4 rounded-lg flex items-center justify-center border ${rsvpState === 'declined' ? 'border-[#b5a396] bg-[#fcf9f6] text-[#8c7462] shadow-inner' : 'border-[#d8d0c8] bg-white/40'} text-center cursor-pointer transition-all hover:border-[#b5a396] duration-300 font-medium`}
                     >
                        К сожалению, не смогу
                     </div>

                     <div className={`overflow-hidden transition-all duration-300 ease-in-out ${rsvpState === 'attending' ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0 pointer-events-none'}`}>
                        <div className="pt-2">
                          <label className="text-xs font-sans tracking-[0.1em] uppercase text-[#8a7f76] mb-3 block text-center">Особые пожелания по меню?</label>
                          <textarea 
                             rows={2}
                             value={dietary}
                             onChange={(e) => setDietary(e.target.value)}
                             className="w-full border border-[#d8d0c8] bg-white/60 p-4 focus:outline-none focus:border-[#b5a396] font-sans text-sm resize-none rounded-lg focus:shadow-[0_0_10px_rgba(181,163,150,0.2)] transition-shadow"
                             placeholder="Например: аллергия на орехи"
                          />
                        </div>
                     </div>

                     <button 
                        type="submit" 
                        disabled={rsvpState === 'pending' || isSubmitting}
                        className="w-full bg-[#b5a396] text-white py-4 rounded-lg uppercase font-sans tracking-[0.2em] text-xs mt-6 hover:bg-[#8f8075] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(181,163,150,0.3)] hover:shadow-[0_6px_20px_rgba(143,128,117,0.4)]"
                     >
                        {isSubmitting ? 'Отправка...' : 'Отправить ответ'}
                     </button>
                  </form>
               </div>
             ) : (
                <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="text-center w-full bg-white/50 backdrop-blur-sm p-10 rounded-2xl shadow-sm border border-white"
                >
                   <Heart className="w-16 h-16 text-[#b5a396] mx-auto mb-6 opacity-80 mix-blend-multiply" fill="currentColor" strokeWidth={1} />
                   <h3 className="text-3xl font-serif text-[#4a4a4a] mb-3">Ответ сохранен!</h3>
                   <p className="text-[#6b6058] font-sans text-sm tracking-wide uppercase">{rsvpState === 'attending' ? 'С нетерпением ждем вас' : 'Нам будет вас не хватать'}</p>
                </motion.div>
             )}
           </div>
        </section>

        {/* Learn IT Badge */}
        <div className="pt-8 pb-4 flex justify-center relative z-10 w-full mb-0">
          <a 
            href="https://www.learn-it-academy.site/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group relative inline-flex items-center justify-center px-6 py-3 overflow-hidden transition-all duration-500 rounded-2xl hover:scale-105 hover:shadow-[0_8px_30px_-5px_rgba(255,68,68,0.4)]"
          >
            <div className="absolute inset-0 bg-[#ffffff] backdrop-blur-md border border-[#cbae9e]/80 rounded-2xl transition-all duration-500 group-hover:bg-[#111111] group-hover:border-[#ff4444]/50 shadow-md"></div>
            <div className="absolute -inset-full top-0 z-0 block h-full w-1/2 -skew-x-12 transform bg-gradient-to-r from-transparent via-black/5 group-hover:via-white/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-[shimmer_1.5s_infinite]"></div>
            
            <span className="relative z-10 text-[10px] sm:text-xs font-sans tracking-[0.2em] text-[#5a504a] uppercase transition-colors duration-500 group-hover:text-gray-300 flex items-center gap-2">
              <span className="inline">Разработано в</span>
              <span className="font-bold text-[#b5a396] group-hover:text-[#ff4444] transition-colors duration-500 flex items-center gap-1.5 drop-shadow-sm group-hover:drop-shadow-[0_0_12px_rgba(255,68,68,0.6)]">
                <Boxes size={16} strokeWidth={2.5} className="transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
                LEARN IT
              </span>
            </span>
          </a>
        </div>

      </div>
    </div>
  );
}

