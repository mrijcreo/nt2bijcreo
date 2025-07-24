import ListeningExerciseApp from '@/components/ListeningExerciseApp'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full mb-6 shadow-lg">
            <div className="text-white text-2xl font-bold">
              NT2
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            App gemaakt voor NT2
          </h1>
          
          <p className="text-xl text-blue-700 font-medium mb-6">
            Luisteroefeningen met Vlaams Nederlands TTS en quizvragen voor alle ERK-niveaus
          </p>
        </div>

        {/* Main App */}
        <ListeningExerciseApp />
      </div>
    </div>
  )
}