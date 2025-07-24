import ListeningExerciseApp from '@/components/ListeningExerciseApp'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M8.464 15.536a5 5 0 01-7.072 0M4.222 4.222a9 9 0 000 14.142M12 18.364l-1.414-1.414M12 5.636L10.586 7.05" />
            </svg>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Luisteroefeningen Generator
          </h1>
          
          <p className="text-xl text-blue-700 font-medium mb-6">
            Upload tekst, genereer audio met Gemini TTS en oefen met quizvragen op verschillende ERK-niveaus
          </p>
        </div>

        {/* Main App */}
        <ListeningExerciseApp />
      </div>
    </div>
  )
}