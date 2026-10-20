import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-white flex flex-col items-center justify-center px-6 text-center select-none font-['Helvetica_Now_Text_Medium',sans-serif]">
      <div className="max-w-[400px] flex flex-col items-center">
        <span className="text-[12px] font-bold uppercase tracking-widest text-[#707072] mb-2">
          404 / OFF THE PATH
        </span>
        <h1 className="text-[28px] sm:text-[34px] font-bold text-[#111111] tracking-tight leading-tight mb-2">
          This page took a wrong turn.
        </h1>
        <p className="text-[14px] sm:text-[15px] text-[#707072] mb-8 leading-relaxed">
          The shoes are still where you left them. Head back to the store to explore our latest drops.
        </p>
        <Link
          href="/"
          className="w-full py-3.5 sm:py-4 bg-[#111111] text-white text-[15px] font-medium rounded-full text-center hover:bg-neutral-800 active:scale-[0.99] transition-all"
        >
          Back to SONU
        </Link>
      </div>
    </div>
  );
}
