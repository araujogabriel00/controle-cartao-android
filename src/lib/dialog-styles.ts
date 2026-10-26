// Shared look of the modal dialogs. The overlay scrolls (instead of clipping)
// when the keyboard shrinks the viewport, and stays clear of the system bars.
export const dialogOverlay = 'fixed inset-0 z-50 bg-[#18352c]/45 pb-[var(--safe-area-inset-bottom,env(safe-area-inset-bottom))] pt-[var(--safe-area-inset-top,env(safe-area-inset-top))] backdrop-blur-[3px]';
// Formulários abrem como folha de rodapé (specs/redesign-opcao-d-telas-de-apoio.md D3).
export const dialogPanel = 'enter mx-auto mt-auto w-full max-w-[440px] rounded-t-[24px] border border-b-0 border-line bg-surface p-5 pb-6 shadow-[0_-20px_60px_-30px_rgba(22,50,40,.4)]';
