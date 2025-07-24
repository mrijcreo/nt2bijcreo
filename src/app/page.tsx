import ListeningExerciseApp from '@/components/ListeningExerciseApp'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-purple-50" style={{
      background: 'linear-gradient(135deg, #fefce8 0%, #f3f4f6 50%, #f8fafc 100%)'
    }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 shadow-lg" style={{
            background: 'linear-gradient(135deg, #233975 0%, #eec434 100%)'
          }}>
            <div className="text-white text-3xl">
              🎧
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Luisteroefeningen voor NT2
          </h1>
          
          <p className="text-xl font-medium mb-6" style={{ color: '#233975' }}>
            Luisteroefeningen met Vlaams Nederlands TTS en quizvragen voor alle ERK-niveaus
          </p>
        </div>

        {/* Main App */}
        <ListeningExerciseApp />
        
        {/* Footer */}
        <footer className="mt-16 text-center py-8 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-2xl">💛</span>
            <p className="text-gray-600 font-medium">
              Gemaakt met liefde voor het volwassenenonderwijs
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}