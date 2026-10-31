'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export function OdometerNumber({ value, className = '' }) {
  const digits = value.toString().split('');

  return (
    <div className={`inline-flex relative h-[56px] sm:h-[84px] md:h-[96px] overflow-hidden select-none bg-transparent ${className}`}>
      {digits.map((digit, idx) => {
        const isDigit = !isNaN(parseInt(digit));
        if (!isDigit) {
          return (
            <span key={idx} className="h-full flex items-center justify-center px-0.5 select-none font-bold">
              {digit}
            </span>
          );
        }
        return (
          <div key={idx} className="relative h-full w-[0.64em] overflow-hidden">
            <div
              className="flex flex-col transition-transform duration-500 ease-out"
              style={{
                transform: `translateY(-${parseInt(digit) * 10}%)`,
              }}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <span
                  key={num}
                  className="h-[56px] sm:h-[84px] md:h-[96px] flex items-center justify-center font-bold flex-shrink-0"
                >
                  {num}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function launchConfetti(canvas) {
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#111111', '#00c853', '#ea580c', '#3b82f6', '#eab308', '#ec4899', '#9333ea'];
  const count = 140;

  const particles = Array.from({ length: count }, () => ({
    x: canvas.width / 2 + (Math.random() - 0.5) * (canvas.width * 0.4),
    y: canvas.height * 0.4,
    vx: (Math.random() - 0.5) * 22,
    vy: -(Math.random() * 16 + 10),
    size: Math.random() * 8 + 6,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * 14,
    alpha: 1,
  }));

  let animId;
  function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = 0;

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.45; // Gravity
      p.vx *= 0.98; // Air resistance
      p.rotation += p.rotSpeed;
      p.alpha -= 0.005;

      if (p.alpha > 0) {
        alive++;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
    });

    if (alive > 0) {
      animId = requestAnimationFrame(update);
    }
  }

  animId = requestAnimationFrame(update);
  return () => cancelAnimationFrame(animId);
}

function getTimeUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  const diff = Math.max(0, midnight.getTime() - now.getTime());

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds, isLive: diff <= 0 };
}

export default function LaunchingSoonPage() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, isLive: false });
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef(null);
  const confettiFiredRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    const initial = getTimeUntilMidnight();
    setTimeLeft(initial);

    const timer = setInterval(() => {
      const next = getTimeUntilMidnight();
      setTimeLeft(next);

      // Trigger confetti & unlock when time hits 0
      if (next.isLive && !confettiFiredRef.current) {
        confettiFiredRef.current = true;
        try {
          localStorage.setItem('sonu_site_unlocked', 'true');
          document.cookie = 'sonu_site_unlocked=true; path=/; max-age=31536000';
        } catch (e) {}

        if (canvasRef.current) {
          launchConfetti(canvasRef.current);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="w-full flex-1 flex flex-col justify-center items-center bg-white text-[#111111] select-none min-h-[70vh] py-16 sm:py-24 relative overflow-hidden"
      style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
    >
      {/* Confetti Overlay Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-50 w-full h-full"
      />

      <div className="w-full max-w-[1240px] mx-auto px-6 sm:px-10 flex flex-col items-center justify-center text-center relative z-10">
        {/* Eyebrow Tag */}
     

        {/* Big Signature Headline */}
        <h1
          className="text-[44px] sm:text-[72px] lg:text-[88px] font-black uppercase text-[#111111] tracking-[-0.03em] leading-[0.95] max-w-4xl"
          style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
        >
          {timeLeft.isLive ? 'We Are Live.' : 'Launching Soon.'}
        </h1>

        

        {/* Live CTA button or Countdown Timer */}
        {timeLeft.isLive ? (
          <div className="mt-8 sm:mt-10 animate-in fade-in zoom-in-95 duration-300">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-[#111111] hover:bg-black text-white px-8 py-3.5 rounded-full text-[15px] font-medium transition-all shadow-md active:scale-95"
              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
            >
              Enter Store &rarr;
            </Link>
          </div>
        ) : (
          mounted && (
            <div className="mt-8 sm:mt-12 flex items-center justify-center gap-3 sm:gap-6 font-['Helvetica_Now_Text_Medium',sans-serif]">
              {/* Hours */}
              <div className="flex flex-col items-center w-[74px] sm:w-[110px]">
                <OdometerNumber
                  value={String(timeLeft.hours).padStart(2, '0')}
                  className="text-[44px] sm:text-[72px] md:text-[84px] font-bold text-[#111111]"
                />
                <span className="text-[10px] sm:text-[12px] uppercase tracking-[0.2em] text-[#707072] mt-2 sm:mt-3 font-normal">
                  Hours
                </span>
              </div>

              <span className="text-[32px] sm:text-[60px] font-light text-[#707072]/50 -mt-6 sm:-mt-8 select-none">
                :
              </span>

              {/* Minutes */}
              <div className="flex flex-col items-center w-[74px] sm:w-[110px]">
                <OdometerNumber
                  value={String(timeLeft.minutes).padStart(2, '0')}
                  className="text-[44px] sm:text-[72px] md:text-[84px] font-bold text-[#111111]"
                />
                <span className="text-[10px] sm:text-[12px] uppercase tracking-[0.2em] text-[#707072] mt-2 sm:mt-3 font-normal">
                  Minutes
                </span>
              </div>

              <span className="text-[32px] sm:text-[60px] font-light text-[#707072]/50 -mt-6 sm:-mt-8 select-none">
                :
              </span>

              {/* Seconds */}
              <div className="flex flex-col items-center w-[74px] sm:w-[110px]">
                <OdometerNumber
                  value={String(timeLeft.seconds).padStart(2, '0')}
                  className="text-[44px] sm:text-[72px] md:text-[84px] font-bold text-[#111111]"
                />
                <span className="text-[10px] sm:text-[12px] uppercase tracking-[0.2em] text-[#707072] mt-2 sm:mt-3 font-normal">
                  Seconds
                </span>
              </div>
            </div>
          )
        )}

       
      </div>
    </div>
  );
}
