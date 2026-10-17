// Shared look of the modal dialogs. The overlay scrolls (instead of clipping)
// when the keyboard shrinks the viewport, and stays clear of the system bars.
export const dialogOverlay = 'fixed inset-0 z-50 bg-[#18352c]/45 pb-[var(--safe-area-inset-bottom,env(safe-area-inset-bottom))] pt-[var(--safe-area-inset-top,env(safe-area-inset-top))] backdrop-blur-[3px]';
export const dialogPanel = 'enter m-auto w-full max-w-[440px] rounded-[24px] border border-[#e6dfd1] bg-[#fbf8f0] p-6 shadow-[0_30px_80px_-30px_rgba(22,50,40,.4)] sm:p-8';
