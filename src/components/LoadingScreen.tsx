// app/films/components/LoadingScreen.tsx
export default function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-white mb-6" />
      <p className="text-lg tracking-wide font-gotham">Loading Films...</p>
    </div>
  );
}
